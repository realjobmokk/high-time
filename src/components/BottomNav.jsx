import React from 'react';
import { Layers, School, Home, MessageSquareHeart, MessageCircle, UserCircle } from 'lucide-react';

// 하단 내비게이션 바 컴포넌트 (프로필 배너 추가)
export default function BottomNav({ activeTab, setActiveTab, unreadChatCount }) {
  const tabs = [
    {
      id: 'home',
      label: '홈',
      sublabel: '급식·시간표·HOT',
      icon: Home,
    },
    {
      id: 'major',
      label: '전공게시판',
      sublabel: '전국 공유',
      icon: Layers,
    },
    {
      id: 'school',
      label: '우리학교',
      sublabel: '교내 커뮤니티',
      icon: School,
    },
    {
      id: 'counseling',
      label: '입시·질문',
      sublabel: '멘토링',
      icon: MessageSquareHeart,
    },
    {
      id: 'chat',
      label: '1:1채팅',
      sublabel: '대화방',
      icon: MessageCircle,
      badge: unreadChatCount
    },
    {
      id: 'profile',
      label: '프로필',
      sublabel: '내정보·수정',
      icon: UserCircle,
    },
  ];

  return (
    <nav className="sticky bottom-0 left-0 right-0 w-full z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 transition-all shrink-0">
      <div className="w-full grid grid-cols-6 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all relative rounded-xl ${
                isActive ? '-mt-3 text-red-600 font-extrabold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div
                className={`relative flex items-center justify-center transition-all ${
                  isActive
                    ? 'w-9 h-9 rounded-full bg-red-600 text-white shadow-md shadow-red-200'
                    : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span
                    className={`absolute bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center ${
                      isActive ? '-top-1 -right-1 border border-white' : '-top-1.5 -right-2'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
