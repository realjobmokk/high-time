// 게시글 상세 보기 및 댓글 작성/삭제 모달
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneModal } from '../components/PhoneModal';
import { MajorPost, CurrentUser, School, PostComment } from '../types';

interface PostDetailModalProps {
  visible: boolean;
  post: MajorPost | null;
  currentUser: CurrentUser;
  currentSchool: School;
  onClose: () => void;
  onToggleLike: (postId: string) => void;
  onDeletePost: (postId: string, skipConfirm?: boolean) => void;
  onAddComment: (postId: string, comment: PostComment) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onQuickAsk: (post: MajorPost) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  visible,
  post,
  currentUser,
  currentSchool,
  onClose,
  onToggleLike,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onQuickAsk,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isAnonComment, setIsAnonComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    { type: 'post' } | { type: 'comment'; commentId: string } | null
  >(null);

  if (!post) return null;

  // 이름과 소속 학교가 모두 일치해야만 내 게시글로 판별 (동명이인 타 학교 사용자 차단)
  const isPostMine =
    post.author.school === currentSchool.name &&
    (post.author.nickname === currentUser.name ||
      (Boolean(currentUser.nickname) && post.author.nickname === currentUser.nickname));

  // 댓글 등록 핸들러 (현재 로그인한 사용자의 이름/학교/학년 사용)
  const handleCommentSubmit = () => {
    setCommentError(null);
    if (!commentText.trim()) {
      setCommentError('댓글 내용을 포함해야 합니다.');
      return;
    }

    const newComment: PostComment = {
      id: `c-${Date.now()}`,
      author: {
        nickname: isAnonComment ? '익명' : currentUser.name,
        school: currentSchool.name,
        grade: currentUser.grade,
        isAnonymous: isAnonComment,
      },
      content: commentText.trim(),
      createdAt: '방금 전',
      likes: 0,
      isMine: true,
    };

    onAddComment(post.id, newComment);
    setCommentText('');
  };

  // 내 게시글 삭제 확인
  const handleConfirmDeletePost = () => {
    setPendingDelete({ type: 'post' });
  };

  // 내 댓글 삭제 확인
  const handleConfirmDeleteComment = (commentId: string) => {
    setPendingDelete({ type: 'comment', commentId });
  };

