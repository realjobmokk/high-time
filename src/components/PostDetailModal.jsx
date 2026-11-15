import React, { useState } from 'react';
import { 
  X, 
  ThumbsUp, 
  Bookmark, 
  Share2, 
  MessageSquare, 
  HelpCircle, 
  Send, 
  Check, 
  School,
  Lock,
  Trash2
} from 'lucide-react';

export default function PostDetailModal({
  post,
  onClose,
  onAddComment,
  onToggleLike,
  onQuickAsk,
  onDeletePost
}) {
  const [commentText, setCommentText] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  // 게시글 삭제 핸들러 (확인 팝업 포함)
  const handleDelete = () => {
    if (window.confirm('정말 이 게시물을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) {
      if (onDeletePost) {
        onDeletePost(post.id);
      }
      onClose();
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: {
        nickname: isAnonymousComment ? `익명${(post.comments?.length || 0) + 1}` : '나(학생)',
        school: '내 학교',
        grade: '고2',
        isAnonymous: isAnonymousComment
      },
      content: commentText.trim(),
      createdAt: '방금 전',
      likes: 0
    };

    onAddComment(post.id, newComment);
    setCommentText('');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* 모달 상단 헤더 */}
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-100 text-red-600">
              {post.majorName}
            </span>
            <span className="text-xs text-slate-400 font-semibold">#{post.tag}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* 게시글 삭제 버튼 */}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
              title="게시물 삭제하기"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 작성자 프로필 바 */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full ${post.author.avatarColor || 'bg-slate-400'} text-white flex items-center justify-center font-bold text-xs`}>
                {post.author.isAnonymous ? '익명' : post.author.nickname.substring(0, 1)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">
                    {post.author.isAnonymous ? '익명' : post.author.nickname}
                  </span>
                  <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 rounded">
                    {post.author.grade}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <School className="w-3 h-3 text-slate-400" />
                  <span>{post.author.school}</span>
                  <span>·</span>
                  <span>{post.createdAt}</span>
                </div>
              </div>
            </div>

            {/* 1:1 질문 연결 버튼 */}
            <button
              onClick={() => onQuickAsk(post)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition border border-red-200 active:scale-95"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>작성자에게 1:1 질문</span>
            </button>
          </div>

          {/* 제목 및 내용 */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-snug mb-3">
              {post.title}
            </h2>
            <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed space-y-2">
              {post.content}
            </div>
          </div>

          {/* 인터랙션 액션 바 (공감, 스크랩, 공유) */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleLike(post.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 text-xs font-bold transition"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>공감 {post.likes}</span>
              </button>
              <button
                onClick={() => alert('해당 글이 스크랩함에 저장되었습니다!')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>스크랩 {post.scraps || 0}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '링크 복사됨' : '공유'}</span>
            </button>
          </div>

          {/* 댓글 목록 */}
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>댓글 {post.comments?.length || 0}개</span>
            </div>

            <div className="space-y-2.5">
              {(post.comments || []).map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{c.author.isAnonymous ? '익명' : c.author.nickname}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({c.author.school} · {c.author.grade})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{c.createdAt}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 댓글 작성 폼 (하단 고정) */}
        <form onSubmit={handleCommentSubmit} className="p-2.5 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymousComment}
                onChange={(e) => setIsAnonymousComment(e.target.checked)}
                className="rounded text-red-500"
              />
              <span>익명 댓글</span>
            </label>
            <span className="text-[10px] text-slate-400">타 학교 학생과의 예의를 지켜주세요</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 남겨보세요..."
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-slate-400"
            />
            <button
              type="submit"
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
