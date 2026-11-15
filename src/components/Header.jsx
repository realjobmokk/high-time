import React, { useState } from 'react';
import { School, Bell, ChevronDown, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { SAMPLE_SCHOOLS } from '../data/mockData';

// 상단 헤더 컴포넌트 (학교 변경 및 화면 모드 전환 기능 포함)
export default function Header({
  currentSchool,
  setCurrentSchool,
  isMobileFrame,
  setIsMobileFrame,
  unreadNotifications,
  onOpenNotifications
}) {
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 transition-all">
        <div className="flex items-center justify-between">
          {/* 로고 및 브랜딩 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 flex items-center justify-center text-white font-extrabold shadow-sm shadow-red-200">
              H
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  HighTime
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-600 tracking-wider">
                  고교타임
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none">
                전국 고교 전공정보 & 학교생활
              </p>
            </div>
          </div>

          {/* 우측 컨트롤 (학교 선택 뱃지, 디바이스 프레임 토글, 알림) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 현재 소속 고등학교 선택 버튼 */}
            <button
              onClick={() => setIsSchoolModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full text-xs font-semibold text-slate-700 transition"
              title="내 학교 변경하기"
            >
              <School className="w-3.5 h-3.5 text-red-500" />
              <span className="max-w-[70px] sm:max-w-[100px] truncate">{currentSchool.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* 디바이스 뷰 모드 토글 (모바일 목업 vs 와이드 뷰) */}
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title={isMobileFrame ? "넓은 화면으로 보기" : "스마트폰 프레임으로 보기"}
            >
              {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-red-500" />}
            </button>

            {/* 알림 버튼 */}
            <button
              onClick={onOpenNotifications}
              className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              title="알림 확인"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 학교 변경 팝업 모달 */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 text-base">소속 고등학교 선택</h3>
              </div>
              <button
                onClick={() => setIsSchoolModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                닫기
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2 mb-3">
              선택한 학교의 급식, 시간표, 전용 게시판이 연동됩니다.
            </p>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {SAMPLE_SCHOOLS.map((school) => {
                const isSelected = school.id === currentSchool.id;
                return (
                  <button
                    key={school.id}
                    onClick={() => {
                      setCurrentSchool(school);
                      setIsSchoolModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm transition ${
                      isSelected
                        ? 'bg-red-50 border border-red-200 text-red-700 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{school.name}</div>
                      <div className="text-[11px] text-slate-400">{school.region}</div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        재학중
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
