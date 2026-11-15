import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  CalendarDays, 
  Clock, 
  Flame, 
  CheckCircle, 
  Smile, 
  Heart, 
  ThumbsUp, 
  ChevronRight,
  School
} from 'lucide-react';
import { INITIAL_SCHOOL_LIFE } from '../data/mockData';

export default function SchoolLife({ currentSchool }) {
  const [lifeTab, setLifeTab] = useState('meal'); // 'meal' | 'timetable' | 'dday'
  const [selectedDay, setSelectedDay] = useState('수');
  const [mealReaction, setMealReaction] = useState('love'); // 급식 반응 투표

  const { todayMeal, weeklySchedule, dDayList } = INITIAL_SCHOOL_LIFE;
  const currentSchedule = weeklySchedule.find((s) => s.day === selectedDay) || weeklySchedule[2];

  return (
    <div className="pb-24 pt-2 px-4 space-y-3">
      {/* 1. 상단 내비게이션 탭 (급식, 시간표, D-Day) */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setLifeTab('meal')}
          className={`flex items-center justify-center gap-1 py-2 rounded-xl transition ${
            lifeTab === 'meal' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>오늘의 급식</span>
        </button>
        <button
          onClick={() => setLifeTab('timetable')}
          className={`flex items-center justify-center gap-1 py-2 rounded-xl transition ${
            lifeTab === 'timetable' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>주간 시간표</span>
        </button>
        <button
          onClick={() => setLifeTab('dday')}
          className={`flex items-center justify-center gap-1 py-2 rounded-xl transition ${
            lifeTab === 'dday' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>학사 D-day</span>
        </button>
      </div>

      {/* 2. 급식 탭 */}
      {lifeTab === 'meal' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                  {currentSchool.name} 영양실
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{todayMeal.date}</h3>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                  🔥 {todayMeal.calorie}
                </span>
              </div>
            </div>

            {/* 식단 목록 */}
            <div className="py-3 space-y-2">
              {todayMeal.menu.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-semibold text-slate-800">{item.name}</span>
                  {item.allergy && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      알레르기: {item.allergy}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* 급식 평가 리액션 투표 */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600 block mb-2">
                오늘 급식 어땠나요? (실시간 학생 반응)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMealReaction('love')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                    mealReaction === 'love'
                      ? 'bg-rose-50 border border-rose-300 text-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>대존맛 (142)</span>
                </button>
                <button
                  onClick={() => setMealReaction('good')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                    mealReaction === 'good'
                      ? 'bg-amber-50 border border-amber-300 text-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 text-amber-500" />
                  <span>무난무난 (38)</span>
                </button>
                <button
                  onClick={() => setMealReaction('bad')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                    mealReaction === 'bad'
                      ? 'bg-slate-100 border border-slate-300 text-slate-800 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}
                >
                  <Smile className="w-4 h-4 text-slate-400" />
                  <span>매점갈래 (12)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 내일 급식 스포일러 배너 */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-3.5 text-white shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-amber-100">내일의 점심 메뉴 스포</span>
              <h4 className="text-xs font-bold mt-0.5">베이컨 김치볶음밥, 계란후라이, 미니 우동, 츄러스</h4>
            </div>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-lg font-bold">D-1</span>
          </div>
        </div>
      )}

      {/* 3. 시간표 탭 */}
      {lifeTab === 'timetable' && (
        <div className="space-y-3">
          {/* 요일 선택 */}
          <div className="grid grid-cols-5 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {['월', '화', '수', '목', '금'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  selectedDay === day
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {day}요일
              </button>
            ))}
          </div>

          {/* 교시별 시간표 리스트 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">
                {selectedDay}요일 수업 시간표
              </span>
              <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">
                {selectedDay === '수' ? '단축 6교시 운영일' : '정규 7교시'}
              </span>
            </div>

            {currentSchedule.periods.map((subject, idx) => {
              const isCurrentPeriod = selectedDay === '수' && idx === 3; // 현재 교시 예시
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                    isCurrentPeriod
                      ? 'bg-red-50 border border-red-200 font-bold text-red-700'
                      : 'bg-slate-50 border border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-600">
                      {idx + 1}
                    </span>
                    <span>{subject}</span>
                  </div>
                  {isCurrentPeriod ? (
                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                      진행중
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">50분 수업</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. D-Day 탭 */}
      {lifeTab === 'dday' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-red-500" />
              주요 학사 및 시험 일정 카운트다운
            </h3>

            <div className="space-y-2.5">
              {dDayList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{item.title}</h4>
                    <span className="text-[10px] text-slate-400">{item.targetDate}</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black text-white ${item.badgeColor} shadow-sm`}
                  >
                    {item.dDay}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
