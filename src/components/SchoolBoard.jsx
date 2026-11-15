import React, { useState } from 'react';
import { School, ThumbsUp, MessageSquare, Plus, Tag, ShieldCheck, Megaphone, Trash2 } from 'lucide-react';

export default function SchoolBoard({
  currentSchool,
  schoolPosts,
  onAddSchoolPost,
  onDeleteSchoolPost
}) {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isWriteOpen, setIsWriteOpen] = useState(false);
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
      likes: 0,
      commentCount: 0,
      createdAt: '방금 전'
    };

    onAddSchoolPost(newPost);
    setNewTitle('');
    setNewContent('');
    setIsWriteOpen(false);
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-3">
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
            onClick={() => setIsWriteOpen(true)}
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

      {/* 3. 카테고리 탭 */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. 교내 게시글 목록 */}
      <div className="space-y-2.5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                {post.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">{post.createdAt}</span>
                {onDeleteSchoolPost && (
                  <button
                    onClick={() => {
                      if (window.confirm('정말 이 게시물을 삭제하시겠습니까?')) {
                        onDeleteSchoolPost(post.id);
                      }
                    }}
                    className="text-slate-300 hover:text-red-500 transition p-0.5"
                    title="게시물 삭제"
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
                <span className="flex items-center gap-1 text-slate-500">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {post.commentCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    onClick={() => setIsWriteOpen(false)}
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
    </div>
  );
}
