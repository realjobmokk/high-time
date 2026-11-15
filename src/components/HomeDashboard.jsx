import React from 'react';
import { 
  Home, 
  UtensilsCrossed, 
  Clock, 
  CalendarDays, 
  Flame, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  School, 
  HelpCircle, 
  PenSquare, 
  GraduationCap, 
  Heart,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { INITIAL_SCHOOL_LIFE } from '../data/mockData';

// 홈(Home) 종합 대시보드 컴포넌트
// 사용자의 요청대로 기존 급식·시간표·D-day를 중심으로 모으고,
// 실시간 인기글, 추천 세특 키워드, 퀵 바로가기 등 다양한 기능을 추가한 종합 홈 화면
export default function HomeDashboard({
  currentUser,
  currentSchool,
  majorPosts,
  schoolPosts,
  onSelectPost,
  onNavigateTab,
  onOpenWriteModal
}) {
  const { todayMeal, weeklySchedule, dDayList } = INITIAL_SCHOOL_LIFE;
  
  // 수요일 시간표 (샘플)
  const todaySchedule = weeklySchedule.find((s) => s.day === '수') || weeklySchedule[2];

  // 인기 전공 게시글 (좋아요 많은 순 2개)
  const hotMajorPosts = [...majorPosts].sort((a, b) => b.likes - a.likes).slice(0, 2);

  // 우리 학교 최신 인기글 2개
  const hotSchoolPosts = [...schoolPosts].slice(0, 2);

  // 오늘의 추천 세특·탐구 키워드 목록
  const recommendedKeywords = [
    { text: 'RAG 생성형 AI', major: '컴공' },
    { text: '미하엘리스-멘텐 효소학', major: '의약학' },
    { text: '기준금리 & 통화정책', major: '경제' },
    { text: '베르누이 방정식', major: '물리' },
    { text: '디지털 디바이드 격차', major: '사회' }
  ];

  return (
    <div className="pb-24 pt-2 px-4 space-y-3.5">
      {/* 1. 상단 환영 및 내 학교 카드 */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-md shadow-red-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{currentSchool.name} 정식 재학생</span>
          </div>
          <span className="text-[10px] text-red-100 font-medium">2026. 11. 15 (수)</span>
        </div>

        <h2 className="text-base font-black tracking-tight leading-snug">
          {currentUser?.name || '김민준'} 학생, 오늘도 열공하세요! 🔥
        </h2>
        <p className="text-xs text-red-100 mt-0.5">
          수능과 기말고사를 준비하는 전국 고교생들이 함께하고 있습니다.
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
            onClick={() => onNavigateTab('counseling')}
            className="flex items-center justify-center gap-1 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>1:1 질문</span>
          </button>
          <button
            onClick={() => onNavigateTab('counseling')}
            className="flex items-center justify-center gap-1 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition active:scale-95"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>입시상담</span>
          </button>
        </div>
      </div>

      {/* 2. D-Day 시험 및 학사 일정 (가로 스크롤 카드) */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-red-500" />
            주요 학사 D-day
          </span>
          <span className="text-[11px] text-slate-400">수능·시험 카운트다운</span>
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
        {/* 오늘의 급식 위젯 카드 */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-red-500" />
                오늘의 급식
              </span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md">
                {todayMeal.calorie}
              </span>
            </div>

            <ul className="text-xs text-slate-700 space-y-1.5">
              {todayMeal.menu.slice(0, 4).map((m, i) => (
                <li key={i} className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="truncate font-medium">{m.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>외 2개 메뉴</span>
            <span className="text-rose-500 flex items-center gap-0.5">
              <Heart className="w-3 h-3 fill-rose-500" />
              대존맛 142표
            </span>
          </div>
        </div>

        {/* 오늘 시간표 위젯 카드 */}
        <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                수요일 시간표
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md">
                6교시 단축
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {todaySchedule.periods.slice(0, 4).map((sub, idx) => {
                const isCurrent = idx === 3; // 현재 4교시 진행중
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-2 py-0.5 rounded-lg ${
                      isCurrent ? 'bg-red-50 text-red-600 font-bold border border-red-100' : 'text-slate-600'
                    }`}
                  >
                    <span>{idx + 1}교시 {sub}</span>
                    {isCurrent && <span className="text-[9px] bg-red-500 text-white px-1 rounded">현재</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-right">
            5교시: 체육 · 6교시: 정보
          </div>
        </div>
      </div>

      {/* 4. 오늘의 추천 세특 & 탐구 주제 키워드 (추가된 기능) */}
      <div className="bg-white rounded-3xl p-3.5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            오늘의 추천 세특·탐구 키워드
          </span>
          <span className="text-[11px] text-slate-400">교과 융합 추천</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {recommendedKeywords.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigateTab('major')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-xs text-slate-700 transition font-medium"
            >
              <span className="text-[10px] font-bold text-red-500">[{item.major}]</span>
              <span>#{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. 실시간 전국 전공 핫게시물 (추가된 기능) */}
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
          {hotMajorPosts.map((post) => (
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
          ))}
        </div>
      </div>

      {/* 6. 우리 학교 교내 실시간 핫글 (추가된 기능) */}
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
          {hotSchoolPosts.map((sp) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
