import React, { useState, useEffect } from 'react';
import { School, ThumbsUp, MessageSquare, Plus, ShieldCheck, Megaphone, Trash2, X, Send } from 'lucide-react';

export default function SchoolBoard({
  currentSchool,
  currentUser,
  schoolPosts,
  onAddSchoolPost,
  onDeleteSchoolPost,
  onToggleSchoolLike,
  onAddSchoolComment,
  onDeleteSchoolComment,
  externalWriteOpen = false,
  onCloseExternalWrite
}) {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isCommentAnon, setIsCommentAnon] = useState(true);

  const selectedPost = schoolPosts.find((p) => p.id === selectedPostId) || null;

  const openWriteModalWithCategory = () => {
    setNewCategory(activeCategory !== '전체' ? activeCategory : '자유게시판');
    setIsWriteOpen(true);
  };

  useEffect(() => {
    if (externalWriteOpen) {
      openWriteModalWithCategory();
    }
  }, [externalWriteOpen]);

  const closeWriteModal = () => {
    setIsWriteOpen(false);
    onCloseExternalWrite?.();
  };
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('자유게시판');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const categories = ['전체', '자유게시판', '정보/세특', '동아리', '분실물'];

  const filteredPosts = schoolPosts.filter(
    (post) => activeCategory === '전체' || post.category === activeCategory
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost = {
      id: `sp-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      author: isAnonymous ? '익명' : '나(학생)',
      grade: '고2',
      isAnonymous,
      isMine: true, // 내가 작성한 교내 글
      likes: 0,
      commentCount: 0,
      createdAt: '방금 전'
    };

    onAddSchoolPost(newPost);
    setNewTitle('');
    setNewContent('');
    closeWriteModal();
  };

  return (
    <div className="min-h-full bg-white pt-2 pb-6 px-4 flex flex-col gap-3">
      {/* 1. 소속 학교 전용 안내 헤더 */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900">{currentSchool.name} 라운지</h2>
                <span className="flex items-center gap-0.5 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.2 rounded-full font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  재학생 인증됨
                </span>
              </div>
              <p className="text-xs text-slate-500">{currentSchool.region} · 교내 비공개 커뮤니티</p>
            </div>
          </div>
          
          <button
            onClick={openWriteModalWithCategory}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>글쓰기</span>
          </button>
        </div>
      </div>

      {/* 2. 교내 공지사항 핀 배너 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
        <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold mr-1">[학생회 공지]</span>
          <span>이번 주 금요일 교내 동아리 발표회 부스 배치도가 본관 1층 로비에 게시되었습니다!</span>
        </div>
      </div>

      {/* 3. 카테고리 탭 (가로 5등분 균등 분할 바) */}
      <div className="grid grid-cols-5 bg-white rounded-xl border border-slate-200 divide-x divide-slate-200 overflow-hidden shadow-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`py-2.5 text-[11px] font-bold text-center truncate transition ${
              activeCategory === cat
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. 교내 게시글 목록 */}
      {filteredPosts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-2.5">
            <School className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-600">이 카테고리에 게시글이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            우리 학교 친구들과 첫 이야기를 나누어 보세요!
          </p>
          <button
            type="button"
            onClick={openWriteModalWithCategory}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition"
          >
            첫 글 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelectedPostId(post.id)}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                  {post.category}
                </span>
                {post.isMine && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-600 border border-red-200">
                    내 글
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{post.createdAt}</span>
                {/* 오직 사용자가 작성한 글(isMine)에만 삭제 버튼 노출 */}
                {post.isMine && onDeleteSchoolPost && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('정말 내가 작성한 이 게시물을 삭제하시겠습니까?')) {
                        onDeleteSchoolPost(post.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 transition p-0.5"
                    title="내 게시물 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-sm mb-1">{post.title}</h3>
            <p className="text-xs text-slate-600 line-clamp-2 mb-2.5">{post.content}</p>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
              <span className="font-medium text-slate-600">
                {post.isAnonymous ? '익명' : post.author} · {post.grade}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSchoolLike?.(post.id);
                  }}
                  className={`flex items-center gap-1 transition ${
                    post.isLikedByUser ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-red-500'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${post.isLikedByUser ? 'fill-red-600' : ''}`} />
                  {post.likes}
                </button>
                <span className="flex items-center gap-1 text-slate-500">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {post.comments ? post.comments.length : post.commentCount}
                </span>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* 5. 교내 글쓰기 모달 */}
      {isWriteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-3 pb-2 border-b border-slate-100">
              {currentSchool.name} 게시판에 글쓰기
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">카테고리</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {categories.filter(c => c !== '전체').map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`py-1.5 rounded-lg text-xs font-medium border text-center ${
                        newCategory === cat ? 'bg-red-50 border-red-500 text-red-600 font-bold' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
                  required
                />
              </div>

              <div>
                <textarea
                  rows={4}
                  placeholder="우리 학교 친구들과 나눌 이야기를 자유롭게 적어보세요."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-red-500 focus:ring-red-400"
                  />
                  <span>익명으로 게시하기</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeWriteModal}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                  >
                    등록
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. 우리학교 게시글 상세 & 좋아요/댓글 모달 */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[86vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-slate-900">우리학교 게시글</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedPostId(null);
                  setCommentText('');
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                  {selectedPost.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedPost.isAnonymous ? '익명' : selectedPost.author} · {selectedPost.grade} · {selectedPost.createdAt}
                </span>
              </div>

              <h4 className="text-base font-black text-slate-900">{selectedPost.title}</h4>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </p>

              <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                <button
                  type="button"
                  onClick={() => onToggleSchoolLike?.(selectedPost.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border transition ${
                    selectedPost.isLikedByUser
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${selectedPost.isLikedByUser ? 'fill-white' : ''}`} />
                  공감 {selectedPost.likes}
                </button>
                <span className="text-xs font-bold text-slate-500">
                  댓글 {(selectedPost.comments || []).length}개
                </span>
              </div>

              <div className="space-y-2">
                {(selectedPost.comments || []).length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                  </p>
                ) : (
                  (selectedPost.comments || []).map((c) => {
                    const isMyComment = c.author === (currentUser?.name || '학생');
                    return (
                      <div key={c.id} className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">
                            {c.isAnonymous ? '익명' : c.author} · {c.grade}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                            {isMyComment && (
                              <button
                                type="button"
                                onClick={() => onDeleteSchoolComment?.(selectedPost.id, c.id)}
                                className="text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-700 leading-snug">{c.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = commentText.trim();
                if (!trimmed) return;
                onAddSchoolComment?.(selectedPost.id, trimmed, isCommentAnon);
                setCommentText('');
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
            >
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCommentAnon}
                  onChange={(e) => setIsCommentAnon(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-400"
                />
                익명
              </label>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
