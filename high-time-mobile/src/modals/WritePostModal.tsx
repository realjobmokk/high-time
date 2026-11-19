// 게시글 작성 모달 (전공게시판 & 우리학교 게시판 공용)
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneModal } from '../components/PhoneModal';
import { CurrentUser, School, MajorPost, SchoolPost } from '../types';
import { MAJOR_CATEGORIES, POST_TAGS } from '../data/mockData';

interface WritePostModalProps {
  visible: boolean;
  targetBoard: 'major' | 'school';
  initialSchoolCategory?: string;
  currentUser: CurrentUser;
  currentSchool: School;
  onClose: () => void;
  onSubmitMajorPost: (post: MajorPost) => void;
  onSubmitSchoolPost: (post: SchoolPost) => void;
}

export const WritePostModal: React.FC<WritePostModalProps> = ({
  visible,
  targetBoard,
  initialSchoolCategory = '자유게시판',
  currentUser,
  currentSchool,
  onClose,
  onSubmitMajorPost,
  onSubmitSchoolPost,
}) => {
  // 전공게시판용 상태
  const [selectedMajor, setSelectedMajor] = useState(MAJOR_CATEGORIES[1].id); // cs_tech
  const [selectedTag, setSelectedTag] = useState(POST_TAGS[1]); // 세특/탐구주제

  // 우리학교 게시판용 카테고리
  const [schoolCategory, setSchoolCategory] = useState(initialSchoolCategory);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'title' | 'content' | null>(null);

  // 모달이 열릴 때마다 현재 선택된 게시판 카테고리로 기본값 동기화
  useEffect(() => {
    if (visible) {
      setSchoolCategory(initialSchoolCategory || '자유게시판');
      setFormError(null);
      setErrorField(null);
    }
  }, [visible, initialSchoolCategory]);

  // 등록 핸들러
  const handleSubmit = () => {
    setFormError(null);
    setErrorField(null);
    if (!title.trim()) {
      setErrorField('title');
      setFormError('글 제목을 포함해야 합니다.');
      return;
    }
    if (!content.trim()) {
      setErrorField('content');
      setFormError('글 내용을 포함해야 합니다.');
      return;
    }

    const uniqueId = `post-${Date.now()}`;

    if (targetBoard === 'major') {
      const majorObj = MAJOR_CATEGORIES.find((m) => m.id === selectedMajor) || MAJOR_CATEGORIES[1];
      const newPost: MajorPost = {
        id: uniqueId,
        majorId: selectedMajor,
        majorName: majorObj.name,
        tag: selectedTag,
        title: title.trim(),
        content: content.trim(),
        author: {
          nickname: isAnonymous ? '익명' : currentUser.name,
          school: currentSchool.name,
          grade: currentUser.grade,
          isAnonymous,
          avatarColor: isAnonymous ? '#94a3b8' : '#dc2626',
          isMine: true,
        },
        likes: 0,
        commentCount: 0,
        scraps: 0,
        createdAt: '방금 전',
        isMine: true,
        isLikedByUser: false,
        comments: [],
      };
      onSubmitMajorPost(newPost);
    } else {
      const newPost: SchoolPost = {
        id: uniqueId,
        category: schoolCategory,
        title: title.trim(),
        content: content.trim(),
        author: isAnonymous ? '익명' : currentUser.name,
        grade: currentUser.grade,
        isAnonymous,
        isMine: true,
        likes: 0,
        commentCount: 0,
        createdAt: '방금 전',
      };
      onSubmitSchoolPost(newPost);
    }

    // 폼 초기화 및 닫기
    setTitle('');
    setContent('');
    setIsAnonymous(false);
    onClose();
    Alert.alert('성공', '게시물이 성공적으로 등록되었습니다.');
  };

  return (
    <PhoneModal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={targetBoard === 'major' ? 'layers' : 'school'}
                size={18}
                color="#dc2626"
              />
              <Text style={styles.headerTitle}>
                {targetBoard === 'major' ? '전국 전공게시판 글쓰기' : `${currentSchool.name} 글쓰기`}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 전공게시판 필터 선택 */}
            {targetBoard === 'major' ? (
              <View>
                <Text style={styles.sectionLabel}>전공 계열 선택</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {MAJOR_CATEGORIES.filter((m) => m.id !== 'all').map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.chip, selectedMajor === m.id && styles.chipActive]}
                      onPress={() => setSelectedMajor(m.id)}
                    >
                      <Text style={[styles.chipText, selectedMajor === m.id && styles.chipTextActive]}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>분류 태그</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {POST_TAGS.filter((t) => t !== '전체').map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, selectedTag === t && styles.chipActive]}
                      onPress={() => setSelectedTag(t)}
                    >
                      <Text style={[styles.chipText, selectedTag === t && styles.chipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionLabel}>게시판 카테고리</Text>
                <View style={styles.categoryRow}>
                  {['자유게시판', '정보/세특', '동아리', '분실물'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, schoolCategory === cat && styles.catBtnActive]}
                      onPress={() => setSchoolCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catBtnText,
                          schoolCategory === cat && styles.catBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 제목 입력 */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>제목</Text>
            <TextInput
              style={[
                styles.titleInput,
                errorField === 'title' && {
                  borderColor: '#ef4444',
                  backgroundColor: '#fef2f2',
                },
              ]}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errorField === 'title') setErrorField(null);
                setFormError(null);
              }}
              placeholder="제목을 입력하세요 (예: [화학II 세특] 아스피린 합성 실험)"
              placeholderTextColor="#94a3b8"
            />

            {/* 본문 입력 */}
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>본문 내용</Text>
            <TextInput
              style={[
                styles.contentInput,
                errorField === 'content' && {
                  borderColor: '#ef4444',
                  backgroundColor: '#fef2f2',
                },
              ]}
              value={content}
              onChangeText={(t) => {
                setContent(t);
                if (errorField === 'content') setErrorField(null);
                setFormError(null);
              }}
              placeholder="탐구 내용, 문제의식, 참고 도서, 질문 등을 자유롭고 자세하게 작성해주세요. 건전하고 안전한 커뮤니티 문화를 지켜주세요."
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />

            {formError && (
              <View
                style={{
                  backgroundColor: '#fef2f2',
                  borderWidth: 1,
                  borderColor: '#fecaca',
                  borderRadius: 10,
                  padding: 10,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '800', flex: 1 }}>
                  {formError}
                </Text>
              </View>
            )}

            {/* 옵션: 익명 여부 & 작성자 정보 */}
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={styles.anonToggle}
                onPress={() => setIsAnonymous(!isAnonymous)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isAnonymous ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isAnonymous ? '#dc2626' : '#94a3b8'}
                />
                <Text style={styles.anonText}>익명으로 작성하기</Text>
              </TouchableOpacity>

              <Text style={styles.authorBadge}>
                {currentSchool.name} · {currentUser.grade}
              </Text>
            </View>

            {/* 등록 버튼 */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>게시글 등록하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </PhoneModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  chipScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#dc2626',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  catBtnActive: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  catBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  catBtnTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 120,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  anonText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  authorBadge: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

