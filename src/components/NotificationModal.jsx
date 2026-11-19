import React from 'react';
import { X, Bell, MessageSquare, HelpCircle, GraduationCap, Check } from 'lucide-react';

export default function NotificationModal({
  isOpen,
  onClose,
  onReadNotifications,
  notifications = [],
  onSelectNotification
}) {
  if (!isOpen) return null;

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
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-500">새로운 알림이 없습니다.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                내 글에 댓글이나 1:1 질문이 오면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = n.icon || MessageSquare;
              const iconColor = n.iconColor || 'bg-red-100 text-red-600';
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNotification?.(n)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs transition ${n.unread
                    ? 'bg-red-50/50 border-red-100 hover:bg-red-50'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-xl ${iconColor} shrink-0`}>
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
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
