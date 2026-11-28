// =============================================================================
// HighTime (고교타임) - 랜딩페이지 임베드(?preview=1) 전용 고정 데모 데이터
// - 실제 Supabase DB나 NEIS API와 무관하게, 방문자가 시간표·급식·게시글·댓글·1:1 채팅을
//   자유롭게 구경하고 체험할 수 있도록 구성된 전용 데이터입니다.
// =============================================================================

import {
  CurrentUser,
  School,
  CustomTimetableBlock,
  MealInfo,
  DDayItem,
  MajorPost,
  SchoolPost,
  ChatRoom,
  NotificationItem,
} from '../types';

// 0. 랜딩페이지 체험 모드 전용 가상 계정 & 학교 (실제 사용자/DB와 완전 분리)
export const PREVIEW_USER: CurrentUser = {
  username: 'preview_demo',
  socialProvider: 'kakao',
  email: 'preview@hightime.app',
  name: '김고교',
  nickname: '체험학생',
  bio: 'HighTime 체험용 계정입니다. 자유롭게 구경하고 댓글·채팅을 보내보세요!',
  targetMajor: '컴퓨터·IT·인공지능',
  birthDate: '2009-03-15',
  telecom: 'SKT',
  phone: '',
  grade: '고2',
  certFileName: 'preview_cert.pdf',
  isVerified: true,
  passVerified: true,
  certVerified: true,
  verifiedAt: '2026. 11. 28',
};

export const PREVIEW_SCHOOL: School = {
  id: 'preview-hanbit',
  name: '한빛고등학교',
  region: '서울',
};

// 1. 고정 시간표 (월~금 1~6교시, 과목별 다양한 교실 배정)
export const PREVIEW_TIMETABLE: CustomTimetableBlock[] = [
  // 월요일
  { id: 'pv-mon-1', day: '월', subject: '문학', room: '인문관 201', startHour: 9, endHour: 10, color: '#a3c96c' },
  { id: 'pv-mon-2', day: '월', subject: '수학 I', room: '수리관 302', startHour: 10, endHour: 11, color: '#8b78cd' },
  { id: 'pv-mon-3', day: '월', subject: '물리학 I', room: '과학실 2', startHour: 11, endHour: 12, color: '#d27365' },
  { id: 'pv-mon-4', day: '월', subject: '영어 독해와 작문', room: '어학실 1', startHour: 12, endHour: 13, color: '#6c8cc7' },
  { id: 'pv-mon-5', day: '월', subject: '정보(파이썬)', room: '컴퓨터실', startHour: 13, endHour: 14, color: '#63b0a3' },
  { id: 'pv-mon-6', day: '월', subject: '한국사', room: '역사탐구실', startHour: 14, endHour: 15, color: '#cca958' },

  // 화요일
  { id: 'pv-tue-1', day: '화', subject: '수학 I', room: '수리관 302', startHour: 9, endHour: 10, color: '#8b78cd' },
  { id: 'pv-tue-2', day: '화', subject: '화학 I', room: '화학실', startHour: 10, endHour: 11, color: '#61a877' },
  { id: 'pv-tue-3', day: '화', subject: '영어 독해와 작문', room: '어학실 1', startHour: 11, endHour: 12, color: '#6c8cc7' },
  { id: 'pv-tue-4', day: '화', subject: '문학', room: '인문관 201', startHour: 12, endHour: 13, color: '#a3c96c' },
  { id: 'pv-tue-5', day: '화', subject: '체육', room: '대강당', startHour: 13, endHour: 14, color: '#d88c51' },
  { id: 'pv-tue-6', day: '화', subject: '진로와 직업', room: '진로상담실', startHour: 14, endHour: 15, color: '#63b0a3' },

  // 수요일
  { id: 'pv-wed-1', day: '수', subject: '물리학 I', room: '과학실 2', startHour: 9, endHour: 10, color: '#d27365' },
  { id: 'pv-wed-2', day: '수', subject: '정보(파이썬)', room: '컴퓨터실', startHour: 10, endHour: 11, color: '#63b0a3' },
  { id: 'pv-wed-3', day: '수', subject: '수학 I', room: '수리관 302', startHour: 11, endHour: 12, color: '#8b78cd' },
  { id: 'pv-wed-4', day: '수', subject: '한국사', room: '역사탐구실', startHour: 12, endHour: 13, color: '#cca958' },
  { id: 'pv-wed-5', day: '수', subject: '창의적 체험활동', room: '세미나실', startHour: 13, endHour: 14, color: '#a3c96c' },
  { id: 'pv-wed-6', day: '수', subject: '동아리(AI코딩)', room: '정보실 1', startHour: 14, endHour: 15, color: '#6c8cc7' },

  // 목요일
  { id: 'pv-thu-1', day: '목', subject: '영어 독해와 작문', room: '어학실 1', startHour: 9, endHour: 10, color: '#6c8cc7' },
  { id: 'pv-thu-2', day: '목', subject: '문학', room: '인문관 201', startHour: 10, endHour: 11, color: '#a3c96c' },
  { id: 'pv-thu-3', day: '목', subject: '수학 I', room: '수리관 302', startHour: 11, endHour: 12, color: '#8b78cd' },
  { id: 'pv-thu-4', day: '목', subject: '화학 I', room: '화학실', startHour: 12, endHour: 13, color: '#61a877' },
  { id: 'pv-thu-5', day: '목', subject: '물리학 I', room: '과학실 2', startHour: 13, endHour: 14, color: '#d27365' },
  { id: 'pv-thu-6', day: '목', subject: '미술 창작', room: '미술실', startHour: 14, endHour: 15, color: '#d88c51' },

  // 금요일
  { id: 'pv-fri-1', day: '금', subject: '한국사', room: '역사탐구실', startHour: 9, endHour: 10, color: '#cca958' },
  { id: 'pv-fri-2', day: '금', subject: '물리학 I', room: '과학실 2', startHour: 10, endHour: 11, color: '#d27365' },
  { id: 'pv-fri-3', day: '금', subject: '정보(파이썬)', room: '컴퓨터실', startHour: 11, endHour: 12, color: '#63b0a3' },
  { id: 'pv-fri-4', day: '금', subject: '수학 I', room: '수리관 302', startHour: 12, endHour: 13, color: '#8b78cd' },
  { id: 'pv-fri-5', day: '금', subject: '영어 독해와 작문', room: '어학실 1', startHour: 13, endHour: 14, color: '#6c8cc7' },
  { id: 'pv-fri-6', day: '금', subject: '자율활동', room: '다목적실', startHour: 14, endHour: 15, color: '#61a877' },
];

