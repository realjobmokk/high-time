import React, { useState } from 'react';
import { X, Sparkles, Send, Globe2, School } from 'lucide-react';
import { MAJOR_CATEGORIES, POST_TAGS } from '../data/mockData';

export default function WritePostModal({
  currentSchool,
  onClose,
  onSubmitPost
}) {
  const [majorId, setMajorId] = useState('cs_tech');
  const [tag, setTag] = useState('세특/탐구주제');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [nickname, setNickname] = useState('열정고딩2');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const selectedMajor = MAJOR_CATEGORIES.find((m) => m.id === majorId);

    const newPost = {
      id: `post-${Date.now()}`,
      majorId,
      majorName: selectedMajor ? selectedMajor.name : '기타 전공',
      tag,
      title: title.trim(),
      content: content.trim(),
      author: {
        nickname: isAnonymous ? '익명' : nickname,
        school: currentSchool.name,
        grade: '고2',
        isAnonymous,
        avatarColor: 'bg-red-500',
        isMine: true // 내가 쓴 글 표시
      },
      likes: 1,
      commentCount: 0,
      scraps: 0,
      createdAt: '방금 전',
      comments: []
    };

    onSubmitPost(newPost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* 헤더 */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <Globe2 className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-xs text-slate-900">전국 전공 공유 라운지에 글쓰기</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 바디 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* 전공 계열 선택 */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              관련 전공 / 계열 선택
            </label>
            <select
              value={majorId}
              onChange={(e) => setMajorId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-medium"
            >
              {MAJOR_CATEGORIES.filter(m => m.id !== 'all').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 태그 선택 */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              탐구 분류 태그
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POST_TAGS.filter(t => t !== '전체').map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                    tag === t
                      ? 'bg-red-500 text-white border-red-500 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              제목
            </label>
            <input
              type="text"
              placeholder="예: [컴공 세특] 생성형 AI 환각 완화 알고리즘 탐구 보고서"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
              required
            />
          </div>

          {/* 본문 */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              탐구 내용 및 정보 공유
            </label>
            <textarea
              rows={6}
              placeholder="탐구한 배경, 가설, 사용한 도서/논문, 느낀 점, 교과 연계성 등을 자세히 적어주세요. 전국 친구들과 의미 있는 피드백을 주고받을 수 있습니다."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none leading-relaxed"
              required
            />
          </div>

          {/* 작성자 정보 안내 */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-slate-500" />
              <span>소속: <strong>{currentSchool.name} (고2)</strong></span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded text-red-500"
              />
              <span className="text-[11px]">익명으로 올리기</span>
            </label>
          </div>

          {/* 버튼 영역 */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-200 active:scale-95 transition flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>게시글 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
