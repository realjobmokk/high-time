import React, { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  ShieldAlert, 
  Sparkles, 
  ChevronLeft, 
  HelpCircle, 
  Info, 
  Check, 
  Lock,
  Flag,
  FileText
} from 'lucide-react';
import { INITIAL_CHAT_ROOMS } from '../data/mockData';

export default function DirectChat() {
  const [chatRooms, setChatRooms] = useState(INITIAL_CHAT_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(true); // 기획 고민 분석 패널 표시 여부

  const activeRoom = chatRooms.find((r) => r.id === activeRoomId);

  // 메시지 전송 처리
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeRoomId) return;

    const userMsg = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: inputMessage.trim(),
      time: '방금'
    };

    const updatedRooms = chatRooms.map((room) => {
      if (room.id === activeRoomId) {
        return {
          ...room,
          lastMessage: userMsg.text,
          lastTime: '방금',
          messages: [...room.messages, userMsg]
        };
      }
      return room;
    });

    setChatRooms(updatedRooms);
    setInputMessage('');

    // 1초 후 상대방 자동 응답 시뮬레이션 (인터랙티브 데모)
    setTimeout(() => {
      const autoReply = {
        id: `m-${Date.now() + 1}`,
        sender: 'peer',
        text: '네 확인했습니다! 질문주신 부분 정리해서 추가 자료도 함께 전달해 드릴게요 :)',
        time: '방금'
      };
      setChatRooms((prev) =>
        prev.map((r) =>
          r.id === activeRoomId
            ? { ...r, lastMessage: autoReply.text, messages: [...r.messages, autoReply] }
            : r
        )
      );
    }, 1200);
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-3">
      {/* 1. 기획 분석 패널 (사용자의 '1:1 채팅 기능 고민필요'에 대한 솔루션 가이드) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-100 text-red-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                💡 고등학생 1:1 채팅 도입 시 기획 고민 & 해결 솔루션
              </h3>
              <p className="text-[11px] text-slate-500">
                {showAnalysis ? '접어두기' : '자세히 보기 (안전 장치 및 운영 정책 제안)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
            {showAnalysis ? '닫기' : '열기'}
          </span>
        </button>

        {showAnalysis && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 text-slate-700">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <p className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                예상되는 문제점 (고민 포인트)
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5 pl-1">
                <li>미성년자 대상 불법 마케팅, 과외 유인, 개인 연락처 요구 위험</li>
                <li>익명성에 기댄 언어폭력 및 사이버 불링 가능성</li>
                <li>무분별한 1:1 연락으로 인한 우수 학생(멘토)들의 피로도 증가</li>
              </ul>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
              <p className="font-bold text-emerald-800 flex items-center gap-1 text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                추천하는 안전 설계 (해결 방안)
              </p>
              <ul className="list-disc list-inside text-[11px] text-emerald-900 space-y-0.5 pl-1">
                <li><strong>수락형 대화방:</strong> 아무나 바로 채팅하는 것이 아니라, "1:1 질문"을 상대방이 수락해야만 방 개설</li>
                <li><strong>실시간 금칙어/전화번호 차단:</strong> 개인 SNS 아이디 및 번호 전송 시 경고창 팝업</li>
                <li><strong>원클릭 신고 & 즉시 캡처 기능:</strong> 캡처 방지 워터마크 및 즉각 차단 시스템 구축</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 2. 대화방 목록 또는 대화방 내부 화면 */}
      {!activeRoomId ? (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-xs text-slate-900">내 1:1 대화방 목록</h3>
            </div>
            <span className="text-[11px] text-slate-400">학습 및 입시 멘토링 전용</span>
          </div>

          <div className="space-y-2">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 cursor-pointer transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${room.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                    {room.peerName.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{room.peerName}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({room.peerSchool})</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                      {room.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block mb-1">{room.lastTime}</span>
                  {room.unreadCount > 0 && (
                    <span className="inline-block px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-bold">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 3. 대화방 내부 UI */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[480px]">
          {/* 대화방 상단 헤더 */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveRoomId(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h4 className="font-bold text-xs text-slate-900">{activeRoom.peerName}</h4>
                <p className="text-[10px] text-slate-400">{activeRoom.peerSchool}</p>
              </div>
            </div>

            <button
              onClick={() => alert('신고가 접수되었습니다. 운영진이 대화 내용을 검토합니다.')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition"
              title="대화방 신고하기"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* 안전 가이드라인 알림 배너 */}
          <div className="bg-red-50 px-3 py-1.5 border-b border-red-100 flex items-center gap-1.5 text-[10px] text-red-700 font-medium">
            <Lock className="w-3 h-3 text-red-500 shrink-0" />
            <span>{activeRoom.safetyNotice}</span>
          </div>

          {/* 메시지 리스트 영역 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/30">
            {activeRoom.messages.map((m) => {
              const isMe = m.sender === 'me';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-red-500 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                </div>
              );
            })}
          </div>

          {/* 메시지 입력 폼 */}
          <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="상대방에게 매너 있는 메시지를 보내보세요..."
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
