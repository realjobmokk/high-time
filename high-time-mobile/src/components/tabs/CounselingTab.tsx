// 4번 탭: 입시·1:1질문 화면
import React, { useState, useEffect } from 'react';
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
import { DirectQuestion, AdmissionConsult } from '../../types';
import { PhoneModal } from '../PhoneModal';
import { COLORS } from '../../theme/colors';

interface QuestionCommentItem {
  id: string;
  author: string;
  grade?: string;
  content: string;
  createdAt: string;
}

function parseQuestionComments(answer: string | null, fallbackTime?: string | null): QuestionCommentItem[] {
  if (!answer) return [];
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [
    {
      id: 'legacy-answer',
      author: '선배 답변',
      content: answer,
      createdAt: fallbackTime || '방금 전',
    },
  ];
}

interface CounselingTabProps {
  directQuestions: DirectQuestion[];
  admissionConsults: AdmissionConsult[];
  initialSubTab?: SubTab;
  onOpenAskDirect: () => void;
  onOpenAskAdmission: () => void;
  onAddQuestionComment: (questionId: string, content: string) => void;
}

type SubTab = 'direct' | 'admission';

export const CounselingTab: React.FC<CounselingTabProps> = ({
  directQuestions,
  admissionConsults,
  initialSubTab = 'direct',
  onOpenAskDirect,
  onOpenAskAdmission,
  onAddQuestionComment,
}) => {
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [modalCommentText, setModalCommentText] = useState('');

  const selectedQuestion = directQuestions.find((q) => q.id === selectedQuestionId) || null;

  const ADMISSION_Q_CATEGORIES = ['전체', '수시/학종', '정시/수능', '생기부/세특', '내신/공부법', '대학/학과선택'];
  const filteredQuestions =
    selectedCategory === '전체'
      ? directQuestions
      : directQuestions.filter((q) => q.targetAuthor === selectedCategory);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 서브 탭 전환 (세그먼트 필) */}
        <View style={styles.subTabBar}>
          <TouchableOpacity
            style={[styles.subTab, subTab === 'direct' && styles.subTabActive]}
            onPress={() => setSubTab('direct')}
            activeOpacity={0.75}
          >
            <Text style={[styles.subTabText, subTab === 'direct' && styles.subTabTextActive]}>
              입시 질문 게시판
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, subTab === 'admission' && styles.subTabActive]}
            onPress={() => setSubTab('admission')}
            activeOpacity={0.75}
          >
            <Text style={[styles.subTabText, subTab === 'admission' && styles.subTabTextActive]}>
              전문 입시 컨설팅
            </Text>
          </TouchableOpacity>
        </View>

        {/* 상단 에디토리얼 안내 카드 */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>
            {subTab === 'direct'
              ? '입시 고민, 함께 풀어요.'
              : '맞춤형 전문 입시 컨설팅'}
          </Text>
          <Text style={styles.bannerSub}>
            {subTab === 'direct'
              ? '수시·정시·생기부 질문을 전국 친구·선배들과 나눠보세요.'
              : '목표 대학과 성적을 입력하면 전문 컨설턴트의 조언을 받을 수 있어요.'}
          </Text>
        </View>

        {/* 입시 질문 게시판 카테고리 필터 칩 */}
        {subTab === 'direct' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {ADMISSION_Q_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {/* 입시 질문 게시판 목록 */}
        {subTab === 'direct' && (
          <View style={styles.list}>
            {filteredQuestions.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '700' }}>
                  아직 등록된 입시 질문 게시글이 없습니다.
                </Text>
              </View>
            ) : (
              filteredQuestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.qaCard}
                onPress={() => setSelectedQuestionId(item.id)}
                activeOpacity={0.75}
              >
                {/* 질문 카드 헤더 */}
                <View style={styles.qaTop}>
                  <View style={styles.qaTopLeft}>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === '답변완료' ? styles.statusDone : styles.statusPending,
                      ]}
                    >
                      <Ionicons
                        name={item.status === '답변완료' ? 'checkmark-circle' : 'time'}
                        size={11}
                        color={item.status === '답변완료' ? '#16a34a' : '#d97706'}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          item.status === '답변완료' ? styles.statusDoneText : styles.statusPendingText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    <Text style={styles.qaTo}>{item.targetAuthor}</Text>
                  </View>
                  <View style={styles.qaTopRight}>
                    {item.isPublic && (
                      <View style={styles.publicBadge}>
                        <Text style={styles.publicBadgeText}>공개답변</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                  </View>
                </View>

                {/* 질문 주제 */}
                <Text style={styles.qaTopic}>{item.topic}</Text>
                <Text style={styles.qaQuestion} numberOfLines={2}>
                  Q. {item.question}
                </Text>

                <View style={styles.qaFooterRow}>
                  <Text style={styles.qaTime}>{item.createdAt}</Text>
                  <Text style={styles.qaCommentCount}>
                    💬 댓글 {parseQuestionComments(item.answer, item.answeredAt).length}개
                  </Text>
                </View>
              </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* 입시 컨설팅 목록 */}
        {subTab === 'admission' && (
          <View style={styles.list}>
            {admissionConsults.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '700' }}>
                  아직 등록된 입시 컨설팅 내역이 없습니다.
                </Text>
              </View>
            ) : (
              admissionConsults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.consultCard}
                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                activeOpacity={0.7}
              >
                {/* 컨설팅 카드 헤더 */}
                <View style={styles.qaTop}>
                  <View style={styles.qaTopLeft}>
                    <View style={styles.consultCategoryBadge}>
                      <Text style={styles.consultCategoryText}>{item.category}</Text>
                    </View>
                    <Text style={styles.consultMajor} numberOfLines={1}>
                      {item.targetMajor}
                    </Text>
                  </View>
                  <View style={styles.qaTopRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === '상담완료' ? styles.statusDone : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === '상담완료' ? styles.statusDoneText : styles.statusPendingText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    <Ionicons
                      name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#94a3b8"
                    />
                  </View>
                </View>

                <Text style={styles.consultTitle}>{item.title}</Text>
                <View style={styles.consultMeta}>
                  <Text style={styles.consultMetaText}>{item.gradeAverage}</Text>
                  <Text style={styles.consultMetaText}>→ {item.targetSchool}</Text>
                </View>

                {/* 확장 시 상담 고민 & 전문가 조언 표시 */}
                {expandedId === item.id && (
                  <View>
                    <Text style={styles.consultContent}>{item.content}</Text>
                    <View style={styles.expertBox}>
                      <View style={styles.expertHeader}>
                        <Ionicons name="ribbon" size={13} color="#6366f1" />
                        <Text style={styles.expertHeaderText}>{item.expertName} 조언</Text>
                      </View>
                      <Text style={styles.expertAdvice}>{item.expertAdvice}</Text>
                    </View>
                  </View>
                )}

                <Text style={styles.qaTime}>{item.createdAt}</Text>
              </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* 하단 고정 글쓰기 / 신청하기 바 */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={subTab === 'direct' ? onOpenAskDirect : onOpenAskAdmission}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={16} color="#ffffff" />
          <Text style={styles.ctaBtnText}>
            {subTab === 'direct' ? '입시 질문 올리기' : '입시 컨설팅 신청하기'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 입시질문 상세 & 댓글 모달 (전공게시판 PostDetailModal 스타일) */}
      <PhoneModal visible={Boolean(selectedQuestion)} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.detailOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedQuestionId(null);
                  setModalCommentText('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color="#1e293b" />
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle}>
                입시 질문 · {selectedQuestion?.targetAuthor}
              </Text>
              <View style={{ width: 22 }} />
            </View>

            {selectedQuestion && (() => {
              const comments = parseQuestionComments(
                selectedQuestion.answer,
                selectedQuestion.answeredAt
              );
              const submitModalComment = () => {
                const trimmed = modalCommentText.trim();
                if (!trimmed) return;
                onAddQuestionComment(selectedQuestion.id, trimmed);
                setModalCommentText('');
              };

              return (
                <>
                  <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.detailMetaRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          selectedQuestion.status === '답변완료'
                            ? styles.statusDone
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            selectedQuestion.status === '답변완료'
                              ? styles.statusDoneText
                              : styles.statusPendingText,
                          ]}
                        >
                          {selectedQuestion.status}
                        </Text>
                      </View>
                      <Text style={styles.qaTime}>{selectedQuestion.createdAt}</Text>
                    </View>

                    <Text style={styles.detailTitle}>{selectedQuestion.topic}</Text>
                    <Text style={styles.detailContent}>{selectedQuestion.question}</Text>

                    <View style={styles.detailDivider} />

                    <Text style={styles.detailCommentTitle}>댓글 {comments.length}개</Text>

                    {comments.length === 0 ? (
                      <Text style={styles.detailEmptyComment}>
                        아직 등록된 답변이 없습니다. 첫 댓글을 남겨보세요!
                      </Text>
                    ) : (
                      <View style={{ gap: 10, paddingBottom: 16 }}>
                        {comments.map((c) => (
                          <View key={c.id} style={styles.detailCommentCard}>
                            <View style={styles.detailCommentTop}>
                              <Text style={styles.detailCommentAuthor}>
                                {c.author}
                                {c.grade ? ` · ${c.grade}` : ''}
                              </Text>
                              <Text style={styles.qaTime}>{c.createdAt}</Text>
                            </View>
                            <Text style={styles.detailCommentBody}>{c.content}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.detailInputBar}>
                    <TextInput
                      style={styles.detailInput}
                      value={modalCommentText}
                      onChangeText={setModalCommentText}
                      placeholder="답변이나 댓글을 입력하세요..."
                      placeholderTextColor="#94a3b8"
                      returnKeyType="send"
                      onSubmitEditing={submitModalComment}
                    />
                    <TouchableOpacity
                      style={[
                        styles.detailSendBtn,
                        !modalCommentText.trim() && { backgroundColor: '#cbd5e1' },
                      ]}
                      onPress={submitModalComment}
                    >
                      <Ionicons name="send" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 18,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.sageCard,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  subTabActive: {
    backgroundColor: COLORS.surface,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.muted,
  },
  subTabTextActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  banner: {
    backgroundColor: COLORS.sageSurface,
    borderRadius: 14,
    padding: 18,
    gap: 5,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    letterSpacing: -0.24,
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
  list: {
    width: '100%',
  },
  qaCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 8,
  },
  bottomActionBar: {
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 12,
  },
  ctaBtn: {
    backgroundColor: COLORS.ink,
    borderRadius: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  qaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qaTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  qaTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusDone: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusDoneText: {
    color: '#16a34a',
  },
  statusPendingText: {
    color: '#d97706',
  },
  qaTo: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  publicBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  publicBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563eb',
  },
  qaTopic: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
    marginBottom: 4,
  },
  qaQuestion: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
    marginBottom: 6,
  },
  answerBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 8,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  answerHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  answerText: {
    fontSize: 12,
    color: '#14532d',
    lineHeight: 18,
  },
  qaTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  consultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  consultCategoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  consultCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
  },
  consultMajor: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  consultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  consultMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  consultMetaText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  consultContent: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  expertBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginBottom: 8,
  },
  expertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  expertHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
  },
  expertAdvice: {
    fontSize: 12,
    color: '#3730a3',
    lineHeight: 18,
  },
  qCommentSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  qNoCommentText: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginBottom: 8,
  },
  qCommentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qCommentInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
  },
  qCommentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  qaCommentCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  detailContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  detailScroll: {
    flex: 1,
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
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  detailCommentTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  detailEmptyComment: {
    fontSize: 12.5,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  detailCommentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailCommentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailCommentAuthor: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1e293b',
  },
  detailCommentBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  detailInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  detailInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  detailSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

