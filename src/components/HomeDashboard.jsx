import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Clock,
  CalendarDays,
  Flame,
  ChevronLeft,
  ChevronRight,
  School,
  HelpCircle,
  PenSquare,
  GraduationCap,
  Heart,
  ShieldCheck,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { INITIAL_SCHOOL_LIFE } from '../data/mockData';
import {
  fetchNeisMealInfo,
  fetchNeisSchedule,
  fetchNeisMonthSchedule
} from '../services/neisService';

const DAYS = ['월', '화', '수', '목', '금'];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const BLOCK_COLORS = [
  '#a3c96c', '#8b78cd', '#63b0a3', '#d27365', '#6c8cc7', '#61a877', '#cca958', '#d88c51'
];

// 홈(Home) 종합 대시보드 컴포넌트
export default function HomeDashboard({
  currentUser,
  currentSchool,
  majorPosts,
  schoolPosts,
  onSelectPost,
  onNavigateTab,
  onOpenWriteModal
}) {
  const [mealInfo, setMealInfo] = useState(null);
  const [isMealLoading, setIsMealLoading] = useState(false);

  // 로그인한 사용자별 고유 시간표 키 생성 (사용자마다 개별 저장)
  const userTimetableKey = `hightime_user_timetable_${encodeURIComponent(
    currentSchool?.name || '대현고등학교'
  )}_${encodeURIComponent(currentUser?.name || '서정윤')}`;

  // 사용자가 직접 추가/편집하는 주간 시간표 상태 (로그인한 사용자별로 분리)
  const [customTimetable, setCustomTimetable] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(userTimetableKey);
      setCustomTimetable(saved ? JSON.parse(saved) : []);
    } catch {
      setCustomTimetable([]);
    }
  }, [userTimetableKey]);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedDay, setSelectedDay] = useState('월');
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(10);
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(BLOCK_COLORS[0]);

  const [dDayList, setDDayList] = useState(INITIAL_SCHOOL_LIFE.dDayList);
  const [nowTime, setNowTime] = useState(() => new Date());

  // 학사일정 달력 모달 상태
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
  const [calSelectedDay, setCalSelectedDay] = useState(() => new Date().getDate());
  const [calItems, setCalItems] = useState([]);
  const [isCalLoading, setIsCalLoading] = useState(false);
  const [customCalEvents, setCustomCalEvents] = useState([]);
  const [isCalDaySheetOpen, setIsCalDaySheetOpen] = useState(false);
  const [isCalFormOpen, setIsCalFormOpen] = useState(false);
  const [newCalEventTitle, setNewCalEventTitle] = useState('');
  const [newCalCategory, setNewCalCategory] = useState('개인');
  const [newCalAllDay, setNewCalAllDay] = useState(true);
  const [newCalStartTime, setNewCalStartTime] = useState('16:00');
  const [newCalEndTime, setNewCalEndTime] = useState('17:00');
  const [newCalLocation, setNewCalLocation] = useState('');
  const [newCalMemo, setNewCalMemo] = useState('');

  const calStorageKey = `hightime_custom_calendar_events_${encodeURIComponent(
    currentUser?.username || `${currentSchool?.name || ''}_${currentUser?.name || ''}`
  )}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(calStorageKey);
      setCustomCalEvents(raw ? JSON.parse(raw) : []);
    } catch {
      setCustomCalEvents([]);
    }
  }, [calStorageKey, isCalendarOpen]);

  const saveCustomCalEvents = (next) => {
    setCustomCalEvents(next);
    try {
      localStorage.setItem(calStorageKey, JSON.stringify(next));
    } catch { }
  };

  useEffect(() => {
    if (!isCalendarOpen || !currentSchool?.name) return;
    let cancelled = false;
    const loadCal = async () => {
      setIsCalLoading(true);
      const data = await fetchNeisMonthSchedule(currentSchool, calYear, calMonth);
      if (!cancelled) {
        setCalItems(data);
        setIsCalLoading(false);
      }
    };
    loadCal();
    return () => {
      cancelled = true;
    };
  }, [isCalendarOpen, currentSchool, calYear, calMonth]);

  // 30초마다 현재 시각 갱신 (실시간 수강 과목 자동 매칭용)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 교육부 나이스(NEIS) 실시간 급식 + 학사일정 D-Day 조회
  useEffect(() => {
    let isMounted = true;
    const loadNeisAll = async () => {
      setIsMealLoading(true);
      const [mealRes, schedRes] = await Promise.all([
        fetchNeisMealInfo(currentSchool),
        fetchNeisSchedule(currentSchool)
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

  // 오늘 요일 및 직접 작성한 시간표 기준 현재 수강 상태 계산
  const dayMap = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금' };
  const dayOrder = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
  const todayDayKey = dayMap[nowTime.getDay()] || '월';
  const todayBlocks = [...customTimetable]
    .filter((b) => b.day === todayDayKey)
    .sort((a, b) => a.startHour - b.startHour);
  const allSortedBlocks = [...customTimetable].sort(
    (a, b) => (dayOrder[a.day] || 1) - (dayOrder[b.day] || 1) || a.startHour - b.startHour
  );
  const displayedBlocks = todayBlocks.length > 0 ? todayBlocks : allSortedBlocks;

  const currentHourFloat = nowTime.getHours() + nowTime.getMinutes() / 60;
  const currentTimeStr = `${String(nowTime.getHours()).padStart(2, '0')}:${String(
    nowTime.getMinutes()
  ).padStart(2, '0')}`;

  const activeBlock = todayBlocks.find(
    (b) => currentHourFloat >= b.startHour && currentHourFloat < b.endHour
  );
  const nextBlock = todayBlocks.find((b) => b.startHour > currentHourFloat);

  const bannerText = activeBlock
    ? `현재 ${currentTimeStr} · [${activeBlock.subject}] 수강 중 (${activeBlock.startHour}:00~${activeBlock.endHour}:00)`
    : nextBlock
      ? `현재 ${currentTimeStr} · 다음 수업 [${nextBlock.subject}] (${nextBlock.startHour}:00 시작)`
      : todayBlocks.length > 0
        ? `현재 ${currentTimeStr} · 오늘(${todayDayKey}) 등록된 수업 종료`
        : customTimetable.length > 0
          ? `현재 ${currentTimeStr} · 오늘(${todayDayKey}요일) 수업 없음 (총 ${customTimetable.length}개 등록됨)`
          : `현재 ${currentTimeStr} · [오늘 시간표]에서 직접 내 시간표를 추가해 보세요!`;

  const handleOpenAddForm = (day = '월', hour = 9) => {
    setEditingId(null);
    setSelectedDay(day);
    setStartHour(hour);
    setEndHour(Math.min(hour + 1, 20));
    setSubject('');
    setRoom('');
    setColor(BLOCK_COLORS[customTimetable.length % BLOCK_COLORS.length]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (block) => {
    setEditingId(block.id);
    setSelectedDay(block.day);
    setStartHour(block.startHour);
    setEndHour(block.endHour);
    setSubject(block.subject);
    setRoom(block.room || '');
    setColor(block.color);
    setIsFormOpen(true);
  };

  const handleSaveBlock = (e) => {
    e.preventDefault();
    if (!subject.trim() || endHour <= startHour) return;
    const newBlock = {
      id: editingId || `tt-${Date.now()}`,
      day: selectedDay,
      subject: subject.trim(),
      room: room.trim(),
      startHour: Number(startHour),
      endHour: Number(endHour),
      color
    };
    const next = editingId
      ? customTimetable.map((b) => (b.id === editingId ? newBlock : b))
      : [...customTimetable, newBlock];
    setCustomTimetable(next);
    localStorage.setItem(userTimetableKey, JSON.stringify(next));
    setIsFormOpen(false);
  };

  const handleDeleteBlock = () => {
    if (!editingId) return;
    const next = customTimetable.filter((b) => b.id !== editingId);
    setCustomTimetable(next);
    localStorage.setItem(userTimetableKey, JSON.stringify(next));
    setIsFormOpen(false);
  };

  // 인기 전공 게시글 (좋아요 많은 순 2개)
  const hotMajorPosts = [...majorPosts].sort((a, b) => b.likes - a.likes).slice(0, 2);

  // 우리 학교 최신 인기글 2개
  const hotSchoolPosts = [...schoolPosts].slice(0, 2);

  return (
    <div className="pb-24 pt-2 px-4 space-y-3.5">
      {/* 1. 상단 환영 및 내 학교 카드 */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-md shadow-red-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{currentSchool.name} 정식 재학생</span>
          </div>
          <span className="text-[10px] text-red-100 font-semibold">
            현재 시각 {currentTimeStr} ({todayDayKey}요일)
          </span>
        </div>

        <h2 className="text-base font-black tracking-tight leading-snug truncate">
          {currentUser?.name || '서정윤'} 학생, 오늘도 열공하세요! 🔥
        </h2>
        <div className="flex justify-start my-1">
          <span className="text-[15px] font-black text-white whitespace-nowrap">
            🎓 {(() => {
              const getSuneungDate = (y) => {
                const nov1 = new Date(y, 10, 1);
                const firstThu = (4 - nov1.getDay() + 7) % 7;
                return new Date(y, 10, 1 + firstThu + 14);
              };
              const today = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate());
              let diff = Math.round((getSuneungDate(today.getFullYear()).getTime() - today.getTime()) / 86400000);
              if (diff < 0) {
                diff = Math.round((getSuneungDate(today.getFullYear() + 1).getTime() - today.getTime()) / 86400000);
              }
              return diff === 0 ? '수능 D-DAY' : `수능 D-${diff}`;
            })()}
          </span>
        </div>
        <p className="text-xs text-red-100 mt-0.5 font-medium">
          {bannerText}
        </p>

        {/* 상단 퀵 액션 버튼 3종 */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/20">
          <button
            onClick={onOpenWriteModal}
            className="flex items-center justify-center gap-1 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>글쓰기</span>
          </button>
          <button
            onClick={() => onNavigateTab('counseling', 'direct')}
            className="flex items-center justify-center gap-1 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>1:1 질문</span>
          </button>
          <button
            onClick={() => onNavigateTab('counseling', 'admission')}
            className="flex items-center justify-center gap-1 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>입시상담</span>
          </button>
        </div>
      </div>

      {/* 2. D-Day 시험 및 학사 일정 (나이스 API 연동 남은 일수 자동 계산) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-red-500" />
            {currentSchool.name} 학사일정 D-day
          </span>
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-[11px] font-extrabold transition"
          >
            <CalendarDays className="w-3 h-3" />
            <span>달력 보기</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {dDayList.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs min-w-[135px] shrink-0 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
                  {item.title}
                </span>
                <span className={`text-[10px] font-black text-white px-1.5 py-0.2 rounded-md ${item.badgeColor}`}>
                  {item.dDay}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">{item.title}</div>
              <span className="text-[9px] text-slate-400 mt-0.5">{item.targetDate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 급식 & 시간표 위젯 (2단 그리드 카드) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* 나이스 실시간 급식 위젯 카드 */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100 mb-1.5">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 whitespace-nowrap">
                <UtensilsCrossed className="w-3 h-3 text-red-500 shrink-0" />
                오늘의 급식
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md whitespace-nowrap shrink-0">
                {displayCalorie}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold mb-2 leading-tight">
              <div className="truncate">{currentSchool.name}</div>
              <div>{mealInfo?.date || '오늘의 중식'}</div>
            </div>

            {isMealLoading ? (
              <div className="py-6 text-center text-[11px] text-slate-400">
                NEIS 식단표 수신 중...
              </div>
            ) : displayMenu.length > 0 ? (
              <ul className="text-xs text-slate-700 space-y-1">
                {displayMenu.map((m, i) => (
                  <li key={i} className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="truncate font-medium">{m.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex items-center justify-center py-6 text-center text-[11px] text-slate-400">
                {mealInfo?.message || '등록된 급식 정보가 없습니다.'}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>NEIS 실시간</span>
            <span className="text-rose-500 flex items-center gap-0.5">
              <Heart className="w-3 h-3 fill-rose-500" />
              급식 공감
            </span>
          </div>
        </div>

        {/* 오늘 시간표 위젯 카드 (내가 직접 작성하는 주간 시간표 연동) */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100 mb-1.5">
              <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                <span>오늘 시간표</span>
              </span>
              <button
                onClick={() => setIsTimetableModalOpen(true)}
                title="시간표 편집"
                className="w-6 h-6 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 오늘 시간표가 등록되어 있을 때만 실시간 수강 과목 안내 배너 표시 */}
            {todayBlocks.length > 0 && (
              <div
                onClick={() => setIsTimetableModalOpen(true)}
                className={`px-2 py-1.5 rounded-xl text-[10px] font-bold mb-2 border cursor-pointer ${activeBlock
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
              >
                {activeBlock
                  ? `🔴 [${activeBlock.subject}] 수강중 (${String(activeBlock.startHour).padStart(2, '0')}:00 ~ ${String(activeBlock.startHour).padStart(2, '0')}:50)`
                  : nextBlock
                    ? `⏳ 다음 수업 [${nextBlock.subject}] (${String(nextBlock.startHour).padStart(2, '0')}:00 시작)`
                    : `✅ 오늘(${todayDayKey}) 등록된 수업 종료`}
              </div>
            )}

            <div className="flex flex-col flex-1 space-y-1 text-xs">
              {customTimetable.length === 0 ? (
                <button
                  onClick={() => setIsTimetableModalOpen(true)}
                  className="w-full flex-1 min-h-[140px] border border-dashed border-slate-300 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition flex items-center justify-center"
                >
                  + 내 시간표 직접 작성하기
                </button>
              ) : (
                displayedBlocks.map((block) => {
                  const isTakingNow = activeBlock?.id === block.id;
                  const isNext = !activeBlock && nextBlock?.id === block.id;
                  return (
                    <div
                      key={block.id}
                      onClick={() => setIsTimetableModalOpen(true)}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer ${isTakingNow
                        ? 'bg-red-50 text-red-600 font-bold border border-red-200'
                        : isNext
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                          : 'text-slate-600 bg-slate-50/70'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-1.5 h-5 rounded-full shrink-0"
                          style={{ backgroundColor: block.color }}
                        />
                        <div className="truncate">
                          <div className="truncate">{block.subject}</div>
                          <div className="text-[9px] text-slate-400 font-normal">
                            {String(block.startHour).padStart(2, '0')}:00 ~ {String(block.startHour).padStart(2, '0')}:50
                            {block.room ? ` · ${block.room}` : ''}
                          </div>
                        </div>
                      </div>
                      {(isTakingNow || isNext) && (
                        <span
                          className={`text-[9px] text-white px-1.5 py-0.5 rounded shrink-0 ml-1 ${isTakingNow ? 'bg-red-500' : 'bg-indigo-600'
                            }`}
                        >
                          {isTakingNow ? '수강중' : '다음'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HighTime 화이트 주간 시간표 그리드 모달 (오른쪽에서 왼쪽으로 슬라이드 인) */}
      {isTimetableModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-white text-slate-900 flex flex-col max-w-md mx-auto"
          style={{ animation: 'hightimeTimetableSlideIn 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
        >
          <style>{`@keyframes hightimeTimetableSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div>
              <div className="text-xs text-slate-500 font-semibold">2026년 2학기</div>
              <div className="text-xl font-black text-slate-900 flex items-center gap-1">
                <span>시간표</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAddForm('월', 9)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
                title="수업 추가"
              >
                <Plus className="w-6 h-6 text-slate-900" />
              </button>
              <button
                onClick={() => setIsTimetableModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 px-4 mb-2">
            우측 상단 [+] 버튼이나 빈 시간 칸을 눌러 직접 수업을 추가하세요.
          </p>

          <div className="flex-1 overflow-y-auto px-3 pb-8">
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#18181b]">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-[34px_1fr_1fr_1fr_1fr_1fr] border-b border-zinc-800 h-8 text-xs text-zinc-400 font-bold">
                <div className="border-r border-zinc-800" />
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="flex items-center justify-center border-r border-zinc-800 last:border-r-0"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 그리드 바디 */}
              <div className="grid grid-cols-[34px_1fr_1fr_1fr_1fr_1fr]">
                {/* 좌측 시간 축 */}
                <div className="border-r border-zinc-800">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="h-[52px] border-b border-zinc-800 text-[11px] text-zinc-500 text-right pr-1.5 pt-1"
                    >
                      {h > 12 ? h - 12 : h}
                    </div>
                  ))}
                </div>

                {/* 월~금 컬럼 */}
                {DAYS.map((day) => {
                  const dayBlocks = customTimetable.filter((b) => b.day === day);
                  return (
                    <div
                      key={day}
                      className="relative border-r border-zinc-800 last:border-r-0"
                    >
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          onClick={() => handleOpenAddForm(day, h)}
                          className="h-[52px] border-b border-zinc-800 hover:bg-zinc-800/40 cursor-pointer"
                        />
                      ))}

                      {dayBlocks.map((block) => {
                        const top = (block.startHour - 9) * 52;
                        const height = (block.endHour - block.startHour) * 52;
                        return (
                          <div
                            key={block.id}
                            onClick={() => handleOpenEditForm(block)}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              backgroundColor: block.color
                            }}
                            className="absolute left-0.5 right-0.5 rounded p-1.5 overflow-hidden cursor-pointer shadow-xs"
                          >
                            <div className="text-[11px] font-black text-white leading-tight">
                              {block.subject}
                            </div>
                            {block.room && (
                              <div className="text-[10px] text-white/85 font-semibold mt-0.5 truncate">
                                {block.room}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 수업 추가/수정 폼 모달 */}
          {isFormOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center">
              <form
                onSubmit={handleSaveBlock}
                className="w-full max-w-md bg-[#1e1e24] rounded-t-3xl p-5 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-white">
                    {editingId ? '수업 수정 / 삭제' : '새 수업 직접 추가'}
                  </h4>
                  <button type="button" onClick={() => setIsFormOpen(false)}>
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">과목명</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="예: 미적분학, 물리학, 화법과 작문"
                    className="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1">교실 위치 (선택)</label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="예: 2반, 3반"
                    className="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">요일</label>
                    <select
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold"
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}요일
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">시작 시각</label>
                    <select
                      value={startHour}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setStartHour(v);
                        if (endHour <= v) setEndHour(v + 1);
                      }}
                      className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}:00
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-300 font-bold block mb-1">종료 시각</label>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-bold"
                    >
                      {HOURS.filter((h) => h >= startHour).map((h) => (
                        <option key={h + 1} value={h + 1}>
                          {h + 1}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 font-bold block mb-1.5">블록 색상</label>
                  <div className="flex gap-2">
                    {BLOCK_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-white' : ''
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleDeleteBlock}
                      className="px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500 text-red-400 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-extrabold"
                  >
                    {editingId ? '수업 변경사항 저장' : '시간표에 추가하기'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. 실시간 전국 전공 핫게시물 */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs text-slate-900">전국 전공 라운지 실시간 HOT</h3>
          </div>
          <button
            onClick={() => onNavigateTab('major')}
            className="text-[11px] text-red-600 font-bold flex items-center gap-0.5 hover:underline"
          >
            더보기 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {hotMajorPosts.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              아직 등록된 게시글이 없습니다. 첫 번째 게시글을 작성해 보세요!
            </div>
          ) : (
            hotMajorPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer border border-slate-100"
              >
                <div className="flex items-center gap-1.5 text-[10px] mb-1">
                  <span className="font-bold text-red-600 bg-red-50 px-1.5 rounded">
                    {post.majorName}
                  </span>
                  <span className="text-slate-400">· {post.author.school} ({post.author.grade})</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 truncate mb-1">{post.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[200px] text-slate-500">{post.content}</span>
                  <span className="text-red-500 font-semibold shrink-0">공감 {post.likes}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. 우리 학교 교내 실시간 핫글 */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <School className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs text-slate-900">{currentSchool.name} 실시간 이야기</h3>
          </div>
          <button
            onClick={() => onNavigateTab('school')}
            className="text-[11px] text-red-600 font-bold flex items-center gap-0.5 hover:underline"
          >
            교내 게시판 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5">
          {hotSchoolPosts.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-400">
              아직 교내 게시판에 등록된 글이 없습니다.
            </div>
          ) : (
            hotSchoolPosts.map((sp) => (
              <div
                key={sp.id}
                onClick={() => onNavigateTab('school')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-1.5 rounded shrink-0">
                    {sp.category}
                  </span>
                  <span className="font-semibold text-slate-800 truncate">{sp.title}</span>
                </div>
                <span className="text-slate-400 text-[10px] shrink-0 ml-2">{sp.createdAt}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 나이스 학사일정 달력 모달 */}
      {isCalendarOpen && (() => {
        const firstWeekday = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstWeekday; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);

        const selectedDateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(calSelectedDay).padStart(2, '0')}`;
        const selectedEvents = calItems.filter((it) => it.day === calSelectedDay);
        const todayNow = new Date();

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-3">
            <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-black text-slate-900">{currentSchool.name} 학사일정 달력</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarOpen(false);
                    setIsCalDaySheetOpen(false);
                    setIsCalFormOpen(false);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-3">
                {/* 월 이동 */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCalSelectedDay(1);
                      if (calMonth === 1) {
                        setCalYear((y) => y - 1);
                        setCalMonth(12);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black text-slate-900">
                    {calYear}년 {calMonth}월
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCalSelectedDay(1);
                      if (calMonth === 12) {
                        setCalYear((y) => y + 1);
                        setCalMonth(1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 text-center text-[11px] font-bold pb-1 border-b border-slate-100">
                  {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                    <span
                      key={w}
                      className={idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-slate-500'}
                    >
                      {w}
                    </span>
                  ))}
                </div>

                {/* 달력 그리드 */}
                {isCalLoading ? (
                  <div className="py-10 text-center text-xs text-slate-400 font-semibold">
                    나이스 학사일정을 불러오는 중...
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, idx) => {
                      if (day === null) return <div key={`e-${idx}`} className="h-12" />;
                      const monthPrefix = `${calYear}-${String(calMonth).padStart(2, '0')}-`;
                      const neisDayEvents = calItems.filter((it) => it.day === day);
                      const customDayEvents = customCalEvents.filter(
                        (ev) => ev.date.startsWith(monthPrefix) && ev.day === day
                      );
                      const hasEvents = neisDayEvents.length > 0 || customDayEvents.length > 0;
                      const hasHoliday = neisDayEvents.some((it) => it.isHoliday);
                      const firstTitle = neisDayEvents[0]?.title || customDayEvents[0]?.title || '';
                      const isSelected = calSelectedDay === day;
                      const isToday =
                        calYear === todayNow.getFullYear() &&
                        calMonth === todayNow.getMonth() + 1 &&
                        day === todayNow.getDate();
                      const colIdx = idx % 7;

                      return (
                        <button
                          key={`d-${day}`}
                          type="button"
                          onClick={() => {
                            setCalSelectedDay(day);
                            setIsCalFormOpen(false);
                            setIsCalDaySheetOpen(true);
                          }}
                          className={`h-12 rounded-xl flex flex-col items-center justify-start pt-1 px-0.5 transition ${isSelected
                            ? 'bg-red-600 text-white'
                            : isToday
                              ? 'bg-red-50 border border-red-300'
                              : 'hover:bg-slate-50'
                            }`}
                        >
                          <span
                            className={`text-[11px] font-bold ${isSelected
                              ? 'text-white'
                              : colIdx === 0 || hasHoliday
                                ? 'text-red-600'
                                : colIdx === 6
                                  ? 'text-blue-600'
                                  : 'text-slate-800'
                              }`}
                          >
                            {day}
                          </span>
                          {hasEvents && (
                            <>
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {neisDayEvents.length > 0 && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : hasHoliday ? 'bg-red-600' : 'bg-indigo-600'
                                      }`}
                                  />
                                )}
                                {customDayEvents.length > 0 && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-emerald-600'
                                      }`}
                                  />
                                )}
                              </div>
                              <span
                                className={`text-[8px] truncate w-full text-center mt-0.5 ${isSelected ? 'text-red-100' : 'text-slate-500'
                                  }`}
                              >
                                {firstTitle}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 이번 달 전체 일정 + 날짜 클릭 시 하단 바텀 시트 */}
                {(() => {
                  const monthPrefix = `${calYear}-${String(calMonth).padStart(2, '0')}-`;
                  const monthCustomEvents = customCalEvents.filter((ev) =>
                    ev.date.startsWith(monthPrefix)
                  );
                  const selectedCustomEvents = monthCustomEvents.filter(
                    (ev) => ev.day === calSelectedDay
                  );
                  const calCategories = [
                    { label: '개인', color: '#15803d', badgeClass: 'bg-emerald-100 text-emerald-700' },
                    { label: '수행평가', color: '#dc2626', badgeClass: 'bg-red-100 text-red-600' },
                    { label: '시험', color: '#7c3aed', badgeClass: 'bg-purple-100 text-purple-700' },
                    { label: '동아리', color: '#2563eb', badgeClass: 'bg-blue-100 text-blue-700' }
                  ];
                  const handleAddCustomCal = (e) => {
                    e.preventDefault();
                    const trimmed = newCalEventTitle.trim();
                    if (!trimmed) return;
                    const newEv = {
                      id: `ce-${Date.now()}`,
                      date: selectedDateStr,
                      day: calSelectedDay,
                      title: trimmed,
                      category: newCalCategory,
                      isAllDay: newCalAllDay,
                      startTime: newCalAllDay ? undefined : newCalStartTime.trim() || '16:00',
                      endTime: newCalAllDay ? undefined : newCalEndTime.trim() || '17:00',
                      location: newCalLocation.trim() || undefined,
                      memo: newCalMemo.trim() || undefined
                    };
                    saveCustomCalEvents([...customCalEvents, newEv]);
                    setNewCalEventTitle('');
                    setNewCalCategory('개인');
                    setNewCalAllDay(true);
                    setNewCalStartTime('16:00');
                    setNewCalEndTime('17:00');
                    setNewCalLocation('');
                    setNewCalMemo('');
                    setIsCalFormOpen(false);
                  };
                  const handleDeleteCustomCal = (id) => {
                    saveCustomCalEvents(customCalEvents.filter((ev) => ev.id !== id));
                  };

                  return (
                    <>
                      {/* 이번 달 전체 일정 */}
                      <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-1.5">
                        <div className="text-xs font-extrabold text-slate-900">
                          🗓️ {calMonth}월 전체 일정 ({calItems.length + monthCustomEvents.length}건)
                        </div>
                        {calItems.length === 0 && monthCustomEvents.length === 0 ? (
                          <p className="text-[11px] text-slate-400">이번 달 등록된 일정이 없습니다.</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {calItems.map((ev, i) => (
                              <button
                                key={`all-${ev.date}-${i}`}
                                type="button"
                                onClick={() => {
                                  setCalSelectedDay(ev.day);
                                  setIsCalFormOpen(false);
                                  setIsCalDaySheetOpen(true);
                                }}
                                className="w-full py-1.5 flex items-center gap-2 text-left text-xs hover:bg-slate-50 rounded"
                              >
                                <span className="text-[11px] font-extrabold text-red-600 w-11 shrink-0">
                                  {ev.date.slice(5)}
                                </span>
                                <span className="font-semibold text-slate-700 truncate">{ev.title}</span>
                              </button>
                            ))}
                            {monthCustomEvents.map((ev) => (
                              <button
                                key={`all-c-${ev.id}`}
                                type="button"
                                onClick={() => {
                                  setCalSelectedDay(ev.day);
                                  setIsCalFormOpen(false);
                                  setIsCalDaySheetOpen(true);
                                }}
                                className="w-full py-1.5 flex items-center gap-2 text-left text-xs hover:bg-slate-50 rounded"
                              >
                                <span className="text-[11px] font-extrabold text-emerald-600 w-11 shrink-0">
                                  {ev.date.slice(5)}
                                </span>
                                <span className="font-semibold text-slate-700 truncate">
                                  {ev.title} ({ev.category || '내 일정'})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 날짜 클릭 시 아래에서 뜨는 바텀 시트 */}
                      {isCalDaySheetOpen && (
                        <div className="absolute inset-0 z-20 bg-black/35 flex flex-col justify-end">
                          <div
                            className="flex-1"
                            onClick={() => {
                              setIsCalDaySheetOpen(false);
                              setIsCalFormOpen(false);
                            }}
                          />
                          <div
                            className="bg-white rounded-t-3xl p-4 shadow-2xl max-h-[75%] flex flex-col"
                            style={{ animation: 'hightimeSheetUp 0.22s ease-out forwards' }}
                          >
                            <style>{`@keyframes hightimeSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
                            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-2.5 shrink-0" />

                            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
                              <h4 className="text-sm font-black text-slate-900">
                                {isCalFormOpen
                                  ? `${calMonth}월 ${calSelectedDay}일 세부 일정 설정`
                                  : `📌 ${selectedDateStr} 일정`}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                {!isCalFormOpen && (
                                  <button
                                    type="button"
                                    onClick={() => setIsCalFormOpen(true)}
                                    className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition active:scale-95"
                                    title="세부 일정 추가"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isCalFormOpen) setIsCalFormOpen(false);
                                    else setIsCalDaySheetOpen(false);
                                  }}
                                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {isCalFormOpen ? (
                              <form onSubmit={handleAddCustomCal} className="mt-3 overflow-y-auto space-y-2.5 pr-0.5">
                                <div>
                                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                                    일정 제목 *
                                  </label>
                                  <input
                                    type="text"
                                    value={newCalEventTitle}
                                    onChange={(e) => setNewCalEventTitle(e.target.value)}
                                    placeholder="예: 생명과학 수행평가 발표"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                                    카테고리
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {calCategories.map((c) => (
                                      <button
                                        key={c.label}
                                        type="button"
                                        onClick={() => setNewCalCategory(c.label)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${newCalCategory === c.label
                                          ? `${c.badgeClass} border-current`
                                          : 'bg-slate-50 text-slate-500 border-slate-200'
                                          }`}
                                      >
                                        {c.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-extrabold text-slate-700">
                                      시간 설정
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setNewCalAllDay(!newCalAllDay)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${newCalAllDay
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                      {newCalAllDay ? '종일 ✓' : '시간 직접 입력'}
                                    </button>
                                  </div>
                                  {!newCalAllDay && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={newCalStartTime}
                                        onChange={(e) => setNewCalStartTime(e.target.value)}
                                        placeholder="16:00"
                                        className="flex-1 text-center text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                                      />
                                      <span className="text-xs font-bold text-slate-400">~</span>
                                      <input
                                        type="text"
                                        value={newCalEndTime}
                                        onChange={(e) => setNewCalEndTime(e.target.value)}
                                        placeholder="17:00"
                                        className="flex-1 text-center text-xs px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                                    장소 (선택)
                                  </label>
                                  <input
                                    type="text"
                                    value={newCalLocation}
                                    onChange={(e) => setNewCalLocation(e.target.value)}
                                    placeholder="예: 3층 과학실, 스터디카페"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                                    메모 (선택)
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={newCalMemo}
                                    onChange={(e) => setNewCalMemo(e.target.value)}
                                    placeholder="준비물이나 세부 내용을 적어두세요"
                                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                                  />
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsCalFormOpen(false)}
                                    className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold"
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={!newCalEventTitle.trim()}
                                    className="flex-[2] py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-black"
                                  >
                                    일정 저장하기
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <div className="mt-3 overflow-y-auto space-y-2">
                                {selectedEvents.length === 0 && selectedCustomEvents.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-slate-400">
                                    등록된 일정이 없습니다. 오른쪽 위 +를 눌러 추가해 보세요!
                                  </div>
                                ) : (
                                  <>
                                    {selectedEvents.map((ev, i) => (
                                      <div
                                        key={`${ev.date}-${i}`}
                                        className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-xs"
                                      >
                                        <span
                                          className={`w-1 self-stretch rounded-full ${ev.isHoliday ? 'bg-red-600' : 'bg-indigo-600'
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-slate-800">{ev.title}</p>
                                          <p className="text-[10px] text-slate-500 mt-0.5">
                                            학교 공식 학사일정 · 종일
                                          </p>
                                        </div>
                                        <span
                                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${ev.isHoliday
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-indigo-50 text-indigo-600'
                                            }`}
                                        >
                                          {ev.isHoliday ? '휴업/공휴' : '학교일정'}
                                        </span>
                                      </div>
                                    ))}
                                    {selectedCustomEvents.map((ev) => {
                                      const catInfo =
                                        calCategories.find((c) => c.label === ev.category) ||
                                        calCategories[0];
                                      const timeLabel =
                                        ev.isAllDay === false && ev.startTime
                                          ? `${ev.startTime}${ev.endTime ? ` ~ ${ev.endTime}` : ''}`
                                          : '종일';
                                      return (
                                        <div
                                          key={ev.id}
                                          className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-xs"
                                        >
                                          <span
                                            className="w-1 self-stretch rounded-full"
                                            style={{ backgroundColor: catInfo.color }}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{ev.title}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                              {timeLabel}
                                              {ev.location ? ` · 📍 ${ev.location}` : ''}
                                            </p>
                                            {ev.memo && (
                                              <p className="text-[10px] text-slate-600 mt-0.5">{ev.memo}</p>
                                            )}
                                          </div>
                                          <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${catInfo.badgeClass}`}
                                          >
                                            {catInfo.label}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteCustomCal(ev.id)}
                                            className="text-slate-400 hover:text-red-600 shrink-0"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