  return (
    <PhoneModal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* 상단 바 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>{post.majorName}</Text>
              <Text style={styles.headerTag}>#{post.tag}</Text>
            </View>
            <View style={styles.headerRight}>
              {isPostMine ? (
                <TouchableOpacity onPress={handleConfirmDeletePost} style={styles.deleteHeaderBtn}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => onQuickAsk(post)} style={styles.askHeaderBtn}>
                  <Ionicons name="help-circle-outline" size={18} color="#2563eb" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 작성자 정보 카드 */}
            <View style={styles.authorRow}>
              {isPostMine && !post.author.isAnonymous && currentUser.profileImage ? (
                <Image
                  source={{ uri: currentUser.profileImage }}
                  style={{ width: 38, height: 38, borderRadius: 19 }}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: post.author.avatarColor || '#2563eb' },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {post.author.nickname.slice(0, 1)}
                  </Text>
                </View>
              )}
              <View style={styles.authorInfo}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorNick}>{post.author.nickname}</Text>
                  {isPostMine && (
                    <View style={styles.mineBadge}>
                      <Text style={styles.mineBadgeText}>내 글</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.authorSub}>
                  {post.author.school} · {post.author.grade} · {post.createdAt}
                </Text>
              </View>

              {/* 본인 글에는 1:1 채팅 신청 버튼 숨김 */}
              {!isPostMine && (
                <TouchableOpacity
                  style={styles.directAskBtn}
                  onPress={() => onQuickAsk(post)}
                >
                  <Ionicons name="chatbubbles-outline" size={14} color="#2563eb" />
                  <Text style={styles.directAskText}>1:1 채팅 신청</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 본문 영역 */}
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>

            {/* 인터랙션 버튼 (좋아요 / 댓글수 / 스크랩) */}
            <View style={styles.reactionBar}>
              <TouchableOpacity
                style={[styles.reactionBtn, post.isLikedByUser && styles.reactionBtnActive]}
                onPress={() => onToggleLike(post.id)}
              >
                <Ionicons
                  name={post.isLikedByUser ? 'heart' : 'heart-outline'}
                  size={16}
                  color={post.isLikedByUser ? '#dc2626' : '#64748b'}
                />
                <Text
                  style={[
                    styles.reactionText,
                    post.isLikedByUser && styles.reactionTextActive,
                  ]}
                >
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <View style={styles.reactionItem}>
                <Ionicons name="chatbubble-outline" size={15} color="#64748b" />
                <Text style={styles.reactionText}>{post.comments?.length || 0}</Text>
              </View>

              <View style={styles.reactionItem}>
                <Ionicons name="bookmark-outline" size={15} color="#64748b" />
                <Text style={styles.reactionText}>{post.scraps}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 댓글 헤더 */}
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>
                댓글 {post.comments?.length || 0}개
              </Text>
            </View>

            {/* 댓글 목록 */}
            <View style={styles.commentList}>
              {(!post.comments || post.comments.length === 0) ? (
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsText}>
                    아직 작성된 댓글이 없습니다. 첫 조언이나 질문을 남겨보세요!
                  </Text>
                </View>
              ) : (
                post.comments.map((comment) => {
                  const isCommentMine =
                    comment.author.school === currentSchool.name &&
                    (comment.author.nickname === currentUser.name ||
                      (Boolean(currentUser.nickname) &&
                        comment.author.nickname === currentUser.nickname));
                  const isPostAuthor =
                    comment.author.school === post.author.school &&
                    comment.author.nickname === post.author.nickname;
                  return (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentTop}>
                        <View style={styles.commentAuthorRow}>
                          <Text style={styles.commentAuthorNick}>
                            {comment.author.nickname}
                          </Text>
                          <Text style={styles.commentAuthorSub}>
                            ({comment.author.school} · {comment.author.grade})
                          </Text>
                          {isPostAuthor && (
                            <View style={styles.commentMineBadge}>
                              <Text style={styles.commentMineText}>작성자</Text>
                            </View>
                          )}
                        </View>

                        {/* 내가 쓴 댓글인 경우에만 삭제 버튼 노출 */}
                        {isCommentMine && (
                          <TouchableOpacity
                            onPress={() => handleConfirmDeleteComment(comment.id)}
                            style={styles.commentDeleteBtn}
                          >
                            <Ionicons name="trash-outline" size={13} color="#dc2626" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.commentBody}>{comment.content}</Text>
                      <Text style={styles.commentTime}>{comment.createdAt}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* 댓글 빈 내용 알림 */}
          {commentError && (
            <View
              style={{
                backgroundColor: '#fef2f2',
                borderTopWidth: 1,
                borderTopColor: '#fecaca',
                paddingHorizontal: 14,
                paddingVertical: 7,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '800' }}>
                {commentError}
              </Text>
            </View>
          )}

          {/* 하단 댓글 작성창 */}
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.anonCommentBtn}
              onPress={() => setIsAnonComment(!isAnonComment)}
            >
              <Ionicons
                name={isAnonComment ? 'checkbox' : 'square-outline'}
                size={18}
                color={isAnonComment ? '#dc2626' : '#94a3b8'}
              />
              <Text style={styles.anonCommentLabel}>익명</Text>
            </TouchableOpacity>

            <TextInput
              style={[
                styles.commentInput,
                commentError && {
                  borderWidth: 1,
                  borderColor: '#ef4444',
                  backgroundColor: '#fef2f2',
                },
              ]}
              value={commentText}
              onChangeText={(t) => {
                setCommentText(t);
                if (commentError) setCommentError(null);
              }}
              placeholder="댓글을 남겨보세요..."
              placeholderTextColor="#94a3b8"
              returnKeyType="send"
              onSubmitEditing={handleCommentSubmit}
            />

            <TouchableOpacity
              style={styles.commentSendBtn}
              onPress={handleCommentSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 게시글 / 댓글 삭제 확인 오버레이 (예 / 아니요) */}
        {pendingDelete && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 320,
                backgroundColor: '#ffffff',
                borderRadius: 18,
                padding: 20,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 8 }}>
                {pendingDelete.type === 'post' ? '게시글 삭제' : '댓글 삭제'}
              </Text>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 18 }}>
                {pendingDelete.type === 'post'
                  ? '삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.'
                  : '삭제하시겠습니까?'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: '#f1f5f9',
                    alignItems: 'center',
                  }}
                  onPress={() => setPendingDelete(null)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569' }}>아니요</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: '#dc2626',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    const target = pendingDelete;
                    setPendingDelete(null);
                    if (target.type === 'post') {
                      onDeletePost(post.id, true);
                      onClose();
                    } else {
                      onDeleteComment(post.id, target.commentId);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#ffffff' }}>예</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </PhoneModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerTag: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 32,
    justifyContent: 'flex-end',
  },
  deleteHeaderBtn: {
    padding: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  askHeaderBtn: {
    padding: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorNick: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  mineBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  mineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  authorSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  directAskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  directAskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 24,
    marginBottom: 10,
  },
  postContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 16,
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  reactionBtnActive: {
    backgroundColor: '#fee2e2',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  reactionTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  commentsHeader: {
    paddingVertical: 8,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  commentList: {
    paddingBottom: 20,
  },
  emptyComments: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentAuthorNick: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  commentAuthorSub: {
    fontSize: 10,
    color: '#64748b',
  },
  commentMineBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  commentMineText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  commentDeleteBtn: {
    padding: 3,
  },
  commentBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  anonCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  anonCommentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