// 2. 고정 급식 데이터
export const PREVIEW_MEAL: MealInfo = {
  isSuccess: true,
  schoolName: '한빛고등학교',
  date: '오늘 중식',
  calorie: '865.3 Kcal',
  menu: [
    { name: '찰옥수수밥(친)', allergy: '' },
    { name: '조랭이미역국(친)', allergy: '' },
    { name: '매콤돼지갈비찜(친)', allergy: '' },
    { name: '케이준샐러드(친)', allergy: '' },
    { name: '단배추된장무침', allergy: '' },
    { name: '배추김치', allergy: '' },
  ],
};

// 3. 고정 학사일정 데이터
export const PREVIEW_SCHEDULE: DDayItem[] = [
  { title: '2학기 2차 지필평가', targetDate: '2026-12-10', dDay: 'D-12', badgeColor: '#b9412c' },
  { title: '교내 SW·AI 탐구 발표회', targetDate: '2026-12-18', dDay: 'D-20', badgeColor: '#486a52' },
  { title: '겨울방학식', targetDate: '2026-12-30', dDay: 'D-32', badgeColor: '#6d726d' },
];

// 4. 임의 전공게시판(전국) 게시글 + 댓글
export const PREVIEW_MAJOR_POSTS: MajorPost[] = [
  {
    id: 'pv-major-1',
    majorId: 'cs_tech',
    majorName: '컴퓨터·IT',
    tag: '세특/탐구주제',
    title: '확률과 통계 × 인공지능 세특 주제 추천 (베이즈 정리)',
    content:
      '수업 시간에 배운 조건부 확률과 베이즈 정리를 스팸 메일 필터링이나 의료 AI 진단 확률 계산과 엮어서 보고서를 썼더니 선생님께서 정말 좋아하셨어요! 파이썬으로 간단한 시뮬레이션까지 돌려보면 세특 퀄리티가 확 올라갑니다.',
    author: {
      nickname: '김민준',
      school: '서울과학고등학교',
      grade: '고2',
      isAnonymous: false,
      avatarColor: '#486a52',
    },
    likes: 28,
    commentCount: 2,
    scraps: 14,
    createdAt: '12분 전',
    isMine: false,
    isLikedByUser: false,
    comments: [
      {
        id: 'pv-c-1',
        author: { nickname: '박서연', school: '대전대신고등학교', grade: '고2', isAnonymous: false },
        content: '오 파이썬 시뮬레이션은 어떤 라이브러리 쓰셨나요? 저도 참고해서 탐구해보고 싶어요!',
        createdAt: '8분 전',
        likes: 3,
      },
      {
        id: 'pv-c-2',
        author: { nickname: '김민준', school: '서울과학고등학교', grade: '고2', isAnonymous: false },
        content: '기본 random 모듈이랑 pandas만 써도 충분히 표랑 그래프 뽑을 수 있어요. 궁금하시면 1:1 채팅 주세요!',
        createdAt: '5분 전',
        likes: 2,
      },
    ],
  },
  {
    id: 'pv-major-2',
    majorId: 'med_bio',
    majorName: '의약학·바이오',
    tag: '추천도서/논문',
    title: '생명과학 I 신경계 단원 연계해서 읽기 좋은 도서 공유해요',
    content:
      '유전자 가위(CRISPR)와 알츠하이머 치료제 관련해서 세특 쓸 때 《유전자 지배 사회》랑 KCI 논문 2편 같이 요약해서 발표했더니 반응이 좋았습니다. 의대/약대 희망하시는 분들 참고하세요!',
    author: {
      nickname: '이수아',
      school: '부산국제고등학교',
      grade: '고3',
      isAnonymous: false,
      avatarColor: '#b9412c',
    },
    likes: 19,
    commentCount: 1,
    scraps: 9,
    createdAt: '35분 전',
    isMine: false,
    isLikedByUser: false,
    comments: [
      {
        id: 'pv-c-3',
        author: { nickname: '익명', school: '경기고등학교', grade: '고1', isAnonymous: true },
        content: '논문은 RISS에서 검색해서 찾으셨나요? 좋은 정보 감사합니다!',
        createdAt: '20분 전',
        likes: 1,
      },
    ],
  },
  {
    id: 'pv-major-3',
    majorId: 'biz_econ',
    majorName: '경영·경제',
    tag: '동아리/대회',
    title: '경제 동아리에서 학교 매점 수요·공급 설문조사 프로젝트 해본 후기',
    content:
      '거창한 주제보다 우리 학교 학생 120명 대상으로 매점 가격 탄력성 설문을 돌리고 그래프로 분석해봤는데, 면접에서도 진짜 재미있게 물어보시더라고요. 다들 교내 데이터로 소논문 한 번 써보세요!',
    author: {
      nickname: '정현우',
      school: '인천하늘고등학교',
      grade: '고2',
      isAnonymous: false,
      avatarColor: '#6c8cc7',
    },
    likes: 15,
    commentCount: 0,
    scraps: 7,
    createdAt: '1시간 전',
    isMine: false,
    isLikedByUser: false,
    comments: [],
  },
  {
    id: 'pv-major-4',
    majorId: 'nat_eng',
    majorName: '자연·공학',
    tag: '진로/학과질문',
    title: '기계공학 vs 전기전자공학 선택 과목(물리II, 기하) 고민 중입니다',
    content:
      '이번에 3학년 선택과목 정하는데 물리학 II는 무조건 들을 거고 기하랑 미적분 중에 내신 부담 때문에 조금 고민되네요. 공대 지망 선배님들 조언 부탁드려요!',
    author: {
      nickname: '익명',
      school: '대구경신고등학교',
      grade: '고2',
      isAnonymous: true,
      avatarColor: '#8b78cd',
    },
    likes: 11,
    commentCount: 1,
    scraps: 3,
    createdAt: '2시간 전',
    isMine: false,
    isLikedByUser: false,
    comments: [
      {
        id: 'pv-c-4',
        author: { nickname: '최도윤', school: '포항제철고등학교', grade: '고3', isAnonymous: false },
        content: '기계·전자 둘 다 미적분은 사실상 필수라 미적분 먼저 챙기고 여건 되면 기하 듣는 걸 추천합니다!',
        createdAt: '1시간 전',
        likes: 4,
      },
    ],
  },
];

