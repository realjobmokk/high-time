import React from 'react';
import { Layers, School, MessageSquareHeart, UtensilsCrossed, MessageCircle } from 'lucide-react';

// 하단 내비게이션 바 컴포넌트
export default function BottomNav({ activeTab, setActiveTab, unreadChatCount }) {
  const tabs = [
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
      label: '입시·1:1질문',
      sublabel: '멘토링',
      icon: MessageSquareHeart,
    },
    {
      id: 'schoolLife',
      label: '급식·시간표',
      sublabel: 'D-day',
      icon: UtensilsCrossed,
    },
    {
      id: 'chat',
      label: '1:1 채팅',
      sublabel: '대화방',
      icon: MessageCircle,
      badge: unreadChatCount
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 transition-all">
      <div className="max-w-md mx-auto grid grid-cols-5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 transition relative rounded-xl ${
                isActive ? 'text-red-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-red-600' : 'text-slate-500'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-red-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
