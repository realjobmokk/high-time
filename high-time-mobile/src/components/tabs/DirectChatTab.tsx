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
import { COLORS } from '../../theme/colors';

interface DirectChatTabProps {
  chatRooms: ChatRoom[];
  currentUser: CurrentUser;
  currentSchool: School;
  onUpdateChatRoom: (roomId: string, messages: ChatMessage[]) => void;
  onMarkRoomRead?: (roomId: string) => void;
  onStartPeerChat?: (peer: { key: string; name: string; school: string; grade: string }) => void;
  initialOpenRoomId?: string | null;
  onRoomOpenChange?: (isOpen: boolean) => void;
  onNavigateBoard?: () => void;
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
  onNavigateBoard,
}) => {
  const [openRoomId, setOpenRoomId] = useState<string | null>(initialOpenRoomId);
  const [chatFilter, setChatFilter] = useState<'all' | 'unread'>('all');
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

  // 1. 채팅 목록 화면 (Figma v2.0 에디토리얼 디자인 적용)
  if (!openRoomId || !activeRoom) {
    const unreadRoomsCount = chatRooms.filter((r) => r.unreadCount > 0).length;
    const displayedRooms =
      chatFilter === 'unread'
        ? chatRooms.filter((r) => r.unreadCount > 0)
        : chatRooms;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 안심 채팅 안내 */}
        <View style={styles.safetyRow}>
          <Ionicons name="lock-closed-outline" size={16} color={COLORS.muted} />
          <Text style={styles.safetyText}>안심 1:1 멘토링 채팅</Text>
        </View>

        {/* 대화 필터 (전체 / 안 읽음) */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, chatFilter === 'all' && styles.filterChipActive]}
            onPress={() => setChatFilter('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                chatFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              전체 {chatRooms.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, chatFilter === 'unread' && styles.filterChipActive]}
            onPress={() => setChatFilter('unread')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.filterChipText,
                chatFilter === 'unread' && styles.filterChipTextActive,
              ]}
            >
              안 읽음 {unreadRoomsCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 대화 목록 */}
        {displayedRooms.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyText}>
              {chatFilter === 'unread'
                ? '안 읽은 대화가 없습니다.'
                : '진행 중인 1:1 대화가 없습니다.'}
            </Text>
          </View>
        ) : (
          <View style={styles.roomListWrap}>
            {displayedRooms.map((room, idx) => {
              const isWarm = idx % 2 === 1;
              return (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomCard}
                  onPress={() => {
                    setOpenRoomId(room.id);
                    onMarkRoomRead?.(room.id);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={styles.roomTop}>
                    <View
                      style={[
                        styles.peerAvatar,
                        {
                          backgroundColor: isWarm
                            ? COLORS.avatarWarmBg
                            : COLORS.avatarGreenBg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.peerAvatarText,
                          {
                            color: isWarm ? COLORS.avatarWarmInk : COLORS.success,
                          },
                        ]}
                      >
                        {room.peerName.slice(0, 1)}
                      </Text>
                    </View>

                    <View style={styles.roomMetaCol}>
                      <Text style={styles.roomPeerName} numberOfLines={1}>
                        {room.peerName}
                      </Text>
                      {room.peerSchool ? (
                        <Text style={styles.roomPeerSchool} numberOfLines={1}>
                          {room.peerSchool}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={styles.roomTime}>{room.lastTime}</Text>
                  </View>

                  <View style={styles.roomBottom}>
                    <Text
                      style={[
                        styles.roomLastMsg,
                        room.unreadCount > 0 && styles.roomLastMsgUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {room.lastMessage}
                    </Text>
                    {room.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{room.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 새로운 대화 시작 안내 카드 */}
        <TouchableOpacity
          style={styles.guideCard}
          onPress={onNavigateBoard}
          activeOpacity={0.8}
        >
          <Text style={styles.guideTitle}>궁금한 이야기는, 대화로 이어가요.</Text>
          <Text style={styles.guideDesc}>
            게시판에서 관심 있는 글을 찾고{'\n'}작성자의 ‘1:1 채팅’을 눌러보세요.
          </Text>
          <View style={styles.guideActionRow}>
            <Text style={styles.guideActionText}>게시판 둘러보기</Text>
            <Text style={styles.guideActionArrow}>→</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: COLORS.bg,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 20,
    flexGrow: 1,
  },
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.24,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    backgroundColor: COLORS.sageButton,
    borderRadius: 8,
    paddingHorizontal: 13,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.ink,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.26,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  roomListWrap: {
    width: '100%',
  },
  roomCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 12,
  },
  roomTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  peerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  roomMetaCol: {
    flex: 1,
    gap: 3,
  },
  roomPeerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.32,
  },
  roomPeerSchool: {
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: -0.22,
  },
  roomTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
  roomBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomLastMsg: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.muted,
    letterSpacing: -0.28,
  },
  roomLastMsgUnread: {
    fontWeight: '600',
    color: COLORS.ink,
  },
  unreadBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: COLORS.sageSurface,
    borderRadius: 14,
    padding: 20,
    gap: 10,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  guideDesc: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    letterSpacing: -0.26,
  },
  guideActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  guideActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  guideActionArrow: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.ink,
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
    backgroundColor: COLORS.bg,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    marginRight: 10,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatPeerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  chatPeerSub: {
    fontSize: 11,
    color: COLORS.muted,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  roomSafetyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sageSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  roomSafetyText: {
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 10,
  },
  datePill: {
    alignSelf: 'center',
    backgroundColor: COLORS.sageCard,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  datePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.muted,
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
    color: COLORS.accent,
  },
  readStatusSent: {
    color: COLORS.muted,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '82%',
  },
  bubbleHighTimeMe: {
    backgroundColor: COLORS.ink,
    borderBottomRightRadius: 4,
  },
  bubbleHighTimePeer: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  msgTextHighTimeMe: {
    color: '#ffffff',
    fontWeight: '500',
  },
  msgTextPeer: {
    color: COLORS.ink,
  },
  msgTime: {
    fontSize: 9,
    color: COLORS.muted,
  },
  blockErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  blockErrorText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
    flex: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.searchBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.ink,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
