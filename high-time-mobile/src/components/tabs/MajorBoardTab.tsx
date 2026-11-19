// 1번 탭: 전국 전공게시판 화면
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MajorPost, MajorCategory, CurrentUser, School } from '../../types';
import { MAJOR_CATEGORIES, POST_TAGS } from '../../data/mockData';

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
  const [selectedTag, setSelectedTag] = useState<string>('전체');

  // 카테고리 & 태그로 필터링
  const filteredPosts = posts.filter((post) => {
    const matchMajor = selectedMajor === 'all' || post.majorId === selectedMajor;
    const matchTag = selectedTag === '전체' || post.tag === selectedTag;
    return matchMajor && matchTag;
  });

  return (
    <View style={styles.container}>
      {/* 전공 계열 칩 스크롤 */}
      <View style={styles.filterArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {MAJOR_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.majorChip,
                selectedMajor === cat.id && {
                  backgroundColor: '#dc2626',
                },
              ]}
              onPress={() => setSelectedMajor(cat.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon as any}
                size={12}
                color={selectedMajor === cat.id ? '#ffffff' : '#64748b'}
              />
              <Text
                style={[
                  styles.majorChipText,
                  selectedMajor === cat.id && styles.majorChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 분류 태그 칩 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
          {POST_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, selectedTag === tag && styles.tagChipActive]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text
                style={[styles.tagChipText, selectedTag === tag && styles.tagChipTextActive]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 게시글 목록 */}
      <ScrollView style={styles.postList} showsVerticalScrollIndicator={false}>
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="documents-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>이 전공·태그에 아직 게시글이 없습니다.</Text>
            <TouchableOpacity style={styles.emptyWriteBtn} onPress={onOpenWriteModal}>
              <Text style={styles.emptyWriteBtnText}>첫 글 작성하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => onSelectPost(post)}
              activeOpacity={0.7}
            >
              {/* 카드 상단: 전공 뱃지 + [내 글] 뱃지 & 삭제 버튼 */}
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <View
                    style={[
                      styles.majorBadge,
                      {
                        backgroundColor:
                          MAJOR_CATEGORIES.find((m) => m.id === post.majorId)?.color + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.majorBadgeText,
                        {
                          color: MAJOR_CATEGORIES.find((m) => m.id === post.majorId)?.color,
                        },
                      ]}
                    >
                      {post.majorName}
                    </Text>
                  </View>
                  <Text style={styles.cardTag}>#{post.tag}</Text>
                </View>

                <View style={styles.cardTopRight}>
                  {post.author.school === currentSchool.name &&
                    (post.author.nickname === currentUser.name ||
                      (Boolean(currentUser.nickname) &&
                        post.author.nickname === currentUser.nickname)) && (
                      <>
                        <View style={styles.mineBadge}>
                          <Text style={styles.mineBadgeText}>내 글</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e: any) => {
                            e?.stopPropagation?.();
                            onDeletePost(post.id);
                          }}
                          style={styles.deleteBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </>
                    )}
                </View>
              </View>

              {/* 작성자 정보 */}
              <View style={styles.authorRow}>
                {post.author.school === currentSchool.name &&
                (post.author.nickname === currentUser.name ||
                  (Boolean(currentUser.nickname) &&
                    post.author.nickname === currentUser.nickname)) &&
                !post.author.isAnonymous &&
                currentUser.profileImage ? (
                  <Image
                    source={{ uri: currentUser.profileImage }}
                    style={{ width: 22, height: 22, borderRadius: 11 }}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: post.author.avatarColor || '#64748b' },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {post.author.nickname.slice(0, 1)}
                    </Text>
                  </View>
                )}
                <Text style={styles.authorInfo}>
                  {post.author.nickname} · {post.author.school} {post.author.grade}
                </Text>
              </View>

              {/* 본문 미리보기 */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {post.title}
              </Text>
              <Text style={styles.cardSnippet} numberOfLines={2}>
                {post.content}
              </Text>

              {/* 카드 하단: 시간 & 인터랙션 */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardTime}>{post.createdAt}</Text>
                <View style={styles.interactionRow}>
                  <TouchableOpacity
                    style={styles.interactionBtn}
                    onPress={() => onToggleLike(post.id)}
                  >
                    <Ionicons
                      name={post.isLikedByUser ? 'heart' : 'heart-outline'}
                      size={13}
                      color={post.isLikedByUser ? '#dc2626' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.interactionText,
                        post.isLikedByUser && styles.interactionTextActive,
                      ]}
                    >
                      {post.likes}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.interactionBtn}>
                    <Ionicons name="chatbubble-outline" size={12} color="#94a3b8" />
                    <Text style={styles.interactionText}>{post.commentCount}</Text>
                  </View>
                  <View style={styles.interactionBtn}>
                    <Ionicons name="bookmark-outline" size={12} color="#94a3b8" />
                    <Text style={styles.interactionText}>{post.scraps}</Text>
                  </View>

                  {/* 1:1 채팅 신청 버튼 (본인 글에는 표시하지 않음) */}
                  {!(
                    post.author.school === currentSchool.name &&
                    (post.author.nickname === currentUser.name ||
                      (Boolean(currentUser.nickname) &&
                        post.author.nickname === currentUser.nickname))
                  ) && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#fef2f2',
                        borderWidth: 1,
                        borderColor: '#fecaca',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                      }}
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        onStartDirectChat(post);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses" size={12} color="#dc2626" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626' }}>
                        1:1 채팅 신청
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 플로팅 글쓰기 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={onOpenWriteModal} activeOpacity={0.85}>
        <Ionicons name="add" size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterArea: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
  },
  chipScroll: {
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  majorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  majorChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  majorChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tagScroll: {
    paddingHorizontal: 14,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  tagChipActive: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tagChipTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  postList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  emptyWrap: {
    alignItems: 'center',
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
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  majorBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  majorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardTag: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  authorInfo: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
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
  cardTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  interactionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  interactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  interactionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  interactionTextActive: {
    color: '#dc2626',
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
});

