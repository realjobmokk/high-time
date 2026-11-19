// HighTime (고교타임) 웹 버전 카테고리 및 초기 빈 상태 정의
// (학교 정보는 하드코딩하지 않고 로그인 시 나이스(NEIS) 학교검색 API로 실시간 조회하여 사용)

// 1. 전공 / 진로 카테고리 목록
export const MAJOR_CATEGORIES = [
  { id: 'all', name: '전체 전공', icon: 'Sparkles', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { id: 'cs_tech', name: '컴퓨터·IT·인공지능', icon: 'Code', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 'med_bio', name: '의약학·생명공학', icon: 'HeartPulse', color: 'bg-rose-50 text-rose-600 border-rose-200' },
  { id: 'nat_eng', name: '자연과학·기계전자', icon: 'Cpu', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 'biz_econ', name: '경영·경제·통계', icon: 'TrendingUp', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 'social_law', name: '사회과학·미디어·법', icon: 'Scale', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 'hum_lang', name: '인문학·어문·철학', icon: 'BookOpen', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { id: 'edu', name: '교육·사범', icon: 'GraduationCap', color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { id: 'art_sports', name: '예술·체육·디자인', icon: 'Palette', color: 'bg-pink-50 text-pink-600 border-pink-200' },
];

// 2. 글 분류 태그 목록
export const POST_TAGS = [
  '전체',
  '세특/탐구주제',
  '추천도서/논문',
  '동아리/대회',
  '진로/학과질문',
  '공부법/노트',
  '자유잡담',
];

// 3. 더미 데이터 모두 제거 (빈 배열로 초기화)
export const INITIAL_MAJOR_POSTS = [];
export const INITIAL_SCHOOL_POSTS = [];
export const INITIAL_COUNSELING_DATA = {
  directQuestions: [],
  admissionConsults: [],
};
export const INITIAL_SCHOOL_LIFE = {
  todayMeal: {
    date: '',
    calorie: '-',
    menu: [],
  },
  weeklySchedule: [],
  dDayList: [],
};
export const INITIAL_CHAT_ROOMS = [];