// 5. 임의 우리학교(대현고등학교) 게시글 + 댓글
export const PREVIEW_SCHOOL_POSTS: SchoolPost[] = [
  {
    id: 'pv-school-1',
    category: '급식·시간표',
    title: '오늘 점심 매콤돼지갈비찜 미쳤는데??',
    content: '진짜 오랜만에 급식 레전드 나왔다 ㅋㅋ 2층 급식실 줄 긴데 빨리 내려가세요!',
    author: '익명',
    grade: '고2',
    isAnonymous: true,
    isMine: false,
    likes: 24,
    isLikedByUser: false,
    commentCount: 2,
    createdAt: '18분 전',
    comments: [
      {
        id: 'pv-sc-1',
        author: '익명',
        grade: '고2',
        isAnonymous: true,
        content: '인정ㅋㅋ 오늘 대존맛 바로 눌렀음',
        createdAt: '10분 전',
      },
      {
        id: 'pv-sc-2',
        author: '박지훈',
        grade: '고1',
        isAnonymous: false,
        content: '1학년도 지금 내려갑니다!!',
        createdAt: '6분 전',
      },
    ],
  },
  {
    id: 'pv-school-2',
    category: '내신·수행',
    title: '2학년 물리학 I 수행평가 보고서 양식 어디 올라왔나요?',
    content: '학교 클래스룸에 아직 안 올라온 것 같은데 혹시 받으신 분 있나요?',
    author: '한예진',
    grade: '고2',
    isAnonymous: false,
    isMine: false,
    likes: 8,
    isLikedByUser: false,
    commentCount: 1,
    createdAt: '1시간 전',
    comments: [
      {
        id: 'pv-sc-3',
        author: '김태현',
        grade: '고2',
        isAnonymous: false,
        content: '오늘 6교시 끝나고 반장한테 나눠주신다고 했어요!',
        createdAt: '42분 전',
      },
    ],
  },
  {
    id: 'pv-school-3',
    category: '동아리',
    title: '코딩·AI 동아리 부원 발표회 관람 오실 분!',
    content: '다음 주 수요일 방과후에 정보실 1에서 자율주행 미니카랑 웹 프로젝트 발표합니다. 간식도 있어요!',
    author: '윤도현',
    grade: '고2',
    isAnonymous: false,
    isMine: false,
    likes: 14,
    isLikedByUser: false,
    commentCount: 0,
    createdAt: '3시간 전',
    comments: [],
  },
];

