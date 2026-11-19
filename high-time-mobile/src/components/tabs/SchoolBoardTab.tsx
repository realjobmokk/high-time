// 2번 탭: 우리학교 폐쇄형 커뮤니티 화면 (인증된 소속 학교 재학생 전용)
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SchoolPost, School, CurrentUser } from '../../types';
import { PhoneModal } from '../PhoneModal';

interface SchoolBoardTabProps {
  currentSchool: School;
  currentUser: CurrentUser;
  posts: SchoolPost[];
  onDeletePost: (postId: string) => void;
  onOpenWriteModal: (initialCategory?: string) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, content: string, isAnonymous: boolean) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}

const SCHOOL_CATEGORIES = ['전체', '자유게시판', '정보/세특', '동아리', '분실물'];

export const SchoolBoardTab: React.FC<SchoolBoardTabProps> = ({
  currentSchool,
  currentUser,
  posts,
  onDeletePost,
  onOpenWriteModal,
  onToggleLike,
  onAddComment,
  onDeleteComment,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isCommentAnon, setIsCommentAnon] = useState(true);

  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;

  const filteredPosts = posts.filter(
    (post) => selectedCategory === '전체' || post.category === selectedCategory
  );

  const handleDelete = (postId: string) => {
    onDeletePost(postId);
  };

  return (
    <View style={styles.container}>
      {/* 소속 학교 인증 헤더 배너 */}
      <View style={styles.schoolBanner}>
        <View style={styles.schoolBannerLeft}>
          <View style={styles.schoolIconWrap}>
            <Ionicons name="school" size={20} color="#dc2626" />
          </View>
          <View>
            <Text style={styles.schoolName}>{currentSchool.name}</Text>
            <Text style={styles.schoolSub}>
              <Ionicons name="shield-checkmark" size={10} color="#dc2626" /> 재학증명서 인증 완료 · 외부 열람 차단
            </Text>
          </View>
        </View>
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={12} color="#dc2626" />
          <Text style={styles.lockBadgeText}>비공개</Text>
        </View>
      </View>

      {/* 카테고리 필터 탭 (가로 5등분 균등 분할 바) */}
      <View style={styles.categoryBar}>
        {SCHOOL_CATEGORIES.map((cat, idx) => {
          const isSelected = selectedCategory === cat;
          const isLast = idx === SCHOOL_CATEGORIES.length - 1;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catCell,
                !isLast && styles.catCellBorderRight,
                isSelected && styles.catCellActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.catCellText, isSelected && styles.catCellTextActive]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 게시글 목록 */}
      <ScrollView
        style={styles.postList}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="school-outline" size={40} color="#dc2626" />
            <Text style={styles.emptyText}>이 카테고리에 게시글이 없습니다.</Text>
            <TouchableOpacity
              style={styles.emptyWriteBtn}
              onPress={() =>
                onOpenWriteModal(selectedCategory !== '전체' ? selectedCategory : '자유게시판')
              }
            >
              <Text style={styles.emptyWriteBtnText}>첫 글 작성하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => setSelectedPostId(post.id)}
              activeOpacity={0.85}
            >
              {/* 카드 상단 */}
              <View style={styles.cardTop}>
                <View style={styles.catBadge}>
                  <Text style={styles.catBadgeText}>{post.category}</Text>
                </View>
                <View style={styles.cardTopRight}>
                  {(post.author === currentUser.name ||
                    (Boolean(currentUser.nickname) && post.author === currentUser.nickname)) && (
                      <>
                        <View style={styles.mineBadge}>
                          <Text style={styles.mineBadgeText}>내 글</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(post.id)}
                          style={styles.deleteBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </>
                    )}
                </View>
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {post.title}
              </Text>
              <Text style={styles.cardSnippet} numberOfLines={2}>
                {post.content}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.footerInfo}>
                  {post.isAnonymous ? '익명' : post.author} · {post.grade} · {post.createdAt}
                </Text>
                <View style={styles.interactionRow}>
                  <TouchableOpacity
                    style={styles.interactionItem}
                    onPress={() => onToggleLike(post.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={post.isLikedByUser ? 'heart' : 'heart-outline'}
                      size={14}
                      color={post.isLikedByUser ? '#dc2626' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.interactionText,
                        post.isLikedByUser && { color: '#dc2626', fontWeight: '800' },
                      ]}
                    >
                      {post.likes}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.interactionItem}>
                    <Ionicons name="chatbubble-outline" size={13} color="#94a3b8" />
                    <Text style={styles.interactionText}>
                      {post.comments ? post.comments.length : post.commentCount}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 플로팅 글쓰기 버튼 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          onOpenWriteModal(selectedCategory !== '전체' ? selectedCategory : '자유게시판')
        }
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color="#ffffff" />
      </TouchableOpacity>

      {/* 우리학교 게시글 상세 & 좋아요/댓글 모달 */}
      <PhoneModal visible={Boolean(selectedPost)} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.detailOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.detailModal}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailHeaderTitle}>우리학교 게시글</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedPostId(null);
                  setCommentText('');
                }}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <>
                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailMetaRow}>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{selectedPost.category}</Text>
                    </View>
                    <Text style={styles.footerInfo}>
                      {selectedPost.isAnonymous ? '익명' : selectedPost.author} · {selectedPost.grade} ·{' '}
                      {selectedPost.createdAt}
                    </Text>
                  </View>

                  <Text style={styles.detailTitle}>{selectedPost.title}</Text>
                  <Text style={styles.detailContent}>{selectedPost.content}</Text>

                  {/* 좋아요 버튼 */}
                  <View style={styles.detailActionRow}>
                    <TouchableOpacity
                      style={[
                        styles.detailLikeBtn,
                        selectedPost.isLikedByUser && styles.detailLikeBtnActive,
                      ]}
                      onPress={() => onToggleLike(selectedPost.id)}
                    >
                      <Ionicons
                        name={selectedPost.isLikedByUser ? 'heart' : 'heart-outline'}
                        size={16}
                        color={selectedPost.isLikedByUser ? '#ffffff' : '#dc2626'}
                      />
                      <Text
                        style={[
                          styles.detailLikeText,
                          selectedPost.isLikedByUser && { color: '#ffffff' },
                        ]}
                      >
                        공감 {selectedPost.likes}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.commentCountLabel}>
                      댓글 {(selectedPost.comments || []).length}개
                    </Text>
                  </View>

                  {/* 댓글 목록 */}
                  <View style={styles.commentList}>
                    {(selectedPost.comments || []).length === 0 ? (
                      <Text style={styles.emptyCommentText}>
                        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                      </Text>
                    ) : (
                      (selectedPost.comments || []).map((c) => {
                        const isMyComment =
                          c.author === currentUser.name ||
                          (Boolean(currentUser.nickname) && c.author === currentUser.nickname);
                        return (
                          <View key={c.id} style={styles.commentItem}>
                            <View style={styles.commentTop}>
                              <Text style={styles.commentAuthor}>
                                {c.isAnonymous ? '익명' : c.author} · {c.grade}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.commentTime}>{c.createdAt}</Text>
                                {isMyComment && (
                                  <TouchableOpacity
                                    onPress={() => onDeleteComment(selectedPost.id, c.id)}
                                  >
                                    <Ionicons name="trash-outline" size={13} color="#dc2626" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                            <Text style={styles.commentContent}>{c.content}</Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                </ScrollView>

                {/* 하단 댓글 입력창 */}
                <View style={styles.commentInputBar}>
                  <TouchableOpacity
                    style={styles.anonCheckBtn}
                    onPress={() => setIsCommentAnon(!isCommentAnon)}
                  >
                    <Ionicons
                      name={isCommentAnon ? 'checkbox' : 'square-outline'}
                      size={16}
                      color={isCommentAnon ? '#dc2626' : '#94a3b8'}
                    />
                    <Text style={styles.anonCheckText}>익명</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.commentInput}
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="댓글을 입력하세요..."
                    placeholderTextColor="#94a3b8"
                    returnKeyType="send"
                    onSubmitEditing={() => {
                      const trimmed = commentText.trim();
                      if (!trimmed) return;
                      onAddComment(selectedPost.id, trimmed, isCommentAnon);
                      setCommentText('');
                    }}
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentSendBtn,
                      !commentText.trim() && { backgroundColor: '#cbd5e1' },
                    ]}
                    onPress={() => {
                      const trimmed = commentText.trim();
                      if (!trimmed) return;
                      onAddComment(selectedPost.id, trimmed, isCommentAnon);
                      setCommentText('');
                    }}
                  >
                    <Ionicons name="send" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </PhoneModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  schoolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  schoolBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schoolIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  schoolSub: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  // 가로 5등분 고정 카테고리 탭 바
  categoryBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    height: 42,
  },
  catCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  catCellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  catCellActive: {
    backgroundColor: '#fef2f2',
    borderBottomColor: '#dc2626',
  },
  catCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  catCellTextActive: {
    color: '#dc2626',
    fontWeight: '800',
  },
  postList: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyWriteBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyWriteBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  postCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mineBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  mineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#dc2626',
  },
  deleteBtn: {
    padding: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardSnippet: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerInfo: {
    fontSize: 10,
    color: '#94a3b8',
  },
  interactionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  interactionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    minHeight: '55%',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  detailBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  detailContent: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  detailLikeBtnActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  detailLikeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  commentCountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  commentList: {
    paddingVertical: 12,
    gap: 8,
  },
  emptyCommentText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e293b',
  },
  commentTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  commentContent: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  anonCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  anonCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#0f172a',
  },
  commentSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
