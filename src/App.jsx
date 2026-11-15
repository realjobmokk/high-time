import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MajorBoard from './components/MajorBoard';
import SchoolBoard from './components/SchoolBoard';
import CounselingAndQA from './components/CounselingAndQA';
import SchoolLife from './components/SchoolLife';
import DirectChat from './components/DirectChat';
import PostDetailModal from './components/PostDetailModal';
import WritePostModal from './components/WritePostModal';
import NotificationModal from './components/NotificationModal';

import { 
  SAMPLE_SCHOOLS, 
  INITIAL_MAJOR_POSTS, 
  INITIAL_SCHOOL_POSTS, 
  INITIAL_COUNSELING_DATA 
} from './data/mockData';

export default function App() {
  // 1. 소속 학교 상태 (기본: 하나고등학교)
  const [currentSchool, setCurrentSchool] = useState(() => {
    const saved = localStorage.getItem('hightime_current_school');
    return saved ? JSON.parse(saved) : SAMPLE_SCHOOLS[1];
  });

  // 2. 활성 탭 상태 ('major' | 'school' | 'counseling' | 'schoolLife' | 'chat')
  const [activeTab, setActiveTab] = useState('major');

  // 3. 전국 전공 게시판 글 목록 상태 (로컬스토리지 연동 및 작성자 식별)
  const [majorPosts, setMajorPosts] = useState(() => {
    const saved = localStorage.getItem('hightime_major_posts');
    if (!saved) return INITIAL_MAJOR_POSTS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((p) => {
        if (p.id === 'post-1') {
          return {
            ...p,
            author: { ...p.author, isMine: true },
            comments: (p.comments || []).map((c) => c.id === 'c-2' ? { ...c, isMine: true } : c)
          };
        }
        return p;
      });
    } catch {
      return INITIAL_MAJOR_POSTS;
    }
  });

  // 4. 우리 학교 전용 게시판 글 목록 상태
  const [schoolPosts, setSchoolPosts] = useState(() => {
    const saved = localStorage.getItem('hightime_school_posts');
    if (!saved) return INITIAL_SCHOOL_POSTS;
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((p) => (p.id === 'sp-1' ? { ...p, isMine: true } : p));
    } catch {
      return INITIAL_SCHOOL_POSTS;
    }
  });

  // 5. 1:1 질문 및 입시 상담 데이터 상태
  const [counselingData, setCounselingData] = useState(() => {
    const saved = localStorage.getItem('hightime_counseling_data');
    return saved ? JSON.parse(saved) : INITIAL_COUNSELING_DATA;
  });

  // 6. UI 모달 및 프레임 상태
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);
  const [unreadNotiCount, setUnreadNotiCount] = useState(2);
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // 로컬스토리지 영구 저장 동기화
  useEffect(() => {
    localStorage.setItem('hightime_current_school', JSON.stringify(currentSchool));
  }, [currentSchool]);

  useEffect(() => {
    localStorage.setItem('hightime_major_posts', JSON.stringify(majorPosts));
  }, [majorPosts]);

  useEffect(() => {
    localStorage.setItem('hightime_school_posts', JSON.stringify(schoolPosts));
  }, [schoolPosts]);

  useEffect(() => {
    localStorage.setItem('hightime_counseling_data', JSON.stringify(counselingData));
  }, [counselingData]);

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

  // 특정 글에서 바로 1:1 질문 연결
  const handleQuickAsk = (post) => {
    if (selectedPost) setSelectedPost(null);
    setActiveTab('counseling');
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

      {/* 스마트폰 뷰포트 컨테이너 */}
      <div
        className={`w-full transition-all duration-300 relative flex flex-col bg-slate-100 ${
          isMobileFrame
            ? 'max-w-[440px] sm:rounded-[36px] sm:shadow-2xl sm:border-[6px] sm:border-slate-800 sm:overflow-hidden min-h-[92vh]'
            : 'max-w-2xl min-h-screen shadow-lg'
        }`}
      >
        {/* 스마트폰 스피커/다이내믹 아일랜드 데코레이션 (모바일 프레임 모드일 때만) */}
        {isMobileFrame && (
          <div className="hidden sm:flex items-center justify-center pt-2 pb-1 bg-white">
            <div className="w-20 h-4 bg-slate-900 rounded-full" />
          </div>
        )}

        {/* 1. 상단 헤더 */}
        <Header
          currentSchool={currentSchool}
          setCurrentSchool={setCurrentSchool}
          isMobileFrame={isMobileFrame}
          setIsMobileFrame={setIsMobileFrame}
          unreadNotifications={unreadNotiCount}
          onOpenNotifications={() => setIsNotiModalOpen(true)}
        />

        {/* 2. 본문 화면 (활성 탭에 따른 라우팅 렌더링) */}
        <main className="flex-1 overflow-y-auto">
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
              schoolPosts={schoolPosts}
              onAddSchoolPost={handleAddSchoolPost}
              onDeleteSchoolPost={handleDeleteSchoolPost}
            />
          )}

          {activeTab === 'counseling' && (
            <CounselingAndQA
              counselingData={counselingData}
              onAddQuestion={handleAddQuestion}
              onAddConsult={handleAddConsult}
              onNavigateToChat={() => setActiveTab('chat')}
            />
          )}

          {activeTab === 'schoolLife' && (
            <SchoolLife currentSchool={currentSchool} />
          )}

          {activeTab === 'chat' && (
            <DirectChat />
          )}
        </main>

        {/* 3. 하단 탭 내비게이션 바 */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadChatCount={1}
        />

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
            onClose={() => setIsNotiModalOpen(false)}
            onReadNotifications={() => setUnreadNotiCount(0)}
          />
        )}
      </div>
    </div>
  );
}
