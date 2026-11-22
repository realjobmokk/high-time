// HighTime (고교타임) Figma v2.0 에디토리얼 디자인 토큰 (Design Tokens)
export const COLORS = {
  // 배경 (Backgrounds)
  bg: '#fafaf6', // 따뜻한 페이퍼 화이트 배경
  surface: '#ffffff', // 카드 및 내비게이션 표면
  sageSurface: '#edf0e6', // 홈 오늘의 학교생활 / 채팅 안내 카드 배경
  sageCard: '#f0f1eb', // 학사일정 / 진로 카드 / 비활성 칩 배경
  sageButton: '#eff1e9', // 1:1 채팅 / 필터 보조 버튼 배경
  searchBg: '#eceee7', // 검색 입력창 배경

  // 텍스트 (Typography)
  ink: '#222722', // 기본 진한 먹색 텍스트
  muted: '#6d746a', // 보조 설명 및 메타 텍스트
  navMuted: '#747970', // 비활성 하단 탭 텍스트/아이콘

  // 포인트 컬러 (Accent - 테라코타)
  accent: '#b64832', // 주요 강조 컬러
  accentSoft: '#f6e8e0', // 수능 디데이 뱃지 배경
  accentNavPill: '#f8eae3', // 활성 하단 탭 아이콘 배경

  // 경계선 (Borders)
  border: '#e2e5dd', // 카드 및 리스트 구분선
  navBorder: '#e8e9e3', // 하단 내비게이션 상단 구분선

  // 상태 및 아바타 (Status & Avatars)
  success: '#526044', // 인증 완료 텍스트 및 아바타 텍스트
  avatarGreenBg: '#e8edde', // 기본 아바타 배경 1
  avatarWarmBg: '#efe6dc', // 기본 아바타 배경 2
  avatarWarmInk: '#806146', // 기본 아바타 텍스트 2
} as const;
