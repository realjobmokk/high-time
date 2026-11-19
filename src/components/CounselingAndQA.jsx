import React, { useState, useEffect } from 'react';
import { 
  MessageSquareHeart, 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Send, 
  ChevronRight, 
  GraduationCap, 
  BookMarked,
  MessageCircle,
  Award
} from 'lucide-react';

export default function CounselingAndQA({
  counselingData,
  onAddQuestion,
  onAddQuestionComment,
  onAddConsult,
  onNavigateToChat,
  externalWriteTrigger = 0
}) {
  const [subTab, setSubTab] = useState('direct'); // 'direct' (1:1 질문) or 'admission' (입시상담)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [expandedQId, setExpandedQId] = useState(null);
  const [qCommentInputs, setQCommentInputs] = useState({});

  const parseQComments = (answer, fallbackTime) => {
    if (!answer) return [];
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [{ id: 'legacy-answer', author: '멘토의 답변', content: answer, createdAt: fallbackTime || '방금 전' }];
  };

  // 외부 플로팅 + 버튼 클릭 시 현재 서브탭에 맞는 작성 모달 열기
  useEffect(() => {
    if (externalWriteTrigger > 0) {
      if (subTab === 'direct') {
        setIsQuestionModalOpen(true);
      } else {
        setIsConsultModalOpen(true);
      }
    }
  }, [externalWriteTrigger]);

  // 입시 질문 게시판 폼 상태
  const [qTarget, setQTarget] = useState('수시/학종');
  const [qTopic, setQTopic] = useState('');
  const [qContent, setQContent] = useState('');
  const [qIsPublic, setQIsPublic] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const Q_CATEGORIES = ['전체', '수시/학종', '정시/수능', '생기부/세특', '내신/공부법', '대학/학과선택'];

  // 입시 상담 폼 상태
  const [cCategory, setCCategory] = useState('학생부종합(학종)');
  const [cMajor, setCMajor] = useState('');
  const [cSchool, setCSchool] = useState('');
  const [cGrade, setCGrade] = useState('');
  const [cTitle, setCTitle] = useState('');
  const [cContent, setCContent] = useState('');

  // 1:1 질문 제출
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (!qTopic.trim() || !qContent.trim()) return;

    const newQuestion = {
      id: `dq-${Date.now()}`,
      targetAuthor: qTarget,
      topic: qTopic.trim(),
      question: qContent.trim(),
      answer: null, // 초기 답변 대기 상태
      status: '답변대기중',
      createdAt: '방금 전',
      answeredAt: null,
      isPublic: qIsPublic
    };

    onAddQuestion(newQuestion);
    setQTopic('');
    setQContent('');
    setIsQuestionModalOpen(false);
  };

  // 입시 상담 제출
  const handleConsultSubmit = (e) => {
    e.preventDefault();
    if (!cTitle.trim() || !cContent.trim()) return;

    const newConsult = {
      id: `ac-${Date.now()}`,
      category: cCategory,
      targetMajor: cMajor || '미정',
      targetSchool: cSchool || '목표대학 기재',
      gradeAverage: cGrade || '내신 미기재',
      title: cTitle.trim(),
      content: cContent.trim(),
      expertAdvice: '상담 요청이 등록되었습니다. 전공 입시 전문 멘토진이 생기부 분석 후 24시간 내 맞춤 조언을 작성해드립니다.',
      expertName: '하이타임 입시지원단 멘토',
      status: '상담대기중',
      createdAt: '방금 전'
    };

    onAddConsult(newConsult);
    setCTitle('');
    setCContent('');
    setCMajor('');
    setCSchool('');
    setCGrade('');
    setIsConsultModalOpen(false);
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-3">
      {/* 1. 상단 전환 탭 (입시 질문 게시판 vs 입시 상담 라운지) */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl">
        <button
          onClick={() => setSubTab('direct')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'direct'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>입시 질문 게시판 ({counselingData.directQuestions.length})</span>
        </button>
        <button
          onClick={() => setSubTab('admission')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'admission'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>입시 상담소 ({counselingData.admissionConsults.length})</span>
        </button>
      </div>

      {/* 2. 서브 탭 1: 입시 질문 게시판 */}
      {subTab === 'direct' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-red-500 to-rose-600 p-3.5 rounded-2xl text-white shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-red-100 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>수시 · 정시 · 생기부 · 내신 입시 Q&A</span>
              </div>
              <h3 className="text-sm font-bold mt-0.5">입시 질문 게시판</h3>
              <p className="text-[11px] text-red-100">궁금한 입시 전형이나 생기부 질문을 자유롭게 올려보세요</p>
            </div>
          </div>

          {/* 카테고리 필터 (한 줄 가로 스크롤/드래그) */}
          <div className="flex gap-1.5 overflow-x-auto flex-nowrap pb-1">
            {Q_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 질문 목록 */}
          <div className="space-y-3">
            {counselingData.directQuestions.filter((q) =>
              selectedCategory === '전체' ? true : q.targetAuthor === selectedCategory
            ).length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 font-bold">
                아직 등록된 입시 질문 게시글이 없습니다.
              </div>
            ) : (
              counselingData.directQuestions
                .filter((q) =>
                  selectedCategory === '전체' ? true : q.targetAuthor === selectedCategory
                )
                .map((q) => {
                  const comments = parseQComments(q.answer, q.answeredAt);
                  const isExpanded = expandedQId === q.id;
                  const draft = qCommentInputs[q.id] || '';
                  return (
                  <div
                    key={q.id}
                    onClick={() => setExpandedQId(isExpanded ? null : q.id)}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:border-slate-300 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        {q.targetAuthor}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === '답변완료'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {q.status}
                        </span>
                        <span className="text-[10px] text-slate-400">{q.createdAt}</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 mb-1">
                      Q. {q.topic}
                    </h4>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-2 leading-relaxed">
                      {q.question}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span>💬 댓글 {comments.length}개</span>
                      <span className="text-red-500">{isExpanded ? '접기 ▲' : '터치해서 댓글 쓰기 ▼'}</span>
                    </div>

                    {isExpanded && (
                      <div
                        className="mt-3 pt-3 border-t border-slate-100 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {comments.length === 0 ? (
                          <p className="text-[11px] text-slate-400">
                            아직 답변이 없습니다. 첫 댓글을 남겨보세요!
                          </p>
                        ) : (
                          comments.map((c) => (
                            <div
                              key={c.id}
                              className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 text-xs"
                            >
                              <div className="text-[11px] text-emerald-800 font-bold mb-0.5">
                                {c.author}
                                {c.grade ? ` (${c.grade})` : ''} · {c.createdAt}
                              </div>
                              <p className="text-slate-700 leading-relaxed">{c.content}</p>
                            </div>
                          ))
                        )}

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = draft.trim();
                            if (!trimmed) return;
                            onAddQuestionComment?.(q.id, trimmed);
                            setQCommentInputs((prev) => ({ ...prev, [q.id]: '' }));
                          }}
                          className="flex items-center gap-1.5 pt-1"
                        >
                          <input
                            type="text"
                            value={draft}
                            onChange={(e) =>
                              setQCommentInputs((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="답변이나 댓글을 입력하세요..."
                            className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0"
                          >
                            등록
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* 3. 서브 탭 2: 입시 상담소 */}
      {subTab === 'admission' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3.5 rounded-2xl text-white shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>수시 / 정시 / 학종 생기부 솔루션</span>
              </div>
              <h3 className="text-sm font-bold mt-0.5">맞춤형 고교 입시 컨설팅 라운지</h3>
              <p className="text-[11px] text-slate-300">내신 등급 및 목표 학과별 합격 전략 분석</p>
            </div>
          </div>

          {/* 입시 상담 피드 */}
          <div className="space-y-3">
            {counselingData.admissionConsults.map((consult) => (
              <div
                key={consult.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5"
              >
                {/* 메타 태그 */}
                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                      {consult.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {consult.gradeAverage}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{consult.createdAt}</span>
                </div>

                {/* 목표 대학 & 학과 */}
                <div className="bg-slate-50 p-2 rounded-xl text-xs flex items-center justify-between border border-slate-100">
                  <span className="text-slate-500">목표 대학/전공:</span>
                  <span className="font-bold text-slate-800">
                    {consult.targetSchool} · {consult.targetMajor}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 leading-snug">
                  {consult.title}
                </h4>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {consult.content}
                </p>

                {/* 전문가 맞춤 조언 */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs mt-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>{consult.expertName}의 분석 코칭</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-normal">
                    {consult.expertAdvice}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 입시 질문 게시판 글쓰기 모달 */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-red-500" />
              입시 질문 게시판 글쓰기
            </h3>
            <form onSubmit={handleQuestionSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">질문 카테고리</label>
                <select
                  value={qTarget}
                  onChange={(e) => setQTarget(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
                >
                  {Q_CATEGORIES.filter((c) => c !== '전체').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">질문 제목</label>
                <input
                  type="text"
                  placeholder="예: 일반고 2.1등급 컴공 학종 vs 교과 어디가 유리할까요?"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">질문 상세 내용</label>
                <textarea
                  rows={4}
                  placeholder="궁금한 교과 내용, 세특 주제 피드백, 준비 과정 등을 자세하게 적어주세요."
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={qIsPublic}
                    onChange={(e) => setQIsPublic(e.target.checked)}
                    className="rounded text-red-500"
                  />
                  <span>다른 학생에게도 질문/답변 공개하기</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuestionModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                  >
                    질문 등록
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 입시 상담 신청 모달 */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-red-500" />
              맞춤 입시 상담 신청서
            </h3>
            <form onSubmit={handleConsultSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">희망 전형</label>
                <select
                  value={cCategory}
                  onChange={(e) => setCCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="학생부종합(학종)">학생부종합(학종)</option>
                  <option value="학생부교과(내신중심)">학생부교과(내신중심)</option>
                  <option value="정시(수능위주)">정시(수능위주)</option>
                  <option value="논술전형">논술전형</option>
                  <option value="특기자/면접">특기자/면접</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">목표 학과</label>
                  <input
                    type="text"
                    placeholder="예: 컴퓨터공학"
                    value={cMajor}
                    onChange={(e) => setCMajor(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">목표 대학</label>
                  <input
                    type="text"
                    placeholder="예: 서울대/연세대"
                    value={cSchool}
                    onChange={(e) => setCSchool(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">내신 / 모의고사 등급</label>
                <input
                  type="text"
                  placeholder="예: 일반고 전교과 1.6등급 / 6모 국수영탐 1211"
                  value={cGrade}
                  onChange={(e) => setCGrade(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">상담 제목</label>
                <input
                  type="text"
                  placeholder="예: 2학년 세특 전공적합성 보완 방법 문의"
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">상담 세부 고민</label>
                <textarea
                  rows={4}
                  placeholder="현재 생기부 강점과 약점, 전형 선택에 대한 고민을 구체적으로 적어주세요."
                  value={cContent}
                  onChange={(e) => setCContent(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConsultModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                >
                  상담 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