// 6. 임의 1:1 채팅방 데이터
export const PREVIEW_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'pv-room-1',
    peerKey: 'pv-peer-minjun',
    peerName: '김민준',
    peerSchool: '서울과학고등학교 고2',
    avatar: '김',
    avatarBg: '#486a52',
    unreadCount: 1,
    lastMessage: '네! 베이즈 정리 코드 예시 정리해서 보내드릴게요 :)',
    lastTime: '오후 1:15',
    safetyNotice:
      '건전하고 안전한 학생 간 학습·진로 교류를 위해 개인 연락처 요구 및 비방 행위는 자동 차단됩니다.',
    messages: [
      {
        id: 'pv-m-1',
        sender: 'me',
        text: '안녕하세요! 전공게시판에서 베이즈 정리 AI 세특 글 보고 질문드려요.',
        time: '오후 1:10',
        isRead: true,
      },
      {
        id: 'pv-m-2',
        sender: 'peer',
        senderName: '김민준',
        text: '안녕하세요! 어떤 부분이 궁금하신가요?',
        time: '오후 1:12',
        isRead: true,
      },
      {
        id: 'pv-m-3',
        sender: 'peer',
        senderName: '김민준',
        text: '네! 베이즈 정리 코드 예시 정리해서 보내드릴게요 :)',
        time: '오후 1:15',
        isRead: false,
      },
    ],
  },
  {
    id: 'pv-room-2',
    peerKey: 'pv-peer-sua',
    peerName: '이수아',
    peerSchool: '부산국제고등학교 고3',
    avatar: '이',
    avatarBg: '#b9412c',
    unreadCount: 0,
    lastMessage: '의약학 계열 생기부 흐름 잡는 데 도움 되셨다니 다행이에요!',
    lastTime: '어제',
    safetyNotice:
      '건전하고 안전한 학생 간 학습·진로 교류를 위해 개인 연락처 요구 및 비방 행위는 자동 차단됩니다.',
    messages: [
      {
        id: 'pv-m-4',
        sender: 'me',
        text: '추천해주신 생명과학 도서 덕분에 발표 주제 정했어요 감사합니다!',
        time: '어제',
        isRead: true,
      },
      {
        id: 'pv-m-5',
        sender: 'peer',
        senderName: '이수아',
        text: '의약학 계열 생기부 흐름 잡는 데 도움 되셨다니 다행이에요!',
        time: '어제',
        isRead: true,
      },
    ],
  },
];

// 7. 임의 알림 데이터
export const PREVIEW_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'pv-noti-1',
    type: 'chat',
    title: '김민준님의 1:1 채팅',
    message: '네! 베이즈 정리 코드 예시 정리해서 보내드릴게요 :)',
    time: '오후 1:15',
    isRead: false,
    roomId: 'pv-room-1',
  },
  {
    id: 'pv-noti-2',
    type: 'notice',
    title: '체험 모드 안내',
    message: '랜딩페이지 미리보기 모드입니다. 댓글과 1:1 채팅을 자유롭게 체험해보세요!',
    time: '방금 전',
    isRead: false,
  },
];
