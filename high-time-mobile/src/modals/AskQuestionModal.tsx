// 1:1 질문 및 입시 컨설팅 신청 모달
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneModal } from '../components/PhoneModal';
import { CurrentUser, DirectQuestion, AdmissionConsult } from '../types';

interface AskQuestionModalProps {
  visible: boolean;
  mode: 'direct' | 'admission';
  defaultTarget?: string;
  defaultTopic?: string;
  currentUser: CurrentUser;
  onClose: () => void;
  onSubmitQuestion: (question: DirectQuestion) => void;
  onSubmitConsult: (consult: AdmissionConsult) => void;
}

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  visible,
  mode,
  defaultTarget = '',
  defaultTopic = '',
  currentUser,
  onClose,
  onSubmitQuestion,
  onSubmitConsult,
}) => {
  // 입시 질문 게시판 폼 상태 (targetAuthor 필드에 질문 분류 저장)
  const [target, setTarget] = useState(defaultTarget || '수시/학종');
  const [topic, setTopic] = useState(defaultTopic);
  const [questionText, setQuestionText] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const QUESTION_CATEGORIES = ['수시/학종', '정시/수능', '생기부/세특', '내신/공부법', '대학/학과선택'];

  // 입시 상담 폼 상태
  const [consultCategory, setConsultCategory] = useState('학생부종합(학종)');
  const [targetMajor, setTargetMajor] = useState('');
  const [targetSchool, setTargetSchool] = useState('');
  const [gradeAverage, setGradeAverage] = useState('내신 일반고 1.8등급');
  const [consultTitle, setConsultTitle] = useState('');
  const [consultContent, setConsultContent] = useState('');

  // 1:1 질문 등록
  const handleSubmitDirect = () => {
    if (!topic.trim()) {
      Alert.alert('알림', '질문 주제를 입력해주세요.');
      return;
    }
    if (!questionText.trim()) {
      Alert.alert('알림', '질문 내용을 입력해주세요.');
      return;
    }

    const newQuestion: DirectQuestion = {
      id: `dq-${Date.now()}`,
      targetAuthor: target.trim(),
      topic: topic.trim(),
      question: questionText.trim(),
      answer: null,
      status: '답변대기중',
      createdAt: '방금 전',
      answeredAt: null,
      isPublic,
    };

    onSubmitQuestion(newQuestion);
    onClose();
    Alert.alert('등록 완료', '입시 질문 게시판에 질문이 등록되었습니다.');
  };

  // 입시 상담 등록
  const handleSubmitAdmission = () => {
    if (!consultTitle.trim()) {
      Alert.alert('알림', '상담 제목을 입력해주세요.');
      return;
    }
    if (!consultContent.trim()) {
      Alert.alert('알림', '고민 내용을 입력해주세요.');
      return;
    }

    const newConsult: AdmissionConsult = {
      id: `ac-${Date.now()}`,
      category: consultCategory,
      targetMajor: targetMajor.trim() || '컴퓨터공학 / AI',
      targetSchool: targetSchool.trim() || '수도권 주요 대학',
      gradeAverage: gradeAverage.trim(),
      title: consultTitle.trim(),
      content: consultContent.trim(),
      expertAdvice: '전문 입시 컨설턴트가 학생부 기재 내용과 전형 유불리를 정밀 검토 중입니다. 곧 맞춤 피드백이 등록됩니다.',
      expertName: '대치동 입시센터 전문위원',
      status: '검토중',
      createdAt: '방금 전',
    };

    onSubmitConsult(newConsult);
    onClose();
    Alert.alert('성공', '입시 상담 신청이 접수되었습니다.');
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
                name={mode === 'direct' ? 'help-buoy' : 'school'}
                size={18}
                color="#dc2626"
              />
              <Text style={styles.headerTitle}>
                {mode === 'direct' ? '입시 질문 게시판 글쓰기' : '전문 입시 컨설팅 신청'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {mode === 'direct' ? (
              <View>
                <Text style={styles.sectionLabel}>입시 질문 카테고리 선택</Text>
                <View style={[styles.categoryRow, { flexWrap: 'wrap', marginBottom: 12 }]}>
                  {QUESTION_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, target === cat && styles.catBtnActive]}
                      onPress={() => setTarget(cat)}
                    >
                      <Text
                        style={[
                          styles.catBtnText,
                          target === cat && styles.catBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>질문 제목</Text>
                <TextInput
                  style={styles.input}
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="예: 일반고 내신 2.1등급 컴공 학종 vs 교과 어디가 유리할까요?"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>입시 질문 상세 내용</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={questionText}
                  onChangeText={setQuestionText}
                  placeholder="수시/정시 전형 고민, 생기부 세특 방향, 내신 등급별 지원 대학 등 궁금한 입시 질문을 자유롭게 작성해주세요."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 16 }]}
                  onPress={handleSubmitDirect}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>입시 질문 게시판에 등록하기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionLabel}>상담 희망 전형</Text>
                <View style={styles.categoryRow}>
                  {['학생부종합(학종)', '교과/수능최저', '논술/면접'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catBtn, consultCategory === cat && styles.catBtnActive]}
                      onPress={() => setConsultCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catBtnText,
                          consultCategory === cat && styles.catBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>목표 전공 & 희망 대학</Text>
                <TextInput
                  style={styles.input}
                  value={targetMajor}
                  onChangeText={setTargetMajor}
                  placeholder="예: 컴퓨터공학 / 서울대, 카이스트, 고려대"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>현재 내신 및 모의고사 성적</Text>
                <TextInput
                  style={styles.input}
                  value={gradeAverage}
                  onChangeText={setGradeAverage}
                  placeholder="예: 일반고 내신 1.6 / 국어2 수학1 영어1 과탐2"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>상담 제목</Text>
                <TextInput
                  style={styles.input}
                  value={consultTitle}
                  onChangeText={setConsultTitle}
                  placeholder="제목을 입력하세요"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.sectionLabel, { marginTop: 12 }]}>상세 고민 내용</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={consultContent}
                  onChangeText={setConsultContent}
                  placeholder="생기부 세특 상황, 수능 최저 충족 가능성, 전형 선택 고민 등을 적어주세요."
                  placeholderTextColor="#94a3b8"
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmitAdmission}
                  activeOpacity={0.8}
                >
                  <Ionicons name="school" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>입시 컨설팅 신청하기</Text>
                </TouchableOpacity>
              </View>
            )}
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
    maxHeight: '90%',
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
  mentorBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  mentorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9f1239',
  },
  mentorSub: {
    fontSize: 11,
    color: '#e11d48',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    minHeight: 100,
  },
  anonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 16,
  },
  anonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
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
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  catBtnTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

