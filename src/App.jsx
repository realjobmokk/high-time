import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MajorBoard from './components/MajorBoard';
import SchoolBoard from './components/SchoolBoard';
import CounselingAndQA from './components/CounselingAndQA';
import SchoolLife from './components/SchoolLife';
import DirectChat, {
  buildWebChatKey,
  buildWebPairRoomId,
  sendChatMessageToSupabase
} from './components/DirectChat';
import PostDetailModal from './components/PostDetailModal';
import WritePostModal from './components/WritePostModal';
import NotificationModal from './components/NotificationModal';
import AuthModal from './components/AuthModal';
import HomeDashboard from './components/HomeDashboard';
import ProfileSection from './components/ProfileSection';

import { 
  INITIAL_MAJOR_POSTS, 
  INITIAL_SCHOOL_POSTS, 
  INITIAL_COUNSELING_DATA 
} from './data/mockData';
import { searchNeisHighSchools } from './services/neisService';

export default function App() {
  // 1. 로그인된 학생 사용자 정보 (PASS 및 재학증명서 인증 상태)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('hightime_current_user_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name === '김민준') parsed.name = '서정윤';
      return parsed;
    }
    return {
      name: '서정윤',
      grade: '고2',
      isVerified: true,
      passVerified: true,
      certVerified: true,
      verifiedAt: '2026. 11. 15'
    };
  });

  // 2. 인증 완료된 소속 학교 상태 (나이스 검색 API로 동적 조회)
  const [currentSchool, setCurrentSchool] = useState(() => {
    const saved = localStorage.getItem('hightime_current_school_v3');
    return saved
      ? JSON.parse(saved)
      : { id: 'daehyeon', name: '대현고등학교', region: '울산광역시' };
  });

  useEffect(() => {
    if (!currentSchool?.officeCode || !currentSchool?.schoolCode) {
      searchNeisHighSchools(currentSchool?.name || '대현고등학교').then((res) => {
        if (res.length > 0) setCurrentSchool(res[0]);
      });
    }
  }, [currentSchool?.name]);

  // 3. 로그인 완료 여부 & 인증 모달 오픈 여부 (앱 실행 시 로그인 화면부터 시작)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);

  // 4. 활성 탭 상태 ('home' | 'major' | 'school' | 'counseling' | 'chat')
  const [activeTab, setActiveTab] = useState('home');

  // 3. 전국 전공 게시판 글 목록 상태 (더미 데이터 제거된 새 스토리지 키 사용)
  const [majorPosts, setMajorPosts] = useState(() => {
    const saved = localStorage.getItem('hightime_major_posts_clean');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. 우리 학교 전용 게시판 글 목록 상태
  const [schoolPosts, setSchoolPosts] = useState(() => {
    const saved = localStorage.getItem('hightime_school_posts_clean');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. 1:1 질문 및 입시 상담 데이터 상태
  const [counselingData, setCounselingData] = useState(() => {
    const saved = localStorage.getItem('hightime_counseling_data_clean');
    return saved ? JSON.parse(saved) : INITIAL_COUNSELING_DATA;
  });

  // 6. UI 모달 및 프레임 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [chatRequestPost, setChatRequestPost] = useState(null);
  const [activeChatRoomId, setActiveChatRoomId] = useState(null);
  const [isChatRoomOpen, setIsChatRoomOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // 채팅 탭에서 벗어나면 전체화면 대화방 상태 초기화
  useEffect(() => {
    if (activeTab !== 'chat') {
      setIsChatRoomOpen(false);
    }
  }, [activeTab]);
  const [isSchoolWriteOpen, setIsSchoolWriteOpen] = useState(false);
  const [counselingWriteTrigger, setCounselingWriteTrigger] = useState(0);
  const [chatRequestText, setChatRequestText] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadNotiCount = notifications.filter((n) => n.unread).length;
  const seenChatNotiIdsRef = useRef(new Set());
  const seenCommentNotiIdsRef = useRef(new Set());
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // 프로필(내가 작성한 글)에 달린 새 댓글 감지 → 상단 벨 알림 추가 (이미 확인한 댓글은 localStorage로 영구 제외)
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.name) return;
    const userKey = buildWebChatKey(currentUser, currentSchool);
    const storageKey = `hightime_seen_comment_notis_${userKey}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => seenCommentNotiIdsRef.current.add(String(id)));
        }
      }
    } catch {}

    const freshCommentNotis = [];
    let addedSeen = false;
    for (const post of majorPosts) {
      const isMyPost =
        post.isMine ||
        (post.author?.school === currentSchool?.name &&
          post.author?.nickname === currentUser.name);
      if (!isMyPost) continue;

      for (const c of post.comments || []) {
        const commentAuthorName =
          typeof c.author === 'string' ? c.author : c.author?.nickname || '';
        if (commentAuthorName === currentUser.name) continue;
        if (seenCommentNotiIdsRef.current.has(c.id)) continue;
        seenCommentNotiIdsRef.current.add(c.id);
        addedSeen = true;
        freshCommentNotis.push({
          id: `comment-noti-${c.id}`,
          title: `${commentAuthorName || '학생'}님이 내 글에 댓글을 남겼어요`,
          content: c.content,
          time: c.createdAt || '방금 전',
          unread: true,
          postId: post.id
        });
      }
    }

    if (addedSeen) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify(Array.from(seenCommentNotiIdsRef.current))
        );
      } catch {}
    }

    if (freshCommentNotis.length > 0) {
      setNotifications((prev) => {
        const existing = new Set(prev.map((n) => n.id));
        const unique = freshCommentNotis.filter((n) => !existing.has(n.id));
        return unique.length > 0 ? [...unique.reverse(), ...prev] : prev;
      });
    }
  }, [majorPosts, isLoggedIn, currentUser?.name, currentUser?.username, currentSchool?.name]);

  // 어느 탭에 있든 새 1:1 채팅 메시지가 오면 상단 벨 알림 & 하단 채팅 배지 실시간 갱신
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.name) return;
    const SUPABASE_URL = 'https://sghkaxetnfkmjminjekk.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_v6Ttgv7298aUSbGZDDjbbQ_uz1yY7_x';
    const myKey = buildWebChatKey(currentUser, currentSchool);
    const myName = currentUser?.name || '';
    const mySchool = currentSchool?.name || '';

    const checkIncomingChats = async () => {
      try {
        const roomRes = await fetch(
          `${SUPABASE_URL}/rest/v1/chat_rooms?select=*&order=updated_at.desc`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        if (!roomRes.ok) return;
        const roomRows = await roomRes.json();
        const myRooms = (Array.isArray(roomRows) ? roomRows : []).filter((r) => {
          const isUserA =
            r.user_a_key === myKey ||
            (r.user_a_name === myName && r.user_a_school === mySchool);
          const isUserB =
            r.user_b_key === myKey ||
            (r.user_b_name === myName && r.user_b_school === mySchool);
          return isUserA || isUserB;
        });

        if (myRooms.length === 0) {
          setUnreadChatCount(0);
          return;
        }

        const inFilter = myRooms.map((r) => `"${r.id}"`).join(',');
        const msgRes = await fetch(
          `${SUPABASE_URL}/rest/v1/chat_messages?select=*&room_id=in.(${encodeURIComponent(
            inFilter
          )})&order=created_at.asc`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        if (!msgRes.ok) return;
        const msgRows = await msgRes.json();

        let totalUnread = 0;
        const freshNotis = [];
        for (const m of Array.isArray(msgRows) ? msgRows : []) {
          const readBy = Array.isArray(m.read_by) ? m.read_by : [];
          const isUnreadPeer = m.sender_key !== myKey && !readBy.includes(myKey);
          if (!isUnreadPeer) continue;
          totalUnread += 1;

          // 현재 해당 채팅방을 전체화면으로 보고 있으면 벨 알림 추가 생략
          if (activeTab === 'chat' && isChatRoomOpen) continue;
          if (seenChatNotiIdsRef.current.has(m.id)) continue;

          seenChatNotiIdsRef.current.add(m.id);
          const roomInfo = myRooms.find((r) => r.id === m.room_id);
          const isUserA =
            roomInfo &&
            (roomInfo.user_a_key === myKey ||
              (roomInfo.user_a_name === myName && roomInfo.user_a_school === mySchool));
          const peerName = roomInfo
            ? (isUserA ? roomInfo.user_b_name : roomInfo.user_a_name) || m.sender_name
            : m.sender_name;

          freshNotis.push({
            id: `chat-noti-${m.id}`,
            title: `${peerName || '학생'}님의 1:1 채팅`,
            content: m.text,
            time: m.time_label || '방금 전',
            unread: true,
            roomId: m.room_id
          });
        }

        setUnreadChatCount(totalUnread);
        if (freshNotis.length > 0) {
          setNotifications((prev) => {
            const existing = new Set(prev.map((n) => n.id));
            const unique = freshNotis.filter((n) => !existing.has(n.id));
            return unique.length > 0 ? [...unique.reverse(), ...prev] : prev;
          });
        }
      } catch {}
    };

    checkIncomingChats();
    const timer = setInterval(checkIncomingChats, 2500);
    return () => clearInterval(timer);
  }, [isLoggedIn, currentUser?.name, currentUser?.username, currentSchool?.name, activeTab, isChatRoomOpen]);

  // 로컬스토리지 영구 저장 동기화
  useEffect(() => {
    localStorage.setItem('hightime_current_user_v2', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('hightime_current_school_v3', JSON.stringify(currentSchool));
  }, [currentSchool]);

  useEffect(() => {
    localStorage.setItem('hightime_major_posts_clean', JSON.stringify(majorPosts));
  }, [majorPosts]);

  useEffect(() => {
    localStorage.setItem('hightime_school_posts_clean', JSON.stringify(schoolPosts));
  }, [schoolPosts]);

  useEffect(() => {
    localStorage.setItem('hightime_counseling_data_clean', JSON.stringify(counselingData));
  }, [counselingData]);

  // 학교 및 학생 인증 완료 핸들러
  const handleCompleteAuth = (authData) => {
    setCurrentUser((prev) => ({
      ...prev,
      name: authData.name,
      nickname: prev?.nickname || `${authData.name}학생`,
      grade: authData.grade,
      isVerified: true,
      passVerified: authData.passVerified,
      certVerified: authData.certVerified,
      verifiedAt: authData.verifiedAt
    }));
    setCurrentSchool(authData.school);
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
  };

  // 프로필 탭에서 정보 수정 핸들러
  const handleUpdateProfile = (updated) => {
    setCurrentUser((prev) => ({
      ...prev,
      name: updated.name,
      nickname: updated.nickname,
      grade: updated.grade,
      targetMajor: updated.targetMajor,
      bio: updated.bio
    }));
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAuthModalOpen(true);
    setActiveTab('home');
  };

  // 전공 게시글 좋아요 토글 핸들러
  const handleToggleLike = (postId) => {
    setMajorPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const isLiked = post.isLikedByUser;
          return {
            ...post,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            isLikedByUser: !isLiked
          };
        }
        return post;
      })
    );

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) => ({
        ...prev,
        likes: prev.isLikedByUser ? prev.likes - 1 : prev.likes + 1,
        isLikedByUser: !prev.isLikedByUser
      }));
    }
  };

  // 새 전공 게시글 등록
  const handleAddMajorPost = (newPost) => {
    setMajorPosts([newPost, ...majorPosts]);
  };

  // 전공 게시글 삭제 핸들러
  const handleDeleteMajorPost = (postId) => {
    setMajorPosts((prev) => prev.filter((post) => post.id !== postId));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
    }
  };

  // 새 학교 게시글 등록
  const handleAddSchoolPost = (newPost) => {
    setSchoolPosts([newPost, ...schoolPosts]);
  };

  // 우리 학교 게시글 좋아요 토글
  const handleToggleSchoolLike = (postId) => {
    setSchoolPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextLiked = !post.isLikedByUser;
        const nextLikes = Math.max(0, (post.likes || 0) + (nextLiked ? 1 : -1));
        return { ...post, isLikedByUser: nextLiked, likes: nextLikes };
      })
    );
  };

  // 우리 학교 게시글 댓글 등록
  const handleAddSchoolComment = (postId, content, isAnonymous) => {
    const newComment = {
      id: `sc-${Date.now()}`,
      author: currentUser?.name || '학생',
      grade: currentUser?.grade || '고2',
      isAnonymous,
      content,
      createdAt: '방금 전'
    };
    setSchoolPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextComments = [...(post.comments || []), newComment];
        return {
          ...post,
          comments: nextComments,
          commentCount: nextComments.length
        };
      })
    );
  };

  // 우리 학교 게시글 댓글 삭제
  const handleDeleteSchoolComment = (postId, commentId) => {
    setSchoolPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextComments = (post.comments || []).filter((c) => c.id !== commentId);
        return {
          ...post,
          comments: nextComments,
          commentCount: nextComments.length
        };
      })
    );
  };

  // 우리 학교 게시글 삭제 핸들러
  const handleDeleteSchoolPost = (postId) => {
    setSchoolPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  // 게시글에 새 댓글 등록
  const handleAddComment = (postId, newComment) => {
    setMajorPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const updatedComments = [...(post.comments || []), newComment];
          return {
            ...post,
            comments: updatedComments,
            commentCount: updatedComments.length
          };
        }
        return post;
      })
    );

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) => {
        const updated = [...(prev.comments || []), newComment];
        return {
          ...prev,
          comments: updated,
          commentCount: updated.length
        };
      });
    }
  };

  // 댓글 삭제 핸들러 (사용자가 작성한 댓글 삭제)
  const handleDeleteComment = (postId, commentId) => {
    setMajorPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const updatedComments = (post.comments || []).filter((c) => c.id !== commentId);
          return {
            ...post,
            comments: updatedComments,
            commentCount: updatedComments.length
          };
        }
        return post;
      })
    );

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) => {
        const updated = (prev.comments || []).filter((c) => c.id !== commentId);
        return {
          ...prev,
          comments: updated,
          commentCount: updated.length
        };
      });
    }
  };

  // 특정 글에서 1:1 채팅 신청 시 메시지 작성 모달 오픈
  const handleQuickAsk = (post) => {
    if (selectedPost) setSelectedPost(null);
    setChatRequestText('');
    setChatRequestPost(post);
  };

  // 사용자가 직접 작성한 1:1 채팅 신청 메시지 전송 (Supabase 실시간 채팅방 생성/저장)
  const handleSendChatRequest = async (e) => {
    e.preventDefault();
    if (!chatRequestPost || !chatRequestText.trim()) return;
    const msgText = chatRequestText.trim();
    const myKey = buildWebChatKey(currentUser, currentSchool);
    const peerName = chatRequestPost.author.isAnonymous
      ? '익명 멘토'
      : chatRequestPost.author.nickname;
    const peerKey = buildWebChatKey({ name: peerName }, { name: chatRequestPost.author.school });
    const roomId = buildWebPairRoomId(myKey, peerKey);
    const nowTime = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    await sendChatMessageToSupabase({
      roomId,
      myKey,
      myName: currentUser.name,
      mySchool: currentSchool.name,
      peerKey,
      peerName,
      peerSchool: `${chatRequestPost.author.school} ${chatRequestPost.author.grade}`,
      text: msgText,
      time: nowTime
    });

    setChatRequestPost(null);
    setChatRequestText('');
    setActiveChatRoomId(roomId);
    setActiveTab('chat');
  };

  // 새 1:1 질문 등록
  const handleAddQuestion = (newQuestion) => {
    setCounselingData((prev) => ({
      ...prev,
      directQuestions: [newQuestion, ...prev.directQuestions]
    }));
  };

  // 새 입시 상담 등록
  const handleAddConsult = (newConsult) => {
    setCounselingData((prev) => ({
      ...prev,
      admissionConsults: [newConsult, ...prev.admissionConsults]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-start p-0 sm:py-6 selection:bg-red-500 selection:text-white">
      {/* 데스크톱 상단 프레젠테이션 안내 바 */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md px-2 pb-2 text-slate-400 text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>HighTime 고교타임 모바일 프로토타입</span>
        </div>
        <button
          onClick={() => setIsMobileFrame(!isMobileFrame)}
          className="text-[11px] hover:text-white underline"
        >
          {isMobileFrame ? '와이드 모드로 보기' : '모바일 프레임 모드로 보기'}
        </button>
      </div>

      {/* 스마트폰 뷰포트 컨테이너 (transform으로 내부 fixed 모달들도 폰 화면 안에 가둠) */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-slate-100 ${
          isMobileFrame
            ? 'max-w-[440px] sm:rounded-[36px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 sm:overflow-hidden min-h-screen sm:min-h-0 sm:h-[90vh] sm:max-h-[860px] sm:[transform:translateZ(0)]'
            : 'max-w-2xl min-h-screen shadow-lg'
        }`}
      >
        {/* 스마트폰 스피커/다이내믹 아일랜드 데코레이션 (모바일 프레임 모드일 때만) */}
        {isMobileFrame && (
          <div className="hidden sm:flex items-center justify-center pt-2 pb-1 bg-white">
            <div className="w-20 h-4 bg-slate-900 rounded-full" />
          </div>
        )}

        {/* 1. 상단 헤더 (1:1 채팅방 전체화면 진입 시 숨김) */}
        {!(activeTab === 'chat' && isChatRoomOpen) && (
          <Header
            currentUser={currentUser}
            currentSchool={currentSchool}
            isMobileFrame={isMobileFrame}
            setIsMobileFrame={setIsMobileFrame}
            unreadNotifications={unreadNotiCount}
            onOpenNotifications={() => setIsNotiModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* 2. 본문 화면 (활성 탭에 따른 라우팅 렌더링) */}
        <main className={`flex-1 ${activeTab === 'chat' && isChatRoomOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* 홈 탭 (종합 대시보드: 급식, 시간표, D-Day, 실시간 핫글, 추천 세특) */}
          {activeTab === 'home' && (
            <HomeDashboard
              currentUser={currentUser}
              currentSchool={currentSchool}
              majorPosts={majorPosts}
              schoolPosts={schoolPosts}
              onSelectPost={(post) => setSelectedPost(post)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenWriteModal={() => setIsWriteModalOpen(true)}
            />
          )}

          {activeTab === 'major' && (
            <MajorBoard
              posts={majorPosts}
              onSelectPost={(post) => setSelectedPost(post)}
              onOpenWriteModal={() => setIsWriteModalOpen(true)}
              onQuickAsk={handleQuickAsk}
              onToggleLike={handleToggleLike}
              onDeletePost={handleDeleteMajorPost}
            />
          )}

          {activeTab === 'school' && (
            <SchoolBoard
              currentSchool={currentSchool}
              currentUser={currentUser}
              schoolPosts={schoolPosts}
              onAddSchoolPost={handleAddSchoolPost}
              onDeleteSchoolPost={handleDeleteSchoolPost}
              onToggleSchoolLike={handleToggleSchoolLike}
              onAddSchoolComment={handleAddSchoolComment}
              onDeleteSchoolComment={handleDeleteSchoolComment}
              externalWriteOpen={isSchoolWriteOpen}
              onCloseExternalWrite={() => setIsSchoolWriteOpen(false)}
            />
          )}

          {/* 입시·1:1질문 탭 (기존 중간에서 4번째 탭으로 이동) */}
          {activeTab === 'counseling' && (
            <CounselingAndQA
              counselingData={counselingData}
              onAddQuestion={handleAddQuestion}
              onAddConsult={handleAddConsult}
              onNavigateToChat={() => setActiveTab('chat')}
              externalWriteTrigger={counselingWriteTrigger}
            />
          )}

          {activeTab === 'chat' && (
            <DirectChat
              currentUser={currentUser}
              currentSchool={currentSchool}
              initialRoomId={activeChatRoomId}
              onUnreadCountChange={setUnreadChatCount}
              onRoomOpenChange={setIsChatRoomOpen}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSection
              currentUser={currentUser}
              currentSchool={currentSchool}
              onUpdateProfile={handleUpdateProfile}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* 폰 프레임 안 오른쪽 밑 플로팅 + 글쓰기 버튼 (전공게시판 / 우리학교 / 입시·질문) */}
        {(activeTab === 'major' || activeTab === 'school' || activeTab === 'counseling') && (
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'school') {
                setIsSchoolWriteOpen(true);
              } else if (activeTab === 'counseling') {
                setCounselingWriteTrigger((c) => c + 1);
              } else {
                setIsWriteModalOpen(true);
              }
            }}
            aria-label="글 작성하기"
            title="글 작성하기"
            className="absolute bottom-[74px] right-4 z-20 w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 shadow-red-200 text-white flex items-center justify-center shadow-lg active:scale-95 transition"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* 3. 하단 탭 내비게이션 바 (1:1 채팅방 전체화면 진입 시 숨김) */}
        {!(activeTab === 'chat' && isChatRoomOpen) && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadChatCount={unreadChatCount}
          />
        )}

        {/* 4. 모달들 */}
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onAddComment={handleAddComment}
            onToggleLike={handleToggleLike}
            onQuickAsk={handleQuickAsk}
            onDeletePost={handleDeleteMajorPost}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {isWriteModalOpen && (
          <WritePostModal
            currentSchool={currentSchool}
            onClose={() => setIsWriteModalOpen(false)}
            onSubmitPost={handleAddMajorPost}
          />
        )}

        {isNotiModalOpen && (
          <NotificationModal
            isOpen={isNotiModalOpen}
            notifications={notifications}
            onClose={() => setIsNotiModalOpen(false)}
            onReadNotifications={() => setNotifications([])}
            onSelectNotification={(item) => {
              setNotifications((prev) => prev.filter((n) => n.id !== item.id));
              setIsNotiModalOpen(false);
              if (item.roomId) {
                setActiveChatRoomId(item.roomId);
                setActiveTab('chat');
              } else if (item.postId) {
                const targetPost = majorPosts.find((p) => p.id === item.postId);
                if (targetPost) setSelectedPost(targetPost);
              }
            }}
          />
        )}

        {/* 5. 고등학교 인증 및 로그인 모달 (앱 실행 시 로그인 전에는 항상 표시) */}
        <AuthModal
          isOpen={!isLoggedIn || isAuthModalOpen}
          onClose={() => {
            if (isLoggedIn) setIsAuthModalOpen(false);
          }}
          onCompleteAuth={handleCompleteAuth}
          initialUser={currentUser}
        />

        {/* 6. 전공게시판 1:1 채팅 신청 메시지 작성 모달 */}
        {chatRequestPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <form
              onSubmit={handleSendChatRequest}
              className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900">
                  1:1 채팅 신청 메시지 작성
                </h3>
                <button
                  type="button"
                  onClick={() => setChatRequestPost(null)}
                  className="text-xs text-slate-400 font-bold"
                >
                  닫기
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800">
                  받는 사람: {chatRequestPost.author.isAnonymous ? '익명 멘토' : chatRequestPost.author.nickname} ({chatRequestPost.author.school})
                </div>
                <div className="text-[11px] text-red-600 truncate mt-0.5">
                  관련 글: {chatRequestPost.title}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">보낼 메시지</label>
                <textarea
                  rows={4}
                  value={chatRequestText}
                  onChange={(e) => setChatRequestText(e.target.value)}
                  placeholder="상대방에게 보낼 1:1 질문 또는 채팅 메시지를 직접 작성해 주세요."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 resize-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChatRequestPost(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                >
                  메시지 보내기
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
