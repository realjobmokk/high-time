import React, { useState } from 'react';
import { 
  Search, 
  PenSquare, 
  ThumbsUp, 
  MessageSquare, 
  Bookmark, 
  HelpCircle, 
  Filter, 
  Sparkles,
  Code,
  HeartPulse,
  Cpu,
  TrendingUp,
  Scale,
  BookOpen,
  GraduationCap,
  Palette,
  ExternalLink,
  Flame,
  Globe2,
  Trash2
} from 'lucide-react';
import { MAJOR_CATEGORIES, POST_TAGS } from '../data/mockData';

// 아이콘 매핑 헬퍼 함수
const getMajorIcon = (iconName) => {
  switch (iconName) {
    case 'Code': return <Code className="w-4 h-4" />;
    case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
    case 'Cpu': return <Cpu className="w-4 h-4" />;
    case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
    case 'Scale': return <Scale className="w-4 h-4" />;
    case 'BookOpen': return <BookOpen className="w-4 h-4" />;
    case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
    case 'Palette': return <Palette className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

export default function MajorBoard({
  posts,
  onSelectPost,
  onOpenWriteModal,
  onQuickAsk,
  onToggleLike,
  onDeletePost
}) {
  const [selectedMajor, setSelectedMajor] = useState('all');
  const [selectedTag, setSelectedTag] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // 전공, 태그, 검색어로 게시글 필터링
  const filteredPosts = posts.filter((post) => {
    const matchMajor = selectedMajor === 'all' || post.majorId === selectedMajor;
    const matchTag = selectedTag === '전체' || post.tag === selectedTag;
    const matchSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.school.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMajor && matchTag && matchSearch;
  });

  return (
    <div className="pb-24 pt-2">
      {/* 1. 전국 고교 전공 교류 안내 배너 */}
      <div className="mx-4 mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 text-white shadow-md shadow-red-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-100">
            <Globe2 className="w-3.5 h-3.5 text-white" />
            <span>전국 고교생 통합 전공 네트워크</span>
          </div>
          <h2 className="text-sm font-bold mt-0.5 leading-snug">
            타 학교 친구들과 세특·탐구·진로를 공유하세요!
          </h2>
          <p className="text-[11px] text-red-100 mt-0.5">
            전공별 깊이 있는 탐구보고서 & 1:1 질문 교류
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl text-center">
          <Flame className="w-5 h-5 text-amber-200 mx-auto animate-bounce" />
          <span className="text-[10px] font-bold block mt-0.5">HOT</span>
        </div>
      </div>

      {/* 2. 전공/계열별 수평 스크롤 탭 */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-red-500" />
            희망 전공·계열 선택
          </span>
          <span className="text-[11px] text-slate-400">
            {selectedMajor === 'all' ? '전체 계열' : MAJOR_CATEGORIES.find(m => m.id === selectedMajor)?.name}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {MAJOR_CATEGORIES.map((category) => {
            const isSelected = selectedMajor === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedMajor(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-medium'
                }`}
              >
                {getMajorIcon(category.icon)}
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 검색창 및 세부 태그 필터 */}
      <div className="px-4 mb-3 space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="탐구주제, 세특, 학교명, 키워드 검색..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-800 placeholder-slate-400 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* 태그 필터 칩 */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {POST_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-red-500 text-white font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. 게시글 목록 */}
      <div className="px-4 space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-2">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">해당 조건의 게시글이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">첫 번째 탐구 보고서나 세특 질문을 남겨보세요!</p>
            <button
              onClick={onOpenWriteModal}
              className="mt-4 px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-red-600"
            >
              글 작성하러 가기
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-red-200 hover:shadow-md transition cursor-pointer relative group"
              onClick={() => onSelectPost(post)}
            >
              {/* 상단 메타 정보 (전공 분류, 태그, 작성자 학교) */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                    {post.majorName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                    #{post.tag}
                  </span>
                  {post.author.isMine && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-600 border border-red-200">
                      내 글
                    </span>
                  )}
                </div>
                
                {/* 작성자 학교 및 학년 뱃지 + (내 글일 때만) 게시글 삭제 버튼 */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 text-[11px] text-slate-600 font-medium">
                    <span className="font-semibold text-slate-800">{post.author.school}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-red-500 font-bold">{post.author.grade}</span>
                  </div>
                  {/* 오직 사용자가 작성한 게시글(isMine)에만 삭제 버튼 노출 */}
                  {post.author.isMine && onDeletePost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('정말 내가 작성한 이 게시물을 삭제하시겠습니까?')) {
                          onDeletePost(post.id);
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="내 게시물 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 제목 */}
              <h3 className="font-bold text-slate-900 text-sm mb-1.5 leading-snug group-hover:text-red-600 transition">
                {post.title}
              </h3>

              {/* 본문 미리보기 */}
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                {post.content}
              </p>

              {/* 하단 바: 작성자 닉네임, 시간, 인터랙션 및 1:1 질문 연결 버튼 */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span className="font-semibold text-slate-700">
                    {post.author.isAnonymous ? '익명' : post.author.nickname}
                  </span>
                  <span>·</span>
                  <span>{post.createdAt}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* 좋아요 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLike(post.id);
                    }}
                    className="flex items-center gap-1 text-slate-500 hover:text-red-500 text-[11px] transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{post.likes}</span>
                  </button>

                  {/* 댓글 */}
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.commentCount}</span>
                  </div>

                  {/* 1:1 질문 신청 퀵 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAsk(post);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[10px] transition"
                    title="이 글 작성자에게 1:1 질문하기"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>1:1 질문</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 플로팅 글쓰기 버튼 (Floating Action Button) */}
      <button
        onClick={onOpenWriteModal}
        className="fixed bottom-20 right-4 z-20 flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full shadow-lg shadow-red-300 hover:shadow-xl active:scale-95 transition font-bold text-xs"
      >
        <PenSquare className="w-4 h-4" />
        <span>글쓰기</span>
      </button>
    </div>
  );
}
