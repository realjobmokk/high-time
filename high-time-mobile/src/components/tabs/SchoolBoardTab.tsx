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
import { COLORS } from '../../theme/colors';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isCommentAnon, setIsCommentAnon] = useState(true);

  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredPosts = posts.filter((post) => {
    const matchCategory = selectedCategory === '전체' || post.category === selectedCategory;
    if (!matchCategory) return false;
    if (!trimmedQuery) return true;
    return (
      post.title.toLowerCase().includes(trimmedQuery) ||
      post.content.toLowerCase().includes(trimmedQuery) ||
      post.category.toLowerCase().includes(trimmedQuery)
    );
  });

  const handleDelete = (postId: string) => {
    onDeletePost(postId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 검색창 */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="우리학교 게시글, 동아리, 정보 검색"
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* 카테고리 필터 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {SCHOOL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 소속 학교 인증 배너 (세이지 카드) */}
        <View style={styles.schoolBanner}>
          <View style={styles.schoolBannerLeft}>
            <Text style={styles.schoolName}>{currentSchool.name}</Text>
            <Text style={styles.schoolSub}>
              재학증명서 인증 완료 · 외부 열람 차단
            </Text>
          </View>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={COLORS.accent} />
            <Text style={styles.lockBadgeText}>비공개</Text>
          </View>
        </View>

        {/* 게시글 목록 */}
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="school-outline" size={38} color={COLORS.muted} />
            <Text style={styles.emptyText}>
              {trimmedQuery
                ? `'${searchQuery}'에 대한 검색 결과가 없습니다.`
                : '이 카테고리에 게시글이 없습니다.'}
            </Text>
          </View>
        ) : (
          <View style={styles.postList}>
            {filteredPosts.map((post) => {
              const isMine =
                post.author === currentUser.name ||
                (Boolean(currentUser.nickname) && post.author === currentUser.nickname);
              return (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postCard}
                  onPress={() => setSelectedPostId(post.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.catBadgeText}>{post.category}</Text>
                    <View style={styles.cardTopRight}>
                      <Text style={styles.postTime}>{post.createdAt}</Text>
                      {isMine && (
                        <TouchableOpacity
                          onPress={() => handleDelete(post.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={14} color={COLORS.accent} />
                        </TouchableOpacity>
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
                      {post.isAnonymous ? '익명' : post.author} · {post.grade}
                    </Text>
                    <View style={styles.interactionRow}>
                      <TouchableOpacity
                        style={styles.interactionItem}
                        onPress={() => onToggleLike(post.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text
                          style={[
                            styles.interactionText,
                            post.isLikedByUser && { color: COLORS.accent, fontWeight: '700' },
                          ]}
                        >
                          좋아요 {post.likes}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.footerDot}>·</Text>
                      <Text style={styles.interactionText}>
                        댓글 {post.comments ? post.comments.length : post.commentCount}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 하단 고정 글쓰기 바 */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() =>
            onOpenWriteModal(selectedCategory !== '전체' ? selectedCategory : '자유게시판')
          }
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={16} color="#ffffff" />
          <Text style={styles.writeBtnText}>글쓰기</Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.searchBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.ink,
    paddingVertical: 2,
  },
  chipRow: {
    gap: 7,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: COLORS.sageCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: COLORS.ink,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  schoolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.sageSurface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  schoolBannerLeft: {
    flex: 1,
    gap: 3,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.32,
  },
  schoolSub: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.success,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  postList: {
    width: '100%',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  postCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  catBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 24,
    letterSpacing: -0.34,
  },
  cardSnippet: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
    letterSpacing: -0.26,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  footerInfo: {
    fontSize: 11,
    color: COLORS.muted,
  },
  interactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  footerDot: {
    fontSize: 11,
    color: COLORS.muted,
  },
  bottomActionBar: {
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 12,
  },
  writeBtn: {
    backgroundColor: COLORS.ink,
    borderRadius: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  writeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
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
