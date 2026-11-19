// HighTime (고교타임) 모바일 애플리케이션 카테고리 및 초기 빈 상태 정의
// (학교 정보는 하드코딩하지 않고 로그인 시 나이스(NEIS) 학교검색 API로 실시간 조회하여 사용)

import {
  MajorCategory,
  MajorPost,
  SchoolPost,
  DirectQuestion,
  AdmissionConsult,
  ChatRoom,
  DDayItem,
  DaySchedule,
  NotificationItem,
} from '../types';

// 1. 전국 전공 계열 카테고리 정의 (UI 필터 메뉴용)
export const MAJOR_CATEGORIES: MajorCategory[] = [
  { id: 'all', name: '전체 전공', icon: 'sparkles', color: '#6366f1' },
  { id: 'cs_tech', name: '컴퓨터·IT', icon: 'code-slash', color: '#e11d48' },
  { id: 'med_bio', name: '의약학·바이오', icon: 'heart', color: '#e11d48' },
  { id: 'nat_eng', name: '자연·공학', icon: 'hardware-chip', color: '#e11d48' },
  { id: 'biz_econ', name: '경영·경제', icon: 'trending-up', color: '#e11d48' },
  { id: 'social_law', name: '사회·법학', icon: 'scale', color: '#e11d48' },
  { id: 'hum_lang', name: '인문·어문', icon: 'book', color: '#e11d48' },
  { id: 'edu', name: '교육·사범', icon: 'school', color: '#e11d48' },
  { id: 'art_sports', name: '예체능·디자인', icon: 'color-palette', color: '#e11d48' },
];

// 2. 글 분류 태그 목록 (UI 필터 메뉴용)
export const POST_TAGS: string[] = [
  '전체',
  '세특/탐구주제',
  '추천도서/논문',
  '동아리/대회',
  '진로/학과질문',
  '공부법/노트',
  '자유잡담',
];

// 3. 초기 콘텐츠 상태 (더미 데이터 없음)
export const INITIAL_MAJOR_POSTS: MajorPost[] = [];
export const INITIAL_SCHOOL_POSTS: SchoolPost[] = [];
export const INITIAL_DIRECT_QUESTIONS: DirectQuestion[] = [];
export const INITIAL_ADMISSION_CONSULTS: AdmissionConsult[] = [];
export const INITIAL_DDAY_LIST: DDayItem[] = [];
export const WEEKLY_SCHEDULE: DaySchedule[] = [];
export const INITIAL_CHAT_ROOMS: ChatRoom[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
