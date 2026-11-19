import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  ShieldCheck,
  ChevronLeft,
  Lock,
  AlertTriangle
} from 'lucide-react';

const SUPABASE_URL = 'https://sghkaxetnfkmjminjekk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_v6Ttgv7298aUSbGZDDjbbQ_uz1yY7_x';

const BLOCKED_PATTERNS = [
  /010[-\s]?\d{3,4}[-\s]?\d{4}/,
  /카톡|카카오톡|아이디|인스타|페메|전화번호|전번|연락처/,
  /시발|씨발|병신|개새끼|존나|미친놈/
];

export function buildWebChatKey(user, school) {
  if (user?.username && user.username.trim()) return user.username.trim().toLowerCase();
  return `${(school?.name || '').trim()}::${(user?.name || '').trim()}`;
}

export function buildWebPairRoomId(key1, key2) {
  const sorted = [key1.trim().toLowerCase(), key2.trim().toLowerCase()].sort();
  const safe = sorted.join('__').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  return `chatroom_${safe}`;
}

export async function sendChatMessageToSupabase({
  roomId,
  myKey,
  myName,
  mySchool,
  peerKey,
  peerName,
  peerSchool,
  text,
  time
}) {
  try {
    const msgId = `m-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // 기존 채팅방 존재 여부 확인 후 생성 또는 요약 갱신 (참여자 A/B 순서 유지)
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/chat_rooms?select=id&id=eq.${encodeURIComponent(roomId)}&limit=1`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    const existingRooms = checkRes.ok ? await checkRes.json() : [];

    let roomRes;
    if (Array.isArray(existingRooms) && existingRooms.length > 0) {
      roomRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_rooms?id=eq.${encodeURIComponent(roomId)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            last_message: text,
            last_time: time,
            updated_at: nowIso
          })
        }
      );
    } else {
      roomRes = await fetch(`${SUPABASE_URL}/rest/v1/chat_rooms`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: roomId,
          user_a_key: myKey,
          user_a_name: myName,
          user_a_school: mySchool || '',
          user_b_key: peerKey,
          user_b_name: peerName,
          user_b_school: peerSchool || '',
          avatar_bg: '#dc2626',
          last_message: text,
          last_time: time,
          updated_at: nowIso
        })
      });
    }

    if (!roomRes.ok) return;

    await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: msgId,
        room_id: roomId,
        sender_key: myKey,
        sender_name: myName,
        text,
        time_label: time,
        read_by: [myKey]
      })
    });
  } catch {}
}

