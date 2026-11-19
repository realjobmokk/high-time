// =============================================================================
// 💬 HighTime (고교타임) - 카카오톡 스타일 실시간 1:1 안전 채팅 화면
// - Supabase 실시간 동기화 + 읽음 표시(1) + 노란/하얀 말풍선 + Enter 전송 + 새 채팅 상대 선택
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatRoom, ChatMessage, CurrentUser, School } from '../../types';
import { buildUserChatKey } from '../../services/supabaseService';

interface DirectChatTabProps {
  chatRooms: ChatRoom[];
  currentUser: CurrentUser;
  currentSchool: School;
  onUpdateChatRoom: (roomId: string, messages: ChatMessage[]) => void;
  onMarkRoomRead?: (roomId: string) => void;
  onStartPeerChat?: (peer: { key: string; name: string; school: string; grade: string }) => void;
  initialOpenRoomId?: string | null;
  onRoomOpenChange?: (isOpen: boolean) => void;
}

const BLOCKED_PATTERNS = [
  /010[-\s]?\d{3,4}[-\s]?\d{4}/,
  /카톡|카카오톡|아이디|인스타|페메|전화번호|전번|연락처/,
  /시발|씨발|병신|개새끼|존나|미친놈/,
];

export const DirectChatTab: React.FC<DirectChatTabProps> = ({
  chatRooms,
  currentUser,
  currentSchool,
  onUpdateChatRoom,
  onMarkRoomRead,
  onStartPeerChat,
  initialOpenRoomId = null,
  onRoomOpenChange,
}) => {
  const [openRoomId, setOpenRoomId] = useState<string | null>(initialOpenRoomId);
  const [inputText, setInputText] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);

  const chatScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // 외부(전공게시판 1:1 질문 등)에서 특정 채팅방을 열어달라고 할 때 즉시 진입
  useEffect(() => {
    if (initialOpenRoomId) {
      setOpenRoomId(initialOpenRoomId);
      onMarkRoomRead?.(initialOpenRoomId);
    }
  }, [initialOpenRoomId]);

  const activeRoom = chatRooms.find((r) => r.id === openRoomId);

  // 대화방 열림 상태 알림 + 오른쪽에서 왼쪽으로 슬라이드 인 애니메이션
  useEffect(() => {
    const isOpen = Boolean(openRoomId && activeRoom);
    onRoomOpenChange?.(isOpen);
    if (isOpen) {
      slideAnim.setValue(360);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        slideAnim.setValue(0);
      });
    } else {
      slideAnim.setValue(0);
    }
  }, [openRoomId, Boolean(activeRoom)]);

  // 방 입장 또는 새 메시지 수신 시 읽음 처리 + 맨 아래 자동 스크롤
  useEffect(() => {
    if (openRoomId && activeRoom) {
      if (activeRoom.unreadCount > 0) {
        onMarkRoomRead?.(openRoomId);
      }
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 60);
    }
  }, [openRoomId, activeRoom?.messages.length]);

  // 메시지 전송 핸들러 (금칙어/연락처 차단 + 카톡 스타일 전송)
  const handleSend = () => {
    if (!activeRoom) return;
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setBlockError(null);

    const hasBlocked = BLOCKED_PATTERNS.some((pattern) => pattern.test(trimmed));
    if (hasBlocked) {
      setBlockError(
        '개인 연락처(전화번호·SNS·카톡ID) 요구나 비속어는 안전을 위해 전송할 수 없습니다.'
      );
      return;
    }

    const nowTime = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const myKey = buildUserChatKey(
      currentUser.username,
      currentUser.name,
      currentSchool.name
    );

    const myMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'me',
      senderKey: myKey,
      senderName: currentUser.name,
      text: trimmed,
      time: nowTime,
      isRead: false,
    };

    const updatedMsgs = [...activeRoom.messages, myMsg];
    onUpdateChatRoom(activeRoom.id, updatedMsgs);
    setInputText('');

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  // 1. 채팅 목록 화면
  if (!openRoomId || !activeRoom) {
    return (
      <View style={styles.container}>
        {/* 안전 사용 안내 배너 */}
        <View style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
          <Text style={styles.safetyBannerText}>
            HighTime 1:1 채팅은 실시간 안전 메시징입니다. 개인 연락처 요구 및 욕설/비방은 자동 검열·차단됩니다.
          </Text>
        </View>

        {/* 목록 헤더 */}
        <View style={styles.listTopBar}>
          <Text style={styles.listTopTitle}>대화 목록 ({chatRooms.length})</Text>
          <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>
            전공게시판 1:1 신청 전용
          </Text>
        </View>

        <ScrollView
          style={styles.roomList}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {chatRooms.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={44} color="#cbd5e1" />
              <Text style={styles.emptyText}>진행 중인 1:1 대화가 없습니다.</Text>
              <Text style={styles.emptySubText}>
                전공게시판에서 작성자에게 [1:1 채팅 신청]을 보내면 대화가 시작됩니다.
              </Text>
            </View>
          ) : (
            chatRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomCard}
                onPress={() => {
                  setOpenRoomId(room.id);
                  onMarkRoomRead?.(room.id);
                }}
                activeOpacity={0.75}
              >
                {/* 상대방 아바타 */}
                <View style={[styles.peerAvatar, { backgroundColor: room.avatarBg || '#dc2626' }]}>
                  <Text style={styles.peerAvatarText}>
                    {room.peerName.slice(0, 1)}
                  </Text>
                </View>

                <View style={styles.roomInfo}>
                  <View style={styles.roomInfoTop}>
                    <View style={styles.roomNameRow}>
                      <Text style={styles.roomPeerName}>{room.peerName}</Text>
                      {room.peerSchool ? (
                        <Text style={styles.roomPeerSchool}>· {room.peerSchool}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.roomTime}>{room.lastTime}</Text>
                  </View>
                  <View style={styles.roomInfoBottom}>
                    <Text style={styles.roomLastMsg} numberOfLines={1}>
                      {room.lastMessage}
                    </Text>
                    {room.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{room.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  // 2. HighTime 대화방 내부 화면 (오른쪽에서 왼쪽으로 슬라이드 인 + 전체 화면)
  return (
    <Animated.View style={[styles.chatContainer, { transform: [{ translateX: slideAnim }] }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
      {/* 대화방 상단 헤더 */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => setOpenRoomId(null)}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatPeerTitle}>{activeRoom.peerName}</Text>
          {activeRoom.peerSchool ? (
            <Text style={styles.chatPeerSub}>{activeRoom.peerSchool}</Text>
          ) : null}
        </View>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>실시간</Text>
        </View>
      </View>

      {/* 안전 안내 바 */}
      <View style={styles.roomSafetyBar}>
        <Ionicons name="lock-closed" size={12} color="#334155" />
        <Text style={styles.roomSafetyText}>{activeRoom.safetyNotice}</Text>
      </View>

      {/* 메시지 리스트 (카카오톡 스타일 하늘색 바탕 + 노란/흰 말풍선) */}
      <ScrollView
        ref={chatScrollRef}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.datePill}>
          <Text style={styles.datePillText}>오늘 대화</Text>
        </View>

        {activeRoom.messages.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>
              첫 메시지를 보내 대화를 시작해 보세요!
            </Text>
          </View>
        ) : (
          activeRoom.messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <View
                key={msg.id}
                style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowPeer]}
              >
                {!isMe && (
                  <View
                    style={[
                      styles.miniAvatar,
                      { backgroundColor: activeRoom.avatarBg || '#dc2626' },
                    ]}
                  >
                    <Text style={styles.miniAvatarText}>
                      {activeRoom.peerName.slice(0, 1)}
                    </Text>
                  </View>
                )}

                <View style={{ maxWidth: '75%' }}>
                  {!isMe && (
                    <Text style={styles.peerMsgSender}>{activeRoom.peerName}</Text>
                  )}
                  <View style={[styles.bubbleLine, isMe && styles.bubbleLineMe]}>
                    {isMe && (
                      <View style={styles.metaColRight}>
                        <Text
                          style={[
                            styles.readStatusText,
                            msg.isRead ? styles.readStatusDone : styles.readStatusSent,
                          ]}
                        >
                          {msg.isRead ? '읽음' : '전송됨'}
                        </Text>
                        <Text style={styles.msgTime}>{msg.time}</Text>
                      </View>
                    )}

                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleHighTimeMe : styles.bubbleHighTimePeer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.msgText,
                          isMe ? styles.msgTextHighTimeMe : styles.msgTextPeer,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>

                    {!isMe && <Text style={styles.msgTime}>{msg.time}</Text>}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {blockError && (
        <View style={styles.blockErrorBar}>
          <Ionicons name="warning" size={14} color="#dc2626" />
          <Text style={styles.blockErrorText}>{blockError}</Text>
        </View>
      )}

      {/* 하단 메시지 입력창 */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          value={inputText}
          onChangeText={(t) => {
            setInputText(t);
            if (blockError) setBlockError(null);
          }}
          placeholder="질문이나 메시지를 입력하세요..."
          placeholderTextColor="#94a3b8"
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && { backgroundColor: '#cbd5e1' }]}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  safetyBannerText: {
    fontSize: 11,
    color: '#15803d',
    flex: 1,
    lineHeight: 16,
  },
  listTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listTopTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dc2626',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  newChatBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  roomList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 17,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  peerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  roomInfo: {
    flex: 1,
  },
  roomInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roomPeerName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  roomPeerSchool: {
    fontSize: 11,
    color: '#64748b',
  },
  roomTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  roomInfoBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  roomLastMsg: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  peerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  peerModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
  },
  peerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  peerModalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  peerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  peerSelectAvatar: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    marginRight: 10,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatPeerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  chatPeerSub: {
    fontSize: 11,
    color: '#64748b',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  roomSafetyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ffe4e6',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  roomSafetyText: {
    fontSize: 10,
    color: '#9f1239',
    flex: 1,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: 14,
    gap: 10,
  },
  datePill: {
    alignSelf: 'center',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  datePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgRowPeer: {
    justifyContent: 'flex-start',
  },
  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  peerMsgSender: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  bubbleLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  bubbleLineMe: {
    justifyContent: 'flex-end',
  },
  metaColRight: {
    alignItems: 'flex-end',
  },
  readStatusText: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 1,
  },
  readStatusDone: {
    color: '#dc2626',
  },
  readStatusSent: {
    color: '#94a3b8',
  },
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 16,
    maxWidth: '82%',
  },
  bubbleHighTimeMe: {
    backgroundColor: '#dc2626',
    borderBottomRightRadius: 4,
  },
  bubbleHighTimePeer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  msgTextHighTimeMe: {
    color: '#ffffff',
    fontWeight: '600',
  },
  msgTextPeer: {
    color: '#1e293b',
  },
  msgTime: {
    fontSize: 9,
    color: '#94a3b8',
  },
  blockErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  blockErrorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1e293b',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
