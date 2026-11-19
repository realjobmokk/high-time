// =============================================================================
// 💬 HighTime (고교타임) - 전공게시판 1:1 채팅 신청 메시지 작성 모달
// - 게시글 작성자에게 1:1 채팅을 신청할 때 보낼 첫 메시지를 사용자가 직접 작성 후 전송
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MajorPost } from '../types';
import { PhoneModal } from '../components/PhoneModal';

interface ChatRequestModalProps {
  visible: boolean;
  post: MajorPost | null;
  onClose: () => void;
  onSendRequest: (post: MajorPost, messageText: string) => void;
}

export const ChatRequestModal: React.FC<ChatRequestModalProps> = ({
  visible,
  post,
  onClose,
  onSendRequest,
}) => {
  const [messageText, setMessageText] = useState('');

  // 모달이 열릴 때마다 입력창 초기화
  useEffect(() => {
    if (visible) {
      setMessageText('');
    }
  }, [visible, post?.id]);

  if (!post) return null;

  const peerName = post.author.isAnonymous ? '익명 멘토' : post.author.nickname;

  const handleSubmit = () => {
    if (!messageText.trim()) {
      Alert.alert('메시지 입력', '상대방에게 보낼 메시지를 직접 작성해주세요.');
      return;
    }
    onSendRequest(post, messageText.trim());
    setMessageText('');
  };

  return (
    <PhoneModal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* 상단 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#dc2626" />
              <Text style={styles.headerTitle}>1:1 채팅 신청 메시지 작성</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* 받는 사람 및 게시글 요약 */}
          <View style={styles.targetBox}>
            <Text style={styles.targetLabel}>받는 사람</Text>
            <Text style={styles.targetName}>
              {peerName} ({post.author.school} · {post.author.grade})
            </Text>
            <Text style={styles.postTitle} numberOfLines={1}>
              관련 글: {post.title}
            </Text>
          </View>

          {/* 보낼 메시지 직접 작성 입력창 */}
          <Text style={styles.inputLabel}>보낼 메시지</Text>
          <TextInput
            style={styles.textArea}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="상대방에게 보낼 1:1 질문 또는 채팅 메시지를 직접 작성해 주세요."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            autoFocus
          />

          {/* 하단 버튼 */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={15} color="#ffffff" />
              <Text style={styles.sendBtnText}>메시지 보내기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </PhoneModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 18,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  targetBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  targetName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  postTitle: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    height: 120,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  sendBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
