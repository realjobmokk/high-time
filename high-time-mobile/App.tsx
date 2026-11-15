import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 🎓 HighTime (고교타임) 공식 React Native 모바일 애플리케이션

// 1. 전국 고교 전공 카테고리 정의
const MAJOR_CATEGORIES = [
  { id: 'all', name: '전체 전공', icon: 'sparkles' },
  { id: 'cs', name: '컴퓨터·IT', icon: 'code-slash' },
  { id: 'med', name: '의약학·바이오', icon: 'medkit' },
  { id: 'eng', name: '자연·공학', icon: 'hardware-chip' },
  { id: 'biz', name: '경영·경제', icon: 'trending-up' },
  { id: 'law', name: '사회·법학', icon: 'scale' },
];

export default function App() {
  // 현재 탭 상태 ('home' | 'major' | 'school' | 'counseling' | 'chat')
  const [activeTab, setActiveTab] = useState<'home' | 'major' | 'school' | 'counseling' | 'chat'>('home');
  const [selectedMajor, setSelectedMajor] = useState('all');

  // 사용자 정보 (소속 학교 고정 & 인증 상태)
  const [currentUser, setCurrentUser] = useState({
    name: '김민준',
    school: '하나고등학교',
    grade: '고2',
    isVerified: true
  });

  // 전공 게시글 상태
  const [majorPosts, setMajorPosts] = useState([
    {
      id: 'p-1',
      title: '[정보 세특] 생성형 AI 환각 완화 알고리즘 탐구',
      content: 'RAG 기법과 코사인 유사도 검증 파이썬 코드를 작성해봤습니다. 관심 있는 친구들 질문 환영해요!',
      school: '하나고',
      grade: '고2',
      likes: 42,
      comments: 9,
      isMine: true // 내가 쓴 글 (삭제 권한 있음)
    },
    {
      id: 'p-2',
      title: '의대/약대 지망생 추천 면역학 도서 3권 & 세특 팁',
      content: '《면역》과 《인류를 구한 12가지 약 이야기》를 활용한 생명과학 세특 연계 방향성 공유합니다.',
      school: '상산고',
      grade: '고3',
      likes: 88,
      comments: 15,
      isMine: false // 타 학교 학생 글
    }
  ]);

  // 게시글 삭제 핸들러 (내 글만 삭제 가능)
  const handleDeletePost = (id: string) => {
    Alert.alert(
      '게시글 삭제',
      '정말 내가 작성한 이 게시물을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setMajorPosts(prev => prev.filter(p => p.id !== id));
            Alert.alert('알림', '게시물이 삭제되었습니다.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* 1. 상단 앱 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>H</Text>
          </View>
          <View>
            <View style={styles.logoRow}>
              <Text style={styles.logoTitle}>HighTime</Text>
              <View style={styles.highSchoolBadge}>
                <Text style={styles.highSchoolBadgeText}>고교타임</Text>
              </View>
            </View>
            <Text style={styles.logoSub}>전국 고교 커뮤니티 & 학교생활</Text>
          </View>
        </View>

        {/* 내 인증 학교 고정 뱃지 */}
        <TouchableOpacity
          style={styles.schoolBadge}
          onPress={() => Alert.alert('학생 인증 정보', `${currentUser.name} (${currentUser.school} ${currentUser.grade})\nPASS 본인확인 및 재학증명서 인증 완료`)}
        >
          <Ionicons name="shield-checkmark" size={13} color="#dc2626" />
          <Text style={styles.schoolBadgeText}>{currentUser.school}</Text>
          <Ionicons name="lock-closed" size={10} color="#991b1b" />
        </TouchableOpacity>
      </View>

      {/* 2. 본문 스크롤 영역 (활성 탭에 따른 뷰) */}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* 탭 1: 종합 [홈] 화면 */}
        {activeTab === 'home' && (
          <View style={styles.tabContent}>
            {/* 환영 카드 */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeTop}>
                <View style={styles.verifiedPill}>
                  <Ionicons name="school" size={12} color="#ffffff" />
                  <Text style={styles.verifiedPillText}>{currentUser.school} 정회원</Text>
                </View>
                <Text style={styles.welcomeDate}>2026. 11. 15 (수)</Text>
              </View>
              <Text style={styles.welcomeTitle}>{currentUser.name} 학생, 오늘도 열공하세요! 🔥</Text>
              <Text style={styles.welcomeSub}>수능과 기말고사를 준비하는 전국 고교생 라운지</Text>

              {/* 퀵 바로가기 버튼 */}
              <View style={styles.quickActionRow}>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => setActiveTab('major')}
                >
                  <Ionicons name="create-outline" size={16} color="#ffffff" />
                  <Text style={styles.quickButtonText}>글쓰기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => setActiveTab('counseling')}
                >
                  <Ionicons name="help-circle-outline" size={16} color="#ffffff" />
                  <Text style={styles.quickButtonText}>1:1 질문</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => setActiveTab('counseling')}
                >
                  <Ionicons name="school-outline" size={16} color="#ffffff" />
                  <Text style={styles.quickButtonText}>입시상담</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* D-Day 학사 일정 */}
            <Text style={styles.sectionTitle}>📅 주요 시험 D-day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dDayScroll}>
              <View style={[styles.dDayCard, { borderLeftColor: '#ef4444' }]}>
                <Text style={styles.dDayName}>2027 대학수능</Text>
                <Text style={[styles.dDayCount, { color: '#ef4444' }]}>D-4</Text>
              </View>
              <View style={[styles.dDayCard, { borderLeftColor: '#6366f1' }]}>
                <Text style={styles.dDayName}>2학기 기말고사</Text>
                <Text style={[styles.dDayCount, { color: '#6366f1' }]}>D-29</Text>
              </View>
              <View style={[styles.dDayCard, { borderLeftColor: '#10b981' }]}>
                <Text style={styles.dDayName}>겨울방학식</Text>
                <Text style={[styles.dDayCount, { color: '#10b981' }]}>D-54</Text>
              </View>
            </ScrollView>

            {/* 오늘의 급식 & 시간표 위젯 */}
            <View style={styles.gridRow}>
              {/* 급식 위젯 */}
              <View style={styles.widgetCard}>
                <View style={styles.widgetHeader}>
                  <Ionicons name="restaurant" size={14} color="#dc2626" />
                  <Text style={styles.widgetTitle}>오늘의 급식</Text>
                  <Text style={styles.calText}>892 kcal</Text>
                </View>
                <Text style={styles.menuItem}>• 차조밥</Text>
                <Text style={styles.menuItem}>• 얼큰순두부찌개</Text>
                <Text style={styles.menuItem}>• 수제 치즈 돈까스</Text>
                <Text style={styles.menuItem}>• 단호박 샐러드</Text>
                <Text style={styles.voteText}>❤️ 대존맛 (142표)</Text>
              </View>

              {/* 시간표 위젯 */}
              <View style={styles.widgetCard}>
                <View style={styles.widgetHeader}>
                  <Ionicons name="time" size={14} color="#4f46e5" />
                  <Text style={styles.widgetTitle}>수요 시간표</Text>
                  <Text style={styles.shortText}>6교시</Text>
                </View>
                <Text style={styles.timeItem}>1교시: 수학I</Text>
                <Text style={styles.timeItem}>2교시: 지구과학I</Text>
                <Text style={styles.timeItem}>3교시: 문학</Text>
                <Text style={[styles.timeItem, styles.currentTime]}>4교시: 체육 (진행중)</Text>
                <Text style={styles.nextText}>5교시: 영어 · 6교시: 정보</Text>
              </View>
            </View>

            {/* 추천 탐구 키워드 */}
            <Text style={styles.sectionTitle}>💡 오늘의 추천 세특 키워드</Text>
            <View style={styles.keywordWrap}>
              {['#RAG_생성형AI', '#미하엘리스_효소학', '#기준금리_통화정책', '#베르누이_유체역학'].map((kw, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.keywordChip}
                  onPress={() => setActiveTab('major')}
                >
                  <Text style={styles.keywordText}>{kw}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 탭 2: 전국 [전공게시판] */}
        {activeTab === 'major' && (
          <View style={styles.tabContent}>
            {/* 전공 카테고리 칩 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.majorChipsScroll}>
              {MAJOR_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.majorChip, selectedMajor === cat.id && styles.majorChipActive]}
                  onPress={() => setSelectedMajor(cat.id)}
                >
                  <Text style={[styles.majorChipText, selectedMajor === cat.id && styles.majorChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 글 목록 */}
            <View style={styles.postList}>
              {majorPosts.map(post => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postTop}>
                    <View style={styles.postSchoolBadge}>
                      <Text style={styles.postSchoolText}>{post.school} · {post.grade}</Text>
                    </View>

                    {/* 내가 쓴 글인 경우에만 [내 글] 뱃지 & 삭제 버튼 노출 */}
                    {post.isMine && (
                      <View style={styles.mineRow}>
                        <View style={styles.mineBadge}>
                          <Text style={styles.mineBadgeText}>내 글</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeletePost(post.id)}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postSnippet} numberOfLines={2}>{post.content}</Text>

                  <View style={styles.postFooter}>
                    <Text style={styles.footerInfo}>방금 전</Text>
                    <View style={styles.interactionRow}>
                      <Text style={styles.interactionText}>👍 {post.likes}</Text>
                      <Text style={styles.interactionText}>💬 {post.comments}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 탭 3: [우리학교] 게시판 */}
        {activeTab === 'school' && (
          <View style={styles.tabContent}>
            <View style={styles.schoolNoticeCard}>
              <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
              <Text style={styles.schoolNoticeText}>
                {currentUser.school} 인증 학생만 입장 가능한 교내 비밀 커뮤니티입니다.
              </Text>
            </View>
            <View style={styles.postCard}>
              <Text style={styles.postTitle}>오늘 급식 돈까스 진짜 맛있었음 ㅋㅋ</Text>
              <Text style={styles.postSnippet}>영양사 선생님 항상 감사합니다!</Text>
              <View style={styles.postFooter}>
                <Text style={styles.footerInfo}>익명 · 방금 전</Text>
                <Text style={styles.interactionText}>👍 38 · 💬 7</Text>
              </View>
            </View>
          </View>
        )}

        {/* 탭 4: [입시·1:1질문] */}
        {activeTab === 'counseling' && (
          <View style={styles.tabContent}>
            <View style={styles.counselingBanner}>
              <Text style={styles.bannerTitle}>🎓 고교 1:1 질문 & 맞춤 입시 상담</Text>
              <Text style={styles.bannerSub}>명문대 선배 멘토진이 생기부와 진로를 답변해드립니다.</Text>
            </View>
            <TouchableOpacity
              style={styles.askButton}
              onPress={() => Alert.alert('1:1 질문', '관심 있는 전공의 우수 선배에게 질문을 등록합니다.')}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text style={styles.askButtonText}>새 1:1 질문 남기기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 탭 5: [1:1 채팅] */}
        {activeTab === 'chat' && (
          <View style={styles.tabContent}>
            <View style={styles.chatCard}>
              <View style={styles.chatAvatar}>
                <Text style={styles.avatarText}>하얀</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>하얀가운꿈나무 (상산고 멘토)</Text>
                <Text style={styles.chatMsg}>카탈레이스 실험 오차 줄이는 노트 사진 보내드렸어요!</Text>
              </View>
              <Text style={styles.chatTime}>오후 2:48</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 3. 하단 5개 탭 내비게이션 바 */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('major')}
        >
          <Ionicons
            name={activeTab === 'major' ? 'layers' : 'layers-outline'}
            size={22}
            color={activeTab === 'major' ? '#dc2626' : '#94a3b8'}
          />
          <Text style={[styles.navLabel, activeTab === 'major' && styles.navLabelActive]}>
            전공게시판
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('school')}
        >
          <Ionicons
            name={activeTab === 'school' ? 'school' : 'school-outline'}
            size={22}
            color={activeTab === 'school' ? '#dc2626' : '#94a3b8'}
          />
          <Text style={[styles.navLabel, activeTab === 'school' && styles.navLabelActive]}>
            우리학교
          </Text>
        </TouchableOpacity>

        {/* 가운데 종합 홈 탭 */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color={activeTab === 'home' ? '#dc2626' : '#94a3b8'}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            홈
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('counseling')}
        >
          <Ionicons
            name={activeTab === 'counseling' ? 'heart-circle' : 'heart-circle-outline'}
            size={22}
            color={activeTab === 'counseling' ? '#dc2626' : '#94a3b8'}
          />
          <Text style={[styles.navLabel, activeTab === 'counseling' && styles.navLabelActive]}>
            입시·질문
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('chat')}
        >
          <Ionicons
            name={activeTab === 'chat' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            size={22}
            color={activeTab === 'chat' ? '#dc2626' : '#94a3b8'}
          />
          <Text style={[styles.navLabel, activeTab === 'chat' && styles.navLabelActive]}>
            1:1채팅
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// React Native 모바일 스타일시트
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#dc2626',
    letterSpacing: -0.5,
  },
  highSchoolBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  highSchoolBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  logoSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  schoolBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b91c1c',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  tabContent: {
    padding: 16,
    gap: 14,
  },
  welcomeCard: {
    backgroundColor: '#dc2626',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#dc2626',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  welcomeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  welcomeDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 7,
    borderRadius: 12,
  },
  quickButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 4,
  },
  dDayScroll: {
    flexDirection: 'row',
  },
  dDayCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    marginRight: 8,
    minWidth: 115,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  dDayName: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  dDayCount: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginLeft: 4,
  },
  calText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#d97706',
  },
  shortText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  menuItem: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 3,
  },
  voteText: {
    fontSize: 10,
    color: '#e11d48',
    fontWeight: 'bold',
    marginTop: 6,
  },
  timeItem: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 3,
  },
  currentTime: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  nextText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 4,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keywordText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  majorChipsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  majorChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
  },
  majorChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  majorChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  majorChipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  postList: {
    gap: 10,
  },
  postCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  postTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  postSchoolBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  postSchoolText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  mineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mineBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mineBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  deleteButton: {
    padding: 2,
  },
  postTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  postSnippet: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 8,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 6,
  },
  footerInfo: {
    fontSize: 10,
    color: '#94a3b8',
  },
  interactionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  interactionText: {
    fontSize: 10,
    color: '#64748b',
  },
  schoolNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  schoolNoticeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  counselingBanner: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 18,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bannerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 14,
  },
  askButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f43f5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  chatMsg: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  chatTime: {
    fontSize: 9,
    color: '#94a3b8',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 4 : 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
});
