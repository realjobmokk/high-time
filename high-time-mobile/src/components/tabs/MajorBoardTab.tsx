// 2번 탭(전공게시판): 2열 전공 카드 그리드 -> 선택 전공 게시글 목록 화면 (Figma v2.0 에디토리얼 디자인)
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
  // null이면 2열 전공 선택 그리드 화면, 문자열이면 해당 전공 게시글 목록 화면
  const [activeMajorId, setActiveMajorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const activeMajorObj = MAJOR_CATEGORIES.find((m) => m.id === activeMajorId) || null;

  // 검색어가 있거나 전공을 선택한 경우 게시글 필터링
  const filteredPosts = posts.filter((post) => {
    const matchMajor =
      !activeMajorId || activeMajorId === 'all' || post.majorId === activeMajorId;
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

  const renderPostList = () => {
    if (filteredPosts.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Ionicons name="documents-outline" size={38} color={COLORS.muted} />
          <Text style={styles.emptyText}>
            {trimmedQuery
              ? `'${searchQuery}'에 대한 검색 결과가 없습니다.`
              : '이 전공에 아직 게시글이 없습니다.'}
          </Text>
        </View>
      );
    }

    return (
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

              <Text style={styles.postTitle} numberOfLines={2}>
                {post.title}
              </Text>
              <Text style={styles.postBody} numberOfLines={2}>
                {post.content}
              </Text>

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
    );
  };

  // 1단계: 전공 카드 2열 그리드 화면 (검색어 입력 시 바로 검색 결과 표시)
  if (!activeMajorId) {
    const gridCategories = MAJOR_CATEGORIES.filter((c) => c.id !== 'all');
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

          {trimmedQuery ? (
            <>
              <Text style={styles.searchResultLabel}>
                전체 전공 검색 결과 ({filteredPosts.length}건)
              </Text>
              {renderPostList()}
            </>
          ) : (
            <>
              <View style={styles.gridTopRow}>
                <View>
                  <Text style={styles.introTitle}>전공을 선택해 보세요</Text>
                  <Text style={styles.introSub}>
                    관심 있는 계열을 누르면 해당 전공 게시글로 바로 들어갑니다.
                  </Text>
                </View>
              </View>

              {/* 전체 글 보기 빠른 카드 */}
              <TouchableOpacity
                style={styles.allMajorsBanner}
                onPress={() => setActiveMajorId('all')}
                activeOpacity={0.8}
              >
                <View style={styles.allMajorsLeft}>
                  <Ionicons name="sparkles-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.allMajorsTitle}>전체 전공 글 모아보기</Text>
                </View>
                <Text style={styles.allMajorsCount}>{posts.length}개  ›</Text>
              </TouchableOpacity>

              {/* 2열 전공 카드 그리드 */}
              <View style={styles.majorGrid}>
                {gridCategories.map((cat, idx) => {
                  const count = posts.filter((p) => p.majorId === cat.id).length;
                  const isSage = idx % 4 === 0 || idx % 4 === 3;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.majorGridCard,
                        isSage ? styles.majorGridCardSage : styles.majorGridCardWhite,
                      ]}
                      onPress={() => setActiveMajorId(cat.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.majorGridIconWrap}>
                        <Ionicons
                          name={cat.icon as any}
                          size={22}
                          color={COLORS.ink}
                        />
                      </View>
                      <Text style={styles.majorGridTitle}>{cat.name}</Text>
                      <Text style={styles.majorGridCount}>게시글 {count}개</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // 2단계: 선택한 전공 게시글 목록 화면 ("← 전공게시판 - 컴퓨터·IT")
  return (
    <View style={styles.container}>
      {/* 상단 선택 전공 헤더 */}
      <View style={styles.detailTopBar}>
        <TouchableOpacity
          style={styles.backToGridBtn}
          onPress={() => {
            setActiveMajorId(null);
            setSearchQuery('');
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
          <Text style={styles.detailTopTitle}>
            전공게시판 - {activeMajorObj?.name || '전체 전공'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.detailCountText}>{filteredPosts.length}개</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 해당 전공 내 검색창 */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`${activeMajorObj?.name || '전공'} 내 주제, 키워드 검색`}
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

        {renderPostList()}
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
    paddingBottom: 24,
    gap: 16,
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
  searchResultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },

  // 2열 전공 카드 그리드
  gridTopRow: {
    gap: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.4,
  },
  introSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },
  allMajorsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.sageSurface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  allMajorsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allMajorsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  allMajorsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  majorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  majorGridCard: {
    width: '48%',
    minHeight: 118,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  majorGridCardSage: {
    backgroundColor: COLORS.sageSurface,
  },
  majorGridCardWhite: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  majorGridIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  majorGridTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  majorGridCount: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.muted,
    marginTop: 2,
  },

  // 2단계 선택 전공 헤더
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  backToGridBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailTopTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  detailCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
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
