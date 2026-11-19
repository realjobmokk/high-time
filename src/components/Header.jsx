import React, { useState } from 'react';
import { 
  School, 
  Bell, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  FileCheck, 
  RefreshCw,
  X
} from 'lucide-react';

// 상단 헤더 컴포넌트 (공식 인증된 내 고등학교 고정 표시 및 학생증 인증 카드 팝업)
export default function Header({
  currentUser,
  currentSchool,
  isMobileFrame,
  setIsMobileFrame,
  unreadNotifications,
  onOpenNotifications,
  onOpenAuthModal
}) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

          {/* 우측 컨트롤 (디바이스 프레임 토글, 알림) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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

      {/* 내 학생 인증 정보 팝업 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 text-sm">내 학생 인증 정보</h3>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 학생증 스타일 카드 */}
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">
                  HIGH SCHOOL STUDENT ID
                </span>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  정식 재학생
                </span>
              </div>

              <div>
                <h4 className="text-base font-black tracking-tight text-white">{currentSchool.name}</h4>
                <p className="text-xs text-slate-300 font-medium">
                  {currentUser?.name || '서정윤'} · {currentUser?.grade || '고2'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-700/60 text-[11px] space-y-1 text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">PASS 본인인증:</span>
                  <span className="text-emerald-400 font-bold">일치 완료 (PASS)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">재학증명서 PDF:</span>
                  <span className="text-emerald-400 font-bold">검증 승인됨</span>
                </div>
              </div>
            </div>

            {/* 안내 문구 */}
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              💡 학교 사칭 및 외부인 침입 방지를 위해 <strong>오직 인증된 소속 학교만 이용</strong> 가능하며, 전학 등의 사유가 있을 경우에만 재인증 절차를 통해 변경할 수 있습니다.
            </p>

            {/* 전학 / 재인증 버튼 */}
            <button
              onClick={() => {
                setIsProfileModalOpen(false);
                onOpenAuthModal();
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>전학 / 학교 재인증 신청</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
