// 2번 탭(전공게시판): 전국 전공게시판 화면 (Figma v2.0 에디토리얼 디자인 적용)
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MajorPost, CurrentUser, School } from '../../types';
import { MAJOR_CATEGORIES } from '../../data/mockData';
import { COLORS } from '../../theme/colors';

interface MajorBoardTabProps {
  posts: MajorPost[];
  currentUser: CurrentUser;
  currentSchool: School;
  onSelectPost: (post: MajorPost) => void;
  onDeletePost: (postId: string) => void;
  onOpenWriteModal: () => void;
  onToggleLike: (postId: string) => void;
  onStartDirectChat: (post: MajorPost) => void;
}

export const MajorBoardTab: React.FC<MajorBoardTabProps> = ({
  posts,
  currentUser,
  currentSchool,
  onSelectPost,
  onDeletePost,
  onOpenWriteModal,
  onToggleLike,
  onStartDirectChat,
}) => {
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // 계열 + 검색어 필터링
  const filteredPosts = posts.filter((post) => {
    const matchMajor = selectedMajor === 'all' || post.majorId === selectedMajor;
    if (!matchMajor) return false;
    if (!trimmedQuery) return true;
    return (
      post.title.toLowerCase().includes(trimmedQuery) ||
      post.content.toLowerCase().includes(trimmedQuery) ||
      post.majorName.toLowerCase().includes(trimmedQuery) ||
      post.tag.toLowerCase().includes(trimmedQuery)
    );
  });

  const isMyPost = (post: MajorPost) =>
    post.author.school === currentSchool.name &&
    (post.author.nickname === currentUser.name ||
      (Boolean(currentUser.nickname) && post.author.nickname === currentUser.nickname));

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
            placeholder="과목, 세특 주제, 키워드 검색"
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

        {/* 전공 필터 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {MAJOR_CATEGORIES.map((cat) => {
            const isSelected = selectedMajor === cat.id;
            const shortLabel = cat.id === 'all' ? '전체' : cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedMajor(cat.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {shortLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 에디토리얼 안내 문구 */}
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>같은 관심사, 새로운 힌트.</Text>
          <Text style={styles.introSub}>
            탐구 주제와 추천 도서를 친구들과 나눠보세요.
          </Text>
        </View>

        {/* 게시글 목록 */}
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="documents-outline" size={38} color={COLORS.muted} />
            <Text style={styles.emptyText}>
              {trimmedQuery
                ? `'${searchQuery}'에 대한 검색 결과가 없습니다.`
                : '이 전공에 아직 게시글이 없습니다.'}
            </Text>
          </View>
        ) : (
          <View style={styles.postList}>
            {filteredPosts.map((post) => {
              const mine = isMyPost(post);
              const shortSchool = post.author.school.replace('고등학교', '고');
              return (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postItem}
                  onPress={() => onSelectPost(post)}
                  activeOpacity={0.75}
                >
                  {/* 상단: 전공 · 태그 | 작성 시간 (+ 내 글 삭제) */}
                  <View style={styles.postTopRow}>
                    <Text style={styles.postCategory} numberOfLines={1}>
                      {post.majorName} · {post.tag}
                    </Text>
                    <View style={styles.postTopRight}>
                      <Text style={styles.postTime}>{post.createdAt}</Text>
                      {mine && (
                        <TouchableOpacity
                          onPress={(e: any) => {
                            e?.stopPropagation?.();
                            onDeletePost(post.id);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={14} color={COLORS.accent} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* 제목 & 본문 요약 */}
                  <Text style={styles.postTitle} numberOfLines={2}>
                    {post.title}
                  </Text>
                  <Text style={styles.postBody} numberOfLines={2}>
                    {post.content}
                  </Text>

                  {/* 작성자 + 1:1 채팅 버튼 */}
                  <View style={styles.authorChatRow}>
                    <View style={styles.authorLeft}>
                      {mine && !post.author.isAnonymous && currentUser.profileImage ? (
                        <Image
                          source={{ uri: currentUser.profileImage }}
                          style={styles.authorAvatarImg}
                        />
                      ) : (
                        <View style={styles.authorAvatar}>
                          <Text style={styles.authorAvatarText}>
                            {(post.author.isAnonymous ? '익' : post.author.nickname).slice(0, 1)}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.authorText} numberOfLines={1}>
                        {post.author.isAnonymous ? '익명' : post.author.nickname} ·{' '}
                        {shortSchool} {post.author.grade}
                      </Text>
                    </View>
                    {!mine && (
                      <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={(e: any) => {
                          e?.stopPropagation?.();
                          onStartDirectChat(post);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.chatBtnText}>1:1 채팅 ↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 하단: 좋아요 · 댓글 */}
                  <View style={styles.metaRow}>
                    <TouchableOpacity
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        onToggleLike(post.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.metaText,
                          post.isLikedByUser && styles.metaTextLiked,
                        ]}
                      >
                        좋아요 {post.likes}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>댓글 {post.commentCount}</Text>
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
          onPress={onOpenWriteModal}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={16} color="#ffffff" />
          <Text style={styles.writeBtnText}>글쓰기</Text>
        </TouchableOpacity>
      </View>
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

  // 검색창
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

  // 필터 칩
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
    letterSpacing: -0.24,
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // 에디토리얼 안내 문구
  introBlock: {
    gap: 4,
  },
  introTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.42,
  },
  introSub: {
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: -0.24,
  },

  // 게시글 리스트
  postList: {
    width: '100%',
  },
  postItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 8,
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  postCategory: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: -0.22,
  },
  postTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postTime: {
    fontSize: 11,
    color: COLORS.muted,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
    lineHeight: 24,
  },
  postBody: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
    letterSpacing: -0.26,
  },
  authorChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  authorLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  authorAvatarImg: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: COLORS.avatarGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  authorText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.muted,
  },
  chatBtn: {
    backgroundColor: COLORS.sageButton,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  metaTextLiked: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  metaDot: {
    fontSize: 11,
    color: COLORS.muted,
  },

  // 빈 상태
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  // 하단 고정 글쓰기 바
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
    letterSpacing: -0.28,
  },
});
