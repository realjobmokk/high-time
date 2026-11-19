// HighTime (고교타임) 모바일 애플리케이션 타입 정의

// 소셜 로그인 제공자 타입
export type SocialProvider = 'google' | 'naver' | 'kakao' | 'apple';

// 사용자(학생) 정보
export interface CurrentUser {
  id?: string;
  username?: string;
  socialProvider?: SocialProvider;
  email?: string;
  name: string;
  nickname?: string;
  bio?: string;
  targetMajor?: string;
  birthDate?: string;
  telecom?: string;
  phone?: string;
  grade: string;
  profileImage?: string;
  certFileName?: string;
  isVerified: boolean;
  passVerified: boolean;
  certVerified: boolean;
  verifiedAt: string;
}

// 학교 정보
export interface School {
  id: string;
  name: string;
  region: string;
  officeCode?: string;
  schoolCode?: string;
}

// 전공 카테고리
export interface MajorCategory {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

// 댓글 인터페이스
export interface PostComment {
  id: string;
  author: {
    nickname: string;
    school: string;
    grade: string;
    isAnonymous: boolean;
  };
  content: string;
  createdAt: string;
  likes: number;
  isMine?: boolean;
}

// 전공 게시글 인터페이스
export interface MajorPost {
  id: string;
  majorId: string;
  majorName: string;
  tag: string;
  title: string;
  content: string;
  author: {
    nickname: string;
    school: string;
    grade: string;
    isAnonymous: boolean;
    avatarColor?: string;
    isMine?: boolean;
  };
  likes: number;
  commentCount: number;
  scraps: number;
  createdAt: string;
  isMine?: boolean;
  isLikedByUser?: boolean;
  comments: PostComment[];
}

// 우리학교 게시글 댓글 인터페이스
export interface SchoolPostComment {
  id: string;
  author: string;
  grade: string;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
}

// 우리학교 게시글 인터페이스
export interface SchoolPost {
  id: string;
  category: string;
  title: string;
  content: string;
  author: string;
  grade: string;
  isAnonymous: boolean;
  isMine?: boolean;
  likes: number;
  isLikedByUser?: boolean;
  commentCount: number;
  comments?: SchoolPostComment[];
  createdAt: string;
}

// 1:1 질문 인터페이스
export interface DirectQuestion {
  id: string;
  targetAuthor: string;
  topic: string;
  question: string;
  answer: string | null;
  status: '답변완료' | '답변대기중';
  createdAt: string;
  answeredAt: string | null;
  isPublic: boolean;
}

// 입시 상담 인터페이스
export interface AdmissionConsult {
  id: string;
  category: string;
  targetMajor: string;
  targetSchool: string;
  gradeAverage: string;
  title: string;
  content: string;
  expertAdvice: string;
  expertName: string;
  status: '상담완료' | '검토중';
  createdAt: string;
}

// 채팅 메시지 인터페이스
export interface ChatMessage {
  id: string;
  sender: 'me' | 'peer';
  senderKey?: string;
  senderName?: string;
  text: string;
  time: string;
  isRead?: boolean;
}

// 1:1 채팅방 인터페이스
export interface ChatRoom {
  id: string;
  peerKey?: string;
  peerName: string;
  peerSchool: string;
  avatar: string;
  avatarBg: string;
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
  safetyNotice: string;
  messages: ChatMessage[];
}

// 급식 메뉴 아이템
export interface MealMenuItem {
  name: string;
  allergy: string;
}

// 개별 식사(조식/중식/석식) 데이터
export interface SingleMealData {
  mealCode: '1' | '2' | '3'; // 1: 조식, 2: 중식, 3: 석식
  mealName: string;          // '조식' | '중식' | '석식'
  calorie: string;
  menu: MealMenuItem[];
  origin?: string;
}

// 급식 정보 응답 인터페이스
export interface MealInfo {
  isSuccess: boolean;
  schoolName?: string;
  date?: string;
  calorie?: string;
  origin?: string;
  menu?: MealMenuItem[];
  meals?: Record<string, SingleMealData>; // '1'(조식), '2'(중식), '3'(석식)
  message?: string;
}

// D-day 일정
export interface DDayItem {
  title: string;
  targetDate: string;
  dDay: string;
  badgeColor: string;
}

// 요일별 시간표
export interface DaySchedule {
  day: string;
  periods: string[];
}

// 알림 아이템
export interface NotificationItem {
  id: string;
  type: 'comment' | 'question' | 'like' | 'notice' | 'chat';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  roomId?: string;
  postId?: string;
}

// 사용자가 직접 추가/편집하는 주간 시간표 수업 블록 아이템 (에브리타임 스타일)
export type WeekdayKey = '월' | '화' | '수' | '목' | '금';

export interface CustomTimetableBlock {
  id: string;
  day: WeekdayKey;      // '월' | '화' | '수' | '목' | '금'
  subject: string;      // 과목명 (예: 미적분학II, 물리학I)
  room: string;         // 강의실/교실 (예: 7-613, 2-3교실)
  startHour: number;    // 시작 시각 (9 ~ 17, 24시간 기준 예: 9, 10, ..., 16)
  endHour: number;      // 종료 시각 (10 ~ 18, 예: 11이면 2시간 블록)
  color: string;        // 블록 배경색 (파스텔 톤)
}