export default function DirectChat({
  currentUser,
  currentSchool,
  initialRoomId = null,
  onUnreadCountChange,
  onRoomOpenChange
}) {
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(initialRoomId);
  const [inputMessage, setInputMessage] = useState('');
  const [blockError, setBlockError] = useState('');

  const messagesEndRef = useRef(null);
  const myKey = buildWebChatKey(currentUser, currentSchool);
  const myName = currentUser?.name || '';
  const mySchool = currentSchool?.name || '';

  useEffect(() => {
    if (initialRoomId) {
      setActiveRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  // Supabase에서 내 1:1 채팅방 목록 실시간 동기화 (chat_rooms + chat_messages 우선, 미생성 시 direct_questions 폴백)
  const fetchRooms = async () => {
    if (!myName) return;
    try {
      // 1순위: chat_rooms + chat_messages 관계형 테이블 조회
      const roomRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_rooms?select=*&order=updated_at.desc`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      if (roomRes.ok) {
        const roomRows = await roomRes.json();
        const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
        const myRooms = (Array.isArray(roomRows) ? roomRows : []).filter((r) => {
          const isUserA =
            norm(r.user_a_key) === norm(myKey) ||
            (norm(r.user_a_name) === norm(myName) && norm(r.user_a_school) === norm(mySchool));
          const isUserB =
            norm(r.user_b_key) === norm(myKey) ||
            (norm(r.user_b_name) === norm(myName) && norm(r.user_b_school) === norm(mySchool));
          return isUserA || isUserB;
        });

        const msgsByRoom = new Map();
        if (myRooms.length > 0) {
          const inFilter = myRooms.map((r) => `"${r.id}"`).join(',');
          const msgRes = await fetch(
            `${SUPABASE_URL}/rest/v1/chat_messages?select=*&room_id=in.(${encodeURIComponent(
              inFilter
            )})&order=created_at.asc`,
            { headers: { apikey: SUPABASE_KEY } }
          );
          if (msgRes.ok) {
            const msgRows = await msgRes.json();
            for (const m of Array.isArray(msgRows) ? msgRows : []) {
              const list = msgsByRoom.get(m.room_id) || [];
              list.push(m);
              msgsByRoom.set(m.room_id, list);
            }
          }
        }

        const parsed = myRooms.map((r) => {
          const isUserA =
            r.user_a_key === myKey ||
            (r.user_a_name === myName && r.user_a_school === mySchool);
          const peerName = (isUserA ? r.user_b_name : r.user_a_name) || '학생';
          const peerSchool = (isUserA ? r.user_b_school : r.user_a_school) || '';
          const peerKey = isUserA ? r.user_b_key : r.user_a_key;
          const rawMsgs = msgsByRoom.get(r.id) || [];
          const lastRaw = rawMsgs[rawMsgs.length - 1];
          const unreadCount = rawMsgs.filter((m) => {
            const readBy = Array.isArray(m.read_by) ? m.read_by : [];
            return m.sender_key !== myKey && !readBy.includes(myKey);
          }).length;

          return {
            id: r.id,
            peerKey,
            peerName,
            peerSchool,
            unreadCount,
            lastMessage: lastRaw ? lastRaw.text : r.last_message || '대화를 시작해 보세요!',
            lastTime: lastRaw ? lastRaw.time_label : r.last_time || '방금 전',
            safetyNotice:
              r.safety_notice ||
              '개인 연락처(전화번호·SNS) 요구 및 비속어는 자동 차단됩니다.',
            messages: rawMsgs.map((m) => {
              const isMe =
                m.sender_key === myKey || (m.sender_name === myName && !m.sender_key);
              const readBy = Array.isArray(m.read_by) ? m.read_by : [];
              const peerRead = readBy.some((k) => k !== myKey);
              return {
                id: m.id,
                sender: isMe ? 'me' : 'peer',
                text: m.text,
                time: m.time_label,
                isRead: isMe ? peerRead : true
              };
            })
          };
        });

        setChatRooms(parsed);
        const totalUnread = parsed.reduce((sum, r) => sum + r.unreadCount, 0);
        onUnreadCountChange?.(totalUnread);
      }
    } catch {}
  };

  useEffect(() => {
    fetchRooms();
    const timer = setInterval(fetchRooms, 2500);
    return () => clearInterval(timer);
  }, [myKey, myName, mySchool]);

  const activeRoom = chatRooms.find((r) => r.id === activeRoomId);

  // 대화방 열림/닫힘 상태를 상위(App.jsx)로 전달해 전체 화면 전환 처리
  useEffect(() => {
    onRoomOpenChange?.(Boolean(activeRoomId && activeRoom));
  }, [activeRoomId, Boolean(activeRoom)]);

  // 방 입장 시 읽음 처리 + 맨 아래 스크롤
  const markRoomRead = async (roomId) => {
    try {
      // 1순위: chat_messages 테이블 read_by 업데이트
      const msgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_messages?select=id,read_by&room_id=eq.${encodeURIComponent(
          roomId
        )}`,
        { headers: { apikey: SUPABASE_KEY } }
      );
      if (msgRes.ok) {
        const msgRows = await msgRes.json();
        let changed = false;
        for (const m of Array.isArray(msgRows) ? msgRows : []) {
          const readBy = Array.isArray(m.read_by) ? m.read_by : [];
          if (!readBy.includes(myKey)) {
            changed = true;
            await fetch(
              `${SUPABASE_URL}/rest/v1/chat_messages?id=eq.${encodeURIComponent(m.id)}`,
              {
                method: 'PATCH',
                headers: {
                  apikey: SUPABASE_KEY,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ read_by: [...readBy, myKey] })
              }
            );
          }
        }
        if (changed) fetchRooms();
      }
    } catch {}
  };

  useEffect(() => {
    if (activeRoomId) {
      if (activeRoom && activeRoom.unreadCount > 0) {
        markRoomRead(activeRoomId);
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  }, [activeRoomId, activeRoom?.messages.length]);

  const handleOpenPeerModal = async () => {
    setIsPeerModalOpen(true);
    setIsLoadingPeers(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/users?select=login_id,name,school_name,grade&order=created_at.desc&limit=40`;
      const res = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
      const rows = res.ok ? await res.json() : [];
      const seen = new Set();
      const list = [];
      for (const row of rows) {
        if (!row.name) continue;
        const pKey = row.login_id
          ? row.login_id.trim().toLowerCase()
          : `${(row.school_name || '').trim()}::${row.name.trim()}`;
        if (pKey === myKey || (row.name === myName && row.school_name === mySchool)) continue;
        if (seen.has(pKey)) continue;
        seen.add(pKey);
        list.push({
          key: pKey,
          loginId: row.login_id,
          name: row.name,
          school: row.school_name || '고등학교',
          grade: row.grade || '고2'
        });
      }
      setPeerOptions(list);
    } catch {
      setPeerOptions([]);
    }
    setIsLoadingPeers(false);
  };

  const handleSelectPeer = (peer) => {
    setIsPeerModalOpen(false);
    const roomId = buildWebPairRoomId(myKey, peer.key);
    const existing = chatRooms.find((r) => r.id === roomId);
    if (!existing) {
      const nowTime = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setChatRooms((prev) => [
        {
          id: roomId,
          peerKey: peer.key,
          peerName: peer.name,
          peerSchool: `${peer.school} ${peer.grade}`,
          unreadCount: 0,
          lastMessage: '대화를 시작해 보세요!',
          lastTime: nowTime,
          safetyNotice: '개인 연락처(전화번호·SNS) 요구 및 비속어는 자동 차단됩니다.',
          messages: []
        },
        ...prev
      ]);
    }
    setActiveRoomId(roomId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || !activeRoom) return;
    setBlockError('');

    if (BLOCKED_PATTERNS.some((p) => p.test(trimmed))) {
      setBlockError('개인 연락처(전화번호·SNS·카톡ID) 요구나 비속어는 전송할 수 없습니다.');
      return;
    }

    const nowTime = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: trimmed,
      time: nowTime,
      isRead: false
    };

    setChatRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id
          ? {
              ...r,
              lastMessage: trimmed,
              lastTime: nowTime,
              messages: [...r.messages, newMsg]
            }
          : r
      )
    );
    setInputMessage('');

    await sendChatMessageToSupabase({
      roomId: activeRoom.id,
      myKey,
      myName,
      mySchool,
      peerKey: activeRoom.peerKey || buildWebChatKey({ name: activeRoom.peerName }, { name: activeRoom.peerSchool }),
      peerName: activeRoom.peerName,
      peerSchool: activeRoom.peerSchool,
      text: trimmed,
      time: nowTime
    });
    fetchRooms();
  };

  // 1. 채팅방 목록
  if (!activeRoomId || !activeRoom) {
    return (
      <div className="min-h-full bg-white pt-3 pb-6 px-4 flex flex-col gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2 text-[11px] text-emerald-800 font-semibold leading-relaxed shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            HighTime 1:1 채팅은 실시간 안전 메시징입니다. 개인 연락처 요구 및 욕설/비방은 자동 검열·차단됩니다.
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-red-600" />
              <h3 className="font-extrabold text-xs text-slate-900">
                내 1:1 대화방 목록 ({chatRooms.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">전공게시판 1:1 신청 전용</span>
          </div>

          {chatRooms.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-500">진행 중인 1:1 대화가 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                전공게시판에서 작성자에게 [1:1 채팅 신청]을 보내면 대화가 시작됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-3">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => {
                    setActiveRoomId(room.id);
                    markRoomRead(room.id);
                  }}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 cursor-pointer transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {room.peerName.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{room.peerName}</span>
                        {room.peerSchool && (
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            ({room.peerSchool})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{room.lastMessage}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block mb-1">{room.lastTime}</span>
                    {room.unreadCount > 0 && (
                      <span className="inline-block px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-bold">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. HighTime 시그니처 레드/화이트 멘토링 대화방 내부 UI (오른쪽에서 왼쪽으로 슬라이드 인 + 전체 화면)
  return (
    <div
      className="h-full flex flex-col bg-slate-50"
      style={{ animation: 'hightimeChatSlideIn 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
    >
      <style>{`@keyframes hightimeChatSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      {/* 상단 헤더 */}
      <div className="px-3 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveRoomId(null)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h4 className="font-black text-xs text-slate-900">{activeRoom.peerName}</h4>
            {activeRoom.peerSchool && (
              <p className="text-[10px] text-slate-500">{activeRoom.peerSchool}</p>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          실시간
        </span>
      </div>

      {/* 안전 안내 바 */}
      <div className="px-3 py-1.5 bg-rose-50 border-b border-rose-100 text-[10px] text-rose-800 flex items-center gap-1.5 shrink-0">
        <Lock className="w-3 h-3 text-rose-600 shrink-0" />
        <span>{activeRoom.safetyNotice}</span>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex justify-center">
          <span className="px-3 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
            오늘 대화
          </span>
        </div>

        {activeRoom.messages.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-10 font-semibold">
            첫 메시지를 보내 대화를 시작해 보세요!
          </p>
        ) : (
          activeRoom.messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {activeRoom.peerName.slice(0, 1)}
                  </div>
                )}

                <div className={`max-w-[76%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] font-bold text-slate-700 mb-0.5">
                      {activeRoom.peerName}
                    </span>
                  )}
                  <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap break-words ${
                        isMe
                          ? 'bg-red-600 text-white font-medium rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} shrink-0`}>
                      {isMe && (
                        <span
                          className={`text-[9px] font-extrabold leading-none mb-0.5 ${
                            msg.isRead ? 'text-red-600' : 'text-slate-400'
                          }`}
                        >
                          {msg.isRead ? '읽음' : '전송됨'}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 leading-none">{msg.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {blockError && (
        <div className="px-3 py-1.5 bg-red-50 border-t border-red-200 text-red-600 text-[11px] font-bold flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{blockError}</span>
        </div>
      )}

      {/* 메시지 입력 바 */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            if (blockError) setBlockError('');
          }}
          placeholder="질문이나 메시지를 입력하세요..."
          className="flex-1 bg-slate-100 rounded-full px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0 transition active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
