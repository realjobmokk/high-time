// 1번 탭: 종합 [홈] 메인 대시보드 화면 (Figma v2.0 에디토리얼 디자인 적용)
// - 선택한 고등학교의 나이스(NEIS) 실시간 급식표 및 학사일정 연동
// - 현재 시각 기준 실시간 수강 중인 과목 자동 계산 및 시간표 표시
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
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
import { TimetableModal } from '../../modals/TimetableModal';
import { ScheduleCalendarModal } from '../../modals/ScheduleCalendarModal';
import { COLORS } from '../../theme/colors';

interface HomeTabProps {
  currentUser: CurrentUser;
  currentSchool: School;
  hotPosts: MajorPost[];
  customTimetable: CustomTimetableBlock[];
  onAddOrUpdateTimetableBlock: (block: CustomTimetableBlock) => void;
  onDeleteTimetableBlock: (blockId: string) => void;
  onNavigateTab: (tab: 'board' | 'major' | 'school' | 'home' | 'counseling' | 'chat' | 'profile') => void;
  onOpenWriteModal: (targetBoard: 'major' | 'school') => void;
  onSelectPost: (post: MajorPost) => void;
  onOpenAskModal: () => void;
  onOpenAdmissionConsult?: () => void;
}

const FULL_WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

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
}) => {
  const [mealInfo, setMealInfo] = useState<MealInfo | null>(null);
  const [isMealLoading, setIsMealLoading] = useState(false);
  const [mealVoteCount, setMealVoteCount] = useState(12);
  const [hasVotedMeal, setHasVotedMeal] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // 나이스 학사일정 상태
  const [dDayList, setDDayList] = useState<DDayItem[]>(INITIAL_DDAY_LIST);

  // 현재 시각 상태 (30초마다 갱신)
  const [nowTime, setNowTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 실시간 교육부 나이스(NEIS) 오픈 API 호출
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

  // 날짜 및 요일 포맷
  const fullDateLabel = `${nowTime.getMonth() + 1}월 ${nowTime.getDate()}일 ${FULL_WEEKDAYS[nowTime.getDay()]}`;
  const todayWeekdayLabel = FULL_WEEKDAYS[nowTime.getDay()];

  // 오늘 요일('월'~'금') 계산 및 시간표 정렬
  const dayNames: Record<number, WeekdayKey> = {
    1: '월',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
  };
  const dayOrder: Record<WeekdayKey, number> = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
  const todayDayKey: WeekdayKey = dayNames[nowTime.getDay()] || '월';
  const isWeekend = nowTime.getDay() === 0 || nowTime.getDay() === 6;

  const todayBlocks = [...customTimetable]
    .filter((b) => !isWeekend && b.day === todayDayKey)
    .sort((a, b) => a.startHour - b.startHour);

  const allSortedBlocks = [...customTimetable].sort(
    (a, b) => dayOrder[a.day] - dayOrder[b.day] || a.startHour - b.startHour
  );
  const displayedBlocks = todayBlocks.length > 0 ? todayBlocks : allSortedBlocks;

  const currentHourFloat = nowTime.getHours() + nowTime.getMinutes() / 60;
  const activeBlock = todayBlocks.find(
    (b) =>
      currentHourFloat >= b.startHour &&
      currentHourFloat <= Math.max(b.startHour, b.endHour - 1) + 50 / 60
  );
  const nextBlock = todayBlocks.find((b) => b.startHour > currentHourFloat);

  const classStatusHeadline = isWeekend
    ? '오늘은 수업이 없어요'
    : activeBlock
      ? `지금은 ${activeBlock.subject} 수업 중`
      : nextBlock
        ? `다음 수업은 ${nextBlock.subject}예요`
        : todayBlocks.length > 0
          ? '오늘 수업이 모두 끝났어요'
          : '오늘 등록된 수업이 없어요';

  // 수능 D-Day 자동 계산
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
      setMealVoteCount((prev) => Math.max(0, prev - 1));
      setHasVotedMeal(false);
    } else {
      setMealVoteCount((prev) => prev + 1);
      setHasVotedMeal(true);
    }
  };

  // 급식 메뉴 2개씩 묶어서 깔끔하게 표시
  const mealLines: string[] = [];
  const menuNames = displayMenu.slice(0, 6).map((m) => m.name);
  for (let i = 0; i < menuNames.length; i += 2) {
    const pair = menuNames.slice(i, i + 2);
    mealLines.push(pair.join('  ·  '));
  }

  const displayName = (currentUser.name || currentUser.nickname || '학생').trim();
  const shortSchoolName = currentSchool.name.replace('고등학교', '고');
  const topHotPost = hotPosts[0] || null;
  const visibleSchedules = dDayList.slice(0, 2);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. 오늘의 인사 */}
      <View style={styles.greetingSection}>
        <Text style={styles.dateText}>{fullDateLabel}</Text>
        <View style={styles.greetingRow}>
          <TouchableOpacity
            style={styles.greetingUserWrap}
            onPress={() => onNavigateTab('profile')}
            activeOpacity={0.75}
          >
            {currentUser.profileImage ? (
              <Image
                source={{ uri: currentUser.profileImage }}
                style={styles.homeAvatarImg}
              />
            ) : (
              <View style={styles.homeAvatarPlaceholder}>
                <Text style={styles.homeAvatarInitial}>
                  {displayName.slice(0, 1)}
                </Text>
              </View>
            )}
            <Text style={styles.greetingTitle} numberOfLines={1}>
              <Text style={styles.greetingNameHighlight}>{displayName}</Text>님, 반가워요.
            </Text>
          </TouchableOpacity>
          <View style={styles.suneungBadge}>
            <Text style={styles.suneungBadgeText}>{suneungDDayLabel}</Text>
          </View>
        </View>
        <Text style={styles.greetingSub}>
          학교생활부터 진로 고민까지, 여기서 함께해요.
        </Text>
      </View>

      {/* 2. 오늘의 학교생활 (세이지 그린 카드 + 오늘의 급식 내부 카드) */}
      <View style={styles.schoolLifeCard}>
        <View style={styles.schoolLifeHeader}>
          <View style={styles.schoolLifeStatusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    !isWeekend && (activeBlock || nextBlock) ? COLORS.accent : COLORS.success,
                },
              ]}
            />
            <Text style={styles.schoolLifeTitle} numberOfLines={1}>
              {!isWeekend && activeBlock ? (
                <>
                  지금은 <Text style={styles.activeSubjectHighlight}>{activeBlock.subject}</Text> 수업 중
                </>
              ) : !isWeekend && nextBlock ? (
                <>
                  다음 수업은 <Text style={styles.activeSubjectHighlight}>{nextBlock.subject}</Text>예요
                </>
              ) : (
                classStatusHeadline
              )}
            </Text>
          </View>
          <View style={styles.weekdayChip}>
            <Text style={styles.schoolLifeWeekday}>{todayWeekdayLabel}</Text>
          </View>
        </View>

        <View style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealTitle}>오늘의 급식</Text>
            <View style={styles.mealMetaRow}>
              <Text style={styles.mealMeta}>{shortSchoolName} 중식</Text>
              {displayCalorie !== '-' && (
                <View style={styles.calorieChip}>
                  <Text style={styles.calorieChipText}>{displayCalorie}</Text>
                </View>
              )}
            </View>
          </View>

          {isMealLoading ? (
            <View style={styles.mealLoading}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : mealLines.length > 0 ? (
            <View style={styles.mealMenuBox}>
              {mealLines.map((line, idx) => (
                <Text key={idx} style={styles.mealMenuLine}>
                  {line}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.mealEmptyText}>
              오늘은 등록된 급식 식단이 없습니다.
            </Text>
          )}

          <View style={styles.mealFooterRow}>
            <TouchableOpacity
              style={[styles.mealVotePill, hasVotedMeal && styles.mealVotePillActive]}
              onPress={handleVoteMeal}
              activeOpacity={0.75}
            >
              <Text
                style={[styles.mealVoteHeart, hasVotedMeal && styles.mealVoteHeartActive]}
              >
                {hasVotedMeal ? '♥  대존맛' : '♡  대존맛'}
              </Text>
              <Text
                style={[styles.mealVoteCount, hasVotedMeal && styles.mealVoteCountActive]}
              >
                {mealVoteCount}표
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. 내 시간표 */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <View style={styles.timetableTitleRow}>
            <Text style={styles.sectionTitle}>내 시간표</Text>
            <View style={styles.timetableDayBadge}>
              <Text style={styles.timetableDayBadgeText}>
                {todayBlocks.length > 0 ? `오늘 (${todayDayKey})` : `총 ${displayedBlocks.length}과목`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.timetableEditPill}
            onPress={() => setIsTimetableModalOpen(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.timetableEditPillText}>시간표 편집 ›</Text>
          </TouchableOpacity>
        </View>

        {displayedBlocks.length > 0 ? (
          <View style={styles.timetableCardWrap}>
            {displayedBlocks.map((block, index) => {
              const isCurrent = activeBlock?.id === block.id;
              const isLast = index === displayedBlocks.length - 1;
              return (
                <TouchableOpacity
                  key={block.id}
                  style={[
                    styles.timetableRow,
                    !isLast && styles.timetableRowBorder,
                    isCurrent && styles.timetableRowActive,
                  ]}
                  onPress={() => setIsTimetableModalOpen(true)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.timetableColorBar,
                      { backgroundColor: block.color || COLORS.accent },
                    ]}
                  />
                  <View style={styles.timetableTimeCol}>
                    <Text style={styles.timetableTimeText}>
                      {Math.max(1, block.startHour - 8)}교시
                    </Text>
                    <Text style={styles.timetableDaySub}>{block.day}요일</Text>
                  </View>
                  <View style={styles.timetableSubjectCol}>
                    <View style={styles.timetableSubjectRow}>
                      <Text style={styles.timetableSubject} numberOfLines={1}>
                        {block.subject}
                      </Text>
                      {isCurrent && (
                        <View style={styles.liveClassBadge}>
                          <Text style={styles.liveClassBadgeText}>수업 중</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.timetableDuration}>
                      {Math.max(1, block.startHour - 8)}교시 ·{' '}
                      {String(block.startHour).padStart(2, '0')}:00 ~{' '}
                      {String(Math.max(block.startHour, block.endHour - 1)).padStart(2, '0')}:50
                    </Text>
                  </View>
                  <View style={styles.timetableRoomPill}>
                    <Text style={styles.timetableRoomText} numberOfLines={1}>
                      {block.room || '교실 미정'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyTimetableCard}
            onPress={() => setIsTimetableModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.emptyTimetableLeft}>
              <Text style={styles.emptyTimetableTitle}>아직 등록된 수업이 없어요</Text>
              <Text style={styles.emptyTimetableText}>
                시간표 편집에서 내 과목과 교실 위치를 추가해 보세요.
              </Text>
            </View>
            <View style={styles.emptyTimetableCta}>
              <Text style={styles.emptyTimetableCtaText}>+ 추가</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      {/* 4. 다가오는 일정 */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>다가오는 일정</Text>
          <TouchableOpacity
            onPress={() => setIsCalendarModalOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionAction}>달력 보기  ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleGrid}>
          {visibleSchedules.map((item, idx) => {
            const isPrimary = idx === 0;
            return (
              <TouchableOpacity
                key={`${item.title}-${item.targetDate}-${idx}`}
                style={[styles.scheduleCard, isPrimary && styles.scheduleCardPrimary]}
                onPress={() => setIsCalendarModalOpen(true)}
                activeOpacity={0.75}
              >
                <View style={styles.scheduleTopRow}>
                  <Text style={[styles.scheduleDday, isPrimary && styles.scheduleDdayPrimary]}>
                    {item.dDay}
                  </Text>
                  <Text style={styles.scheduleDateText}>{item.targetDate}</Text>
                </View>
                <Text style={styles.scheduleTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 5. 지금, 친구들의 이야기 + 빠른 글쓰기 */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>지금, 친구들의 이야기</Text>
          <TouchableOpacity
            style={styles.timetableEditPill}
            onPress={() => onNavigateTab('board')}
            activeOpacity={0.7}
          >
            <Text style={styles.timetableEditPillText}>전체보기 ›</Text>
          </TouchableOpacity>
        </View>

        {topHotPost ? (
          <TouchableOpacity
            style={styles.hotPostCard}
            onPress={() => onSelectPost(topHotPost)}
            activeOpacity={0.75}
          >
            <View style={styles.hotPostBadgeRow}>
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>실시간 인기</Text>
              </View>
              <Text style={styles.hotPostCategory}>{topHotPost.majorName}</Text>
            </View>
            <Text style={styles.hotPostTitle} numberOfLines={2}>
              {topHotPost.title}
            </Text>
            <Text style={styles.hotPostMeta}>
              좋아요 {topHotPost.likes}  ·  댓글 {topHotPost.commentCount}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.hotPostCard}>
            <Text style={styles.hotPostEmpty}>
              아직 등록된 인기 글이 없습니다. 첫 이야기를 남겨보세요!
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.quickWriteBtn}
          onPress={() => onOpenWriteModal('major')}
          activeOpacity={0.85}
        >
          <Text style={styles.quickWriteBtnText}>빠른 글쓰기</Text>
        </TouchableOpacity>
      </View>

      {/* 시간표 편집 모달 */}
      <TimetableModal
        visible={isTimetableModalOpen}
        blocks={customTimetable}
        onClose={() => setIsTimetableModalOpen(false)}
        onAddOrUpdateBlock={onAddOrUpdateTimetableBlock}
        onDeleteBlock={onDeleteTimetableBlock}
      />

      {/* 학사일정 달력 모달 */}
      <ScheduleCalendarModal
        visible={isCalendarModalOpen}
        currentUser={currentUser}
        currentSchool={currentSchool}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 24,
  },

  // 1. 인사 영역
  greetingSection: {
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.24,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  greetingUserWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  homeAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  homeAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.avatarGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeAvatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  greetingTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.44,
  },
  greetingNameHighlight: {
    color: COLORS.accent,
  },
  suneungBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  suneungBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: -0.22,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.muted,
    letterSpacing: -0.26,
  },

  // 2. 오늘의 학교생활
  schoolLifeCard: {
    backgroundColor: COLORS.sageSurface,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  schoolLifeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  schoolLifeStatusRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  schoolLifeTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  activeSubjectHighlight: {
    color: COLORS.accent,
    fontWeight: '900',
  },
  weekdayChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  schoolLifeWeekday: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.muted,
    letterSpacing: -0.22,
  },
  mealCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 15,
    gap: 8,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.28,
  },
  mealMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.22,
  },
  calorieChip: {
    backgroundColor: COLORS.sageCard,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  calorieChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.ink,
  },
  mealLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  mealMenuBox: {
    gap: 3,
    paddingVertical: 2,
  },
  mealMenuLine: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
    lineHeight: 23,
    letterSpacing: -0.3,
  },
  mealEmptyText: {
    fontSize: 13,
    color: COLORS.muted,
    paddingVertical: 4,
  },
  mealFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  mealVotePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mealVotePillActive: {
    backgroundColor: COLORS.accent,
  },
  mealVoteHeart: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  mealVoteHeartActive: {
    color: '#ffffff',
  },
  mealVoteCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  mealVoteCountActive: {
    color: '#ffffff',
  },

  // 공통 섹션 블록
  sectionBlock: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.24,
  },

  // 3. 내 시간표
  timetableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timetableDayBadge: {
    backgroundColor: COLORS.sageCard,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timetableDayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  timetableEditPill: {
    backgroundColor: COLORS.sageButton,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timetableEditPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.ink,
  },
  timetableCardWrap: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  timetableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  timetableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timetableRowActive: {
    backgroundColor: COLORS.accentSoft,
  },
  timetableColorBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  timetableTimeCol: {
    width: 48,
    gap: 1,
  },
  timetableTimeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.ink,
  },
  timetableDaySub: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.muted,
  },
  timetableSubjectCol: {
    flex: 1,
    gap: 2,
  },
  timetableSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timetableSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.3,
  },
  liveClassBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveClassBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  timetableDuration: {
    fontSize: 11,
    color: COLORS.muted,
  },
  timetableRoomPill: {
    backgroundColor: COLORS.sageCard,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },
  timetableRoomText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
  },
  emptyTimetableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  emptyTimetableLeft: {
    flex: 1,
    gap: 3,
  },
  emptyTimetableTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
  },
  emptyTimetableText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  emptyTimetableCta: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyTimetableCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // 4. 다가오는 일정
  scheduleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 15,
    gap: 6,
  },
  scheduleCardPrimary: {
    backgroundColor: COLORS.accentSoft,
    borderColor: '#edd2c5',
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  scheduleDday: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.32,
  },
  scheduleDdayPrimary: {
    color: COLORS.accent,
  },
  scheduleDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.muted,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.28,
  },

  // 5. 지금, 친구들의 이야기
  hotPostCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  hotPostBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hotBadge: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  hotBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  hotPostCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  hotPostTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  hotPostMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.22,
  },
  hotPostEmpty: {
    fontSize: 13,
    color: COLORS.muted,
  },
  quickWriteBtn: {
    backgroundColor: COLORS.ink,
    borderRadius: 9,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  quickWriteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.26,
  },
});
