import React from 'react';
import { X, Bell, MessageSquare, HelpCircle, GraduationCap, Check } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, onReadNotifications }) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'noti-1',
      type: 'comment',
      icon: MessageSquare,
      iconColor: 'text-blue-500 bg-blue-50',
      title: '내 글에 새 댓글이 달렸습니다.',
      content: '알고리즘깎는노인: "수학과 연계해서 벡터 내적과 코사인 법칙 수식까지..."',
      time: '18분 전',
      unread: true
    },
    {
      id: 'noti-2',
      type: 'qa',
      icon: HelpCircle,
      iconColor: 'text-rose-500 bg-rose-50',
      title: '1:1 질문에 멘토의 답변이 등록되었습니다!',
      content: '하얀가운꿈나무(상산고 고3): "전혀 과하지 않습니다! 오히려 생명과학2 효소..."',
      time: '45분 전',
      unread: true
    },
    {
      id: 'noti-3',
      type: 'consult',
      icon: GraduationCap,
      iconColor: 'text-purple-500 bg-purple-50',
      title: '신청하신 입시 컨설팅 분석 리포트가 도착했습니다.',
      content: '대치동 입시연구소 김멘토: "컴공 학종에서 수학 세특은 1순위 평가 요소..."',
      time: '2시간 전',
      unread: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-sm p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-sm text-slate-900">알림 센터</h3>
          </div>
          <button
            onClick={() => {
              onReadNotifications();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
          >
            모두 읽음 & 닫기
          </button>
        </div>

        <div className="space-y-2 mt-3 max-h-72 overflow-y-auto">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border text-xs transition ${
                  n.unread
                    ? 'bg-red-50/50 border-red-100'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-xl ${n.iconColor} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-[11px]">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 leading-snug line-clamp-2">
                      {n.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
