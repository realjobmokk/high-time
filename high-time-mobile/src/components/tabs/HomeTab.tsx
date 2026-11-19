// 3번 탭: 종합 [홈] 메인 대시보드 화면
// - 선택한 고등학교(기본: 대현고등학교)의 나이스(NEIS) 실시간 급식표 연동
// - 현재 시각 기준 실시간 수강 중인 과목 자동 계산 및 시간표 하이라이트 표기
// - 나이스(NEIS) 학사일정 API 연동 및 남은 일수(D-Day) 실시간 자동 계산 표기
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CurrentUser,
  School,
  MajorPost,
  MealInfo,
  DDayItem,
  CustomTimetableBlock,
  WeekdayKey,
} from '../../types';
import { INITIAL_DDAY_LIST } from '../../data/mockData';
import {
  fetchNeisMealInfo,
  fetchNeisSchedule,
} from '../../services/neisService';
import { TimetableModal, formatTimeRange } from '../../modals/TimetableModal';
import { ScheduleCalendarModal } from '../../modals/ScheduleCalendarModal';

interface HomeTabProps {
  currentUser: CurrentUser;
  currentSchool: School;
  hotPosts: MajorPost[];
  customTimetable: CustomTimetableBlock[];
  onAddOrUpdateTimetableBlock: (block: CustomTimetableBlock) => void;
  onDeleteTimetableBlock: (blockId: string) => void;
  onNavigateTab: (tab: 'major' | 'school' | 'home' | 'counseling' | 'chat' | 'profile') => void;
  onOpenWriteModal: (targetBoard: 'major' | 'school') => void;
  onSelectPost: (post: MajorPost) => void;
  onOpenAskModal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  currentUser,
  currentSchool,
  hotPosts,
  customTimetable,
  onAddOrUpdateTimetableBlock,
  onDeleteTimetableBlock,
  onNavigateTab,
  onOpenWriteModal,
  onSelectPost,
  onOpenAskModal,
}) => {
  const [mealInfo, setMealInfo] = useState<MealInfo | null>(null);
  const [isMealLoading, setIsMealLoading] = useState(false);
  const [mealVoteCount, setMealVoteCount] = useState(0);
  const [hasVotedMeal, setHasVotedMeal] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // 나이스 학사일정 상태
  const [dDayList, setDDayList] = useState<DDayItem[]>(INITIAL_DDAY_LIST);

  // 현재 시각 상태 (실시간 과목 매칭용, 30초마다 갱신)
  const [nowTime, setNowTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 교육부 나이스(NEIS) 오픈 API (선택한 학교의 중식 급식 + 학사일정 D-day) 호출
  useEffect(() => {
    let isMounted = true;
    const loadNeisAll = async () => {
      setIsMealLoading(true);
      const [mealRes, schedRes] = await Promise.all([
        fetchNeisMealInfo(currentSchool),
        fetchNeisSchedule(currentSchool),
      ]);

      if (isMounted) {
        setMealInfo(mealRes);
        if (schedRes.length > 0) {
          setDDayList(schedRes);
        }
        setIsMealLoading(false);
      }
    };
    loadNeisAll();
    return () => {
      isMounted = false;
    };
  }, [currentSchool]);

  const displayMenu = mealInfo?.menu || [];
  const displayCalorie = mealInfo?.calorie || '-';

  // 오늘 요일('월'~'금') 계산 및 내가 직접 작성한 시간표 기준 실시간 수강 상태 계산
  const dayNames: Record<number, WeekdayKey> = {
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
  };
  const dayOrder: Record<WeekdayKey, number> = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
  const todayDayKey: WeekdayKey = dayNames[nowTime.getDay()] || '월';
  const todayBlocks = [...customTimetable]
    .filter((b) => b.day === todayDayKey)
    .sort((a, b) => a.startHour - b.startHour);

  // 오늘 요일 수업이 있으면 오늘 수업을 우선 표시하고, 다른 요일에 추가한 수업이 있으면 함께 정렬해 모두 표시
  const allSortedBlocks = [...customTimetable].sort(
    (a, b) => dayOrder[a.day] - dayOrder[b.day] || a.startHour - b.startHour
  );
  const displayedBlocks = todayBlocks.length > 0 ? todayBlocks : allSortedBlocks;

  const currentHourFloat = nowTime.getHours() + nowTime.getMinutes() / 60;
  const currentTimeStr = `${String(nowTime.getHours()).padStart(2, '0')}:${String(
    nowTime.getMinutes()
  ).padStart(2, '0')}`;

  const activeBlock = todayBlocks.find(
    (b) =>
      currentHourFloat >= b.startHour &&
      currentHourFloat <= Math.max(b.startHour, b.endHour - 1) + 50 / 60
  );
  const nextBlock = todayBlocks.find((b) => b.startHour > currentHourFloat);

  const bannerText = activeBlock
    ? `현재 ${currentTimeStr} · [${activeBlock.subject}] 수강 중 (${formatTimeRange(
      activeBlock.startHour,
      activeBlock.endHour
    )})`
    : nextBlock
      ? `현재 ${currentTimeStr} · 다음 수업 [${nextBlock.subject}] (${nextBlock.startHour}:00 시작)`
      : todayBlocks.length > 0
        ? `현재 ${currentTimeStr} · 오늘(${todayDayKey}요일) 등록된 수업 종료`
        : `현재 ${currentTimeStr} · [오늘 시간표]에서 직접 내 시간표를 추가해 보세요!`;

  // 수능 D-Day 자동 계산 (매년 11월 셋째 주 목요일 기준)
  const getSuneungDate = (year: number) => {
    const nov1 = new Date(year, 10, 1);
    const firstThuOffset = (4 - nov1.getDay() + 7) % 7;
    return new Date(year, 10, 1 + firstThuOffset + 14);
  };
  const suneungDDayLabel = (() => {
    const today = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate());
    let target = getSuneungDate(today.getFullYear());
    let diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff < 0) {
      target = getSuneungDate(today.getFullYear() + 1);
      diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    }
    return diff === 0 ? '수능 D-DAY' : `수능 D-${diff}`;
  })();

  // 급식 투표 핸들러
  const handleVoteMeal = () => {
    if (hasVotedMeal) {
      setMealVoteCount((prev) => prev - 1);
      setHasVotedMeal(false);
    } else {
      setMealVoteCount((prev) => prev + 1);
      setHasVotedMeal(true);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. 환영 학생증 카드 */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeTop}>
          <View style={styles.verifiedPill}>
            <Ionicons name="school" size={12} color="#ffffff" />
            <Text style={styles.verifiedPillText}>{currentSchool.name}</Text>
          </View>
          <Text style={styles.welcomeDate}>
            현재 시각 {currentTimeStr} ({todayDayKey}요일)
          </Text>
        </View>

        <Text
          style={styles.welcomeTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {currentUser.name} 학생, 오늘도 열공하세요! 🔥
        </Text>
        <View style={styles.suneungMidRow}>
          <Text style={styles.suneungBadgeText}>🎓 {suneungDDayLabel}</Text>
        </View>
        <Text style={styles.welcomeSub}>
          {bannerText}
        </Text>

        {/* 퀵 바로가기 버튼 */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onOpenWriteModal('major')}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={15} color="#ffffff" />
            <Text style={styles.quickButtonText}>글쓰기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={onOpenAskModal}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={15} color="#ffffff" />
            <Text style={styles.quickButtonText}>입시 질문</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => onNavigateTab('counseling')}
            activeOpacity={0.8}
          >
            <Ionicons name="school-outline" size={15} color="#ffffff" />
            <Text style={styles.quickButtonText}>입시 컨설팅</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. D-Day 주요 학사 일정 (나이스 SchoolSchedule API 기반 남은 일수 자동 계산 + 달력 보기) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📅 {currentSchool.name} 학사일정 D-day</Text>
        <TouchableOpacity
          onPress={() => setIsCalendarModalOpen(true)}
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
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={13} color="#dc2626" />
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#dc2626' }}>달력 보기</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dDayScroll}>
        {dDayList.map((item, idx) => (
          <View key={idx} style={[styles.dDayCard, { borderLeftColor: item.badgeColor }]}>
            <Text style={styles.dDayName} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.dDayCount, { color: item.badgeColor }]}>{item.dDay}</Text>
            <Text style={styles.dDayTarget}>{item.targetDate}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 3. 급식 & 시간표 위젯 2열 그리드 */}
      <View style={styles.gridRow}>
        {/* 나이스 실시간 급식 위젯 (선택한 고등학교 기준) */}
        <View style={styles.widgetCard}>
          <View style={styles.widgetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="restaurant" size={14} color="#dc2626" />
              <Text style={styles.widgetTitle}>오늘의 급식</Text>
            </View>
            <Text style={styles.calText}>{displayCalorie}</Text>
          </View>

          <Text style={styles.subDateText}>
            {currentSchool.name} · {mealInfo?.date || '오늘의 중식'}
          </Text>

          {isMealLoading ? (
            <View style={styles.mealLoading}>
              <ActivityIndicator size="small" color="#dc2626" />
              <Text style={styles.mealLoadingText}>NEIS 식단표 수신 중...</Text>
            </View>
          ) : displayMenu.length > 0 ? (
            <View style={styles.mealMenuWrap}>
              {displayMenu.map((m, idx) => (
                <Text key={idx} style={styles.menuItem} numberOfLines={1}>
                  • {m.name}
                </Text>
              ))}
            </View>
          ) : (
            <View style={[styles.mealLoading, { flex: 1 }]}>
              <Text style={styles.mealLoadingText}>
                {mealInfo?.message || '등록된 급식 정보가 없습니다.'}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.voteButton, { marginTop: 'auto' }, hasVotedMeal && styles.voteButtonActive]}
            onPress={handleVoteMeal}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasVotedMeal ? 'heart' : 'heart-outline'}
              size={13}
              color={hasVotedMeal ? '#ffffff' : '#dc2626'}
            />
            <Text style={[styles.voteButtonText, hasVotedMeal && styles.voteButtonTextActive]}>
              대존맛 ({mealVoteCount}표)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 내가 직접 작성하는 오늘 시간표 위젯 (클릭 시 에브리타임 스타일 주간 시간표 그리드 오픈) */}
        <View style={styles.widgetCard}>
          <View style={[styles.widgetHeader, { gap: 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              <Ionicons name="calendar" size={13} color="#4f46e5" />
              <Text style={[styles.widgetTitle, { fontSize: 12 }]} numberOfLines={1}>
                오늘 시간표
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsTimetableModalOpen(true)}
              style={{
                width: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#eef2ff',
                borderRadius: 8,
                flexShrink: 0,
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={15} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          {/* 오늘 시간표가 등록되어 있을 때만 실시간 수강 과목 상태 안내 박스 표시 */}
          {todayBlocks.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsTimetableModalOpen(true)}
              style={[
                styles.liveClassBanner,
                activeBlock ? styles.liveClassBannerActive : styles.liveClassBannerIdle,
              ]}
            >
              <View style={styles.liveDot} />
              <Text style={styles.liveClassBannerText} numberOfLines={2}>
                {activeBlock
                  ? `[${activeBlock.subject}] 수강중 (${formatTimeRange(
                    activeBlock.startHour,
                    activeBlock.endHour
                  )})`
                  : nextBlock
                    ? `다음 수업 [${nextBlock.subject}] (${String(nextBlock.startHour).padStart(2, '0')}:00 시작)`
                    : `오늘(${todayDayKey}) 등록된 수업이 종료되었습니다`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={[styles.timetableWrap, { flex: 1 }]}>
            {customTimetable.length === 0 ? (
              <TouchableOpacity
                onPress={() => setIsTimetableModalOpen(true)}
                style={{
                  flex: 1,
                  minHeight: 140,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: '#cbd5e1',
                  borderRadius: 10,
                  gap: 6,
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#6366f1" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                  + 내 시간표 직접 작성하기
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 6 }}>
                {/* 등록된 수업 텍스트 리스트 표기 */}
                {displayedBlocks.map((block) => {
                  const isTakingNow = activeBlock?.id === block.id;
                  const isNext = !activeBlock && nextBlock?.id === block.id;
                  return (
                    <TouchableOpacity
                      key={block.id}
                      activeOpacity={0.8}
                      onPress={() => setIsTimetableModalOpen(true)}
                      style={[
                        styles.periodRow,
                        (isTakingNow || isNext) && styles.currentTimeBadge,
                        isTakingNow && styles.takingNowBadge,
                      ]}
                    >
                      <View
                        style={{
                          width: 4,
                          height: 22,
                          borderRadius: 2,
                          backgroundColor: block.color,
                          marginRight: 6,
                        }}
                      />
                      <View style={styles.periodLeft}>
                        <Text
                          style={[
                            styles.timeItem,
                            (isTakingNow || isNext) && styles.currentTimeText,
                          ]}
                          numberOfLines={1}
                        >
                          {block.subject}
                        </Text>
                        <Text style={styles.periodClockText}>
                          {formatTimeRange(block.startHour, block.endHour)}
                          {block.room ? ` · ${block.room}` : ''}
                        </Text>
                      </View>
                      {(isTakingNow || isNext) && (
                        <View
                          style={[
                            styles.statusPill,
                            isTakingNow ? styles.statusPillTaking : styles.statusPillNext,
                          ]}
                        >
                          <Text style={styles.statusPillText}>
                            {isTakingNow ? '수강중' : '다음'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 에브리타임 스타일 주간 시간표 직접 작성 모달 */}
      <TimetableModal
        visible={isTimetableModalOpen}
        blocks={customTimetable}
        onClose={() => setIsTimetableModalOpen(false)}
        onAddOrUpdateBlock={onAddOrUpdateTimetableBlock}
        onDeleteBlock={onDeleteTimetableBlock}
      />

      {/* 나이스 학사일정 월간 달력 모달 */}
      <ScheduleCalendarModal
        visible={isCalendarModalOpen}
        currentUser={currentUser}
        currentSchool={currentSchool}
        onClose={() => setIsCalendarModalOpen(false)}
      />

      {/* 4. 실시간 전국 핫게시물 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 실시간 전국 핫게시물</Text>
        <TouchableOpacity onPress={() => onNavigateTab('major')}>
          <Text style={styles.seeMoreText}>전체보기 &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hotList}>
        {hotPosts.length === 0 ? (
          <View style={styles.mealLoading}>
            <Text style={styles.mealLoadingText}>
              아직 등록된 게시글이 없습니다. 첫 번째 게시글을 작성해 보세요!
            </Text>
          </View>
        ) : (
          hotPosts.slice(0, 2).map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.hotCard}
              onPress={() => onSelectPost(post)}
              activeOpacity={0.7}
            >
              <View style={styles.hotTop}>
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>{post.majorName}</Text>
                </View>
                <Text style={styles.hotSchool}>
                  {post.author.school} · {post.author.grade}
                </Text>
              </View>
              <Text style={styles.hotTitle} numberOfLines={1}>
                {post.title}
              </Text>
              <Text style={styles.hotSnippet} numberOfLines={2}>
                {post.content}
              </Text>
              <View style={styles.hotFooter}>
                <Text style={styles.hotTime}>{post.createdAt}</Text>
                <View style={styles.interactionRow}>
                  <Text style={styles.interactionText}>❤️ {post.likes}</Text>
                  <Text style={styles.interactionText}>💬 {post.commentCount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeCard: {
    backgroundColor: '#dc2626',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    fontSize: 11,
    fontWeight: '700',
  },
  welcomeDate: {
    color: '#fee2e2',
    fontSize: 11,
    fontWeight: '600',
  },
  welcomeTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  suneungMidRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 2,
    marginBottom: 4,
  },
  suneungBadgeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  welcomeSub: {
    color: '#fecaca',
    fontSize: 12,
    marginBottom: 14,
    fontWeight: '600',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionBadge: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  seeMoreText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '700',
  },
  dDayScroll: {
    flexDirection: 'row',
    flexGrow: 0,
    marginBottom: 20,
  },
  dDayCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 125,
  },
  dDayName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  dDayCount: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  dDayTarget: {
    fontSize: 10,
    color: '#94a3b8',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'column',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  subDateText: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
  },
  calText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  shortText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  mealTypeChip: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  mealTypeChipActive: {
    backgroundColor: '#dc2626',
  },
  mealTypeChipDisabled: {
    opacity: 0.4,
  },
  mealTypeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  mealTypeChipTextActive: {
    color: '#ffffff',
  },
  mealLoading: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mealLoadingText: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
  mealMenuWrap: {
    gap: 3,
    marginBottom: 10,
    minHeight: 100,
  },
  menuItem: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingVertical: 6,
    borderRadius: 8,
  },
  voteButtonActive: {
    backgroundColor: '#dc2626',
  },
  voteButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  voteButtonTextActive: {
    color: '#ffffff',
  },
  // 실시간 수강 과목 안내 배너
  liveClassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  liveClassBannerActive: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  liveClassBannerIdle: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4f46e5',
  },
  liveClassBannerText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    color: '#3730a3',
    lineHeight: 14,
  },
  timetableWrap: {
    gap: 4,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  periodLeft: {
    flex: 1,
  },
  timeItem: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  periodClockText: {
    fontSize: 9,
    color: '#94a3b8',
  },
  currentTimeBadge: {
    backgroundColor: '#eef2ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4f46e5',
  },
  takingNowBadge: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  currentTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5',
  },
  statusPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  statusPillTaking: {
    backgroundColor: '#dc2626',
  },
  statusPillNext: {
    backgroundColor: '#4f46e5',
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
  },
  hotList: {
    gap: 10,
  },
  hotCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  hotBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  hotSchool: {
    fontSize: 11,
    color: '#94a3b8',
  },
  hotTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  hotSnippet: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 8,
  },
  hotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hotTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  interactionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  interactionText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
