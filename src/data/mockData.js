// 고등학생용 에브리타임 (HighTime) 목업(Mock) 및 초기 데이터 정의

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
  '자유잡담'
];

// 3. 전국 고등학교 샘플 목록
export const SAMPLE_SCHOOLS = [
  { id: 'hanmin', name: '한민고등학교', region: '경기 파주시' },
  { id: 'hana', name: '하나고등학교', region: '서울 은평구' },
  { id: 'dan_dae', name: '단대부속고등학교', region: '서울 강남구' },
  { id: 'sangsan', name: '상산고등학교', region: '전북 전주시' },
  { id: 'min_sa', name: '민족사관고등학교', region: '강원 횡성군' },
  { id: 'daewon', name: '대원외국어고등학교', region: '서울 광진구' },
  { id: 'sunrin', name: '선린인터넷고등학교', region: '서울 용산구' },
  { id: 'general_a', name: '세종과학예술영재교', region: '세종시' },
];

// 4. 초기 전공게시판 게시글 목록 (타 학교 학생들과 공유되는 게시판)
export const INITIAL_MAJOR_POSTS = [
  {
    id: 'post-1',
    majorId: 'cs_tech',
    majorName: '컴퓨터·IT·인공지능',
    tag: '세특/탐구주제',
    title: '[정보 세특] 생성형 AI의 환각(Hallucination) 현상 완화 알고리즘 탐구',
    content: `안녕하세요! 컴공 희망하는 고2 학생입니다.\n\n이번 정보 교과 세특 주제로 RAG(검색 증강 생성) 기법과 프롬프트 엔지니어링을 결합해 AI 답변 신뢰도를 측정하는 소논문 형식 보고서를 작성하고 있는데요.\n\n파이썬으로 간단한 텍스트 유사도 코사인 유사도(Cosine Similarity) 검증 코드를 작성해서 첨부했습니다. 혹시 비슷한 주제로 생기부 챙기신 선배님이나 동기분들 의견 듣고 싶습니다! 1:1 질문도 언제든 환영해요.`,
    author: {
      nickname: '코드마스터27',
      school: '하나고등학교',
      grade: '고2',
      isAnonymous: false,
      avatarColor: 'bg-blue-500',
      isMine: true, // 사용자가 직접 작성한 게시물 예시
    },
    likes: 42,
    commentCount: 9,
    scraps: 31,
    createdAt: '25분 전',
    comments: [
      {
        id: 'c-1',
        author: { nickname: '알고리즘깎는노인', school: '선린인터넷고', grade: '고3', isAnonymous: false },
        content: '수학과 연계해서 벡터 내적과 코사인 법칙 수식까지 증명 보고서에 넣으면 수학 세특까지 융합 가능해요! 저도 작년에 그렇게 해서 평가원 세특 칭찬받았어요.',
        createdAt: '18분 전',
        likes: 12,
        isMine: false
      },
      {
        id: 'c-2',
        author: { nickname: '나(학생)', school: '하나고등학교', grade: '고2', isAnonymous: false },
        content: '혹시 쓰신 파이썬 라이브러리 뭐뭐 쓰셨는지 1:1 질문 드려도 될까요?',
        createdAt: '10분 전',
        likes: 3,
        isMine: true // 사용자가 직접 작성한 댓글 예시
      }
    ]
  },
  {
    id: 'post-2',
    majorId: 'med_bio',
    majorName: '의약학·생명공학',
    tag: '추천도서/논문',
    title: '의대/약대 지망생이 읽고 감명받은 면역학 도서 3권 & 세특 연결 팁',
    content: `의예과 준비 중인 고3입니다. 1, 2학년 때 독서활동과 생명과학II 세특에 유용하게 녹여낸 책 공유합니다!\n\n1. 《면역》(필리프 데트머) - 기본 메커니즘 시각화 최고\n2. 《인류를 구한 12가지 약 이야기》 - 화학약품 합성과 약동학 입문용\n3. 《생명의 암호》(제니퍼 다우드나) - 크리스퍼 유전자 가위의 윤리적 쟁점\n\n단순 줄거리 요약 대신, 자신이 던진 '후속 질문'과 학교 교과 탐구로 확장한 내용을 생기부에 적는 것이 핵심입니다! 궁금한 점 댓글이나 1:1 질문 남겨주세요.`,
    author: {
      nickname: '하얀가운꿈나무',
      school: '상산고등학교',
      grade: '고3',
      isAnonymous: false,
      avatarColor: 'bg-rose-500',
      isMine: false, // 다른 사용자가 작성한 글
    },
    likes: 88,
    commentCount: 15,
    scraps: 76,
    createdAt: '1시간 전',
    comments: [
      {
        id: 'c-3',
        author: { nickname: '약대희망러', school: '단대부속고', grade: '고2', isAnonymous: false },
        content: '2번 책 약학 세특에 진짜 꿀이에요! 아스피린 합성 실험이랑 엮으면 교과 연계성 엄청 좋습니다.',
        createdAt: '45분 전',
        likes: 8
      }
    ]
  },
  {
    id: 'post-3',
    majorId: 'biz_econ',
    majorName: '경영·경제·통계',
    tag: '동아리/대회',
    title: '[전국 고교 연합] 가상 모의 주식투자 및 금융 빅데이터 분석 프로젝트 팀원 모집',
    content: `경영학과 / 경제통계학과 지망생 여러분 반갑습니다!\n\n각 지역 학교 학생들과 온라인으로 모여 주 1회 한국은행 통화정책 리포트를 분석하고, 모의 포트폴리오를 만들어보는 자율동아리 스터디원 2분을 추가 모집합니다.\n\n- 대상: 경제/경영/데이터 분석에 관심 있는 전국 고1~고2\n- 활동: 주 1회 Zoom 미팅 + 노션 활동 기록 (생기부 자율활동/진로 기재용 증빙자료)\n- 신청은 1:1 질문 또는 프로필 문의 주세요!`,
    author: {
      nickname: '월스트리트고딩',
      school: '대원외고',
      grade: '고2',
      isAnonymous: false,
      avatarColor: 'bg-amber-500',
    },
    likes: 34,
    commentCount: 7,
    scraps: 19,
    createdAt: '3시간 전',
    comments: []
  },
  {
    id: 'post-4',
    majorId: 'nat_eng',
    majorName: '자연과학·기계전자',
    tag: '세특/탐구주제',
    title: '물리II 유체역학 파트 베르누이 방정식 실생활 항공기 날개 양력 실험 고찰',
    content: `물리II 세특 보고서 작성 중에 있습니다. 풍동 실험 키트 없이 아두이노 풍속 센서로 측정해봤는데 오차가 꽤 크네요. 혹시 오차 보정 공식이나 유의미한 해석 도출해보신 분 계신가요?`,
    author: {
      nickname: '익명',
      school: '세종과학예술영재교',
      grade: '고1',
      isAnonymous: true,
      avatarColor: 'bg-gray-400',
    },
    likes: 19,
    commentCount: 4,
    scraps: 11,
    createdAt: '5시간 전',
    comments: []
  },
  {
    id: 'post-5',
    majorId: 'social_law',
    majorName: '사회과학·미디어·법',
    tag: '진로/학과질문',
    title: '미디어커뮤니케이션 vs 사회학과 고민 중인데 세특 방향 차이가 클까요?',
    content: `1학년 때는 막연하게 방송/언론 쪽 생각해서 가짜뉴스나 미디어 리터러시 위주로 채웠는데, 2학년 올라오면서 디지털 격차와 플랫폼 노동 등 사회학적 불평등 구조에 더 관심이 생겼습니다. 이럴 경우 학생부 방향을 어떻게 잡는 게 종합전형에서 유리할까요?`,
    author: {
      nickname: '미디어소사이어티',
      school: '민족사관고',
      grade: '고2',
      isAnonymous: false,
      avatarColor: 'bg-purple-500',
    },
    likes: 27,
    commentCount: 6,
    scraps: 14,
    createdAt: '8시간 전',
    comments: []
  }
];

// 5. 초기 학교 전용 게시판 게시글 (우리 학교 학생들만 보는 라운지)
export const INITIAL_SCHOOL_POSTS = [
  {
    id: 'sp-1',
    category: '자유게시판',
    title: '오늘 급식 마라로제 떡볶이에 치즈스틱 실화냐?',
    content: '영양사 선생님 진짜 사랑합니다... 점심 3교시 끝나자마자 급식실로 전력질주 각 ㅋㅋㅋ',
    author: '급식헌터',
    grade: '고2',
    isAnonymous: true,
    isMine: true, // 사용자가 작성한 교내 게시물 예시
    likes: 54,
    commentCount: 12,
    createdAt: '15분 전'
  },
  {
    id: 'sp-2',
    category: '정보/세특',
    title: '2학기 2차 지필평가(기말고사) 시험범위 정리 파일 나눔',
    content: '영어1 4단원 본문이랑 수학 수열 파트 프린트물 빠진 거 스캔해서 클래스룸에 올렸어 확인해봐!',
    author: '전교1등꿈나무',
    grade: '고1',
    isAnonymous: false,
    isMine: false,
    likes: 72,
    commentCount: 18,
    createdAt: '1시간 전'
  },
  {
    id: 'sp-3',
    category: '동아리',
    title: '[댄스동아리 루미너스] 축제 찬조공연 연습실 오늘 5시 소집!',
    content: '동아리방으로 모여주세요. 동선 최종 점검하고 무대 의상 맞출 예정입니다.',
    author: '댄싱머신',
    grade: '고3',
    isAnonymous: false,
    isMine: false,
    likes: 23,
    commentCount: 4,
    createdAt: '3시간 전'
  },
  {
    id: 'sp-4',
    category: '분실물',
    title: '본관 3층 2학년 4반 복도에서 에어팟 프로 주우신 분 ㅠㅠ',
    content: '노란색 짱구 케이스 씌워져 있습니다... 주우신 분 교무실이나 학생회실로 맡겨주시면 사례할게요 제발요 ㅠㅠ',
    author: '눈물의주인',
    grade: '고2',
    isAnonymous: true,
    isMine: false,
    likes: 15,
    commentCount: 5,
    createdAt: '4시간 전'
  }
];

// 6. 초기 1:1 질문 및 입시 상담 데이터
export const INITIAL_COUNSELING_DATA = {
  directQuestions: [
    {
      id: 'dq-1',
      targetAuthor: '하얀가운꿈나무 (상산고 고3)',
      topic: '생명과학II 효소 저해제 탐구 세특 방향성',
      question: '선배님, 경쟁적 저해제와 비경쟁적 저해제 미하엘리스-멘텐 곡선 관련해서 세특을 쓰려는데 고교 수준에서 너무 심화 내용일까요? 조언 부탁드립니다!',
      answer: '전혀 과하지 않습니다! 오히려 생명과학2 효소 파트에서 그래프 분석력과 수학(미적분/함수)적 해석 역량을 함께 보여줄 수 있는 최고의 소재예요. 단, 대학 논문 복붙 느낌이 나지 않도록 고교 실험(카탈레이스 분해 실험 등)과 연계한 문제의식에서 출발했음을 명시하면 매우 좋은 평가를 받습니다.',
      status: '답변완료',
      createdAt: '어제',
      answeredAt: '12시간 전',
      isPublic: true
    },
    {
      id: 'dq-2',
      targetAuthor: '코드마스터27 (하나고 고2)',
      topic: '정보 올림피아드 준비와 내신 병행 팁',
      question: '학종 준비하면서 백준 골드 티어 달성 및 정올 본선 나가는 게 내신에 마이너스가 안 될까요?',
      answer: null,
      status: '답변대기중',
      createdAt: '30분 전',
      answeredAt: null,
      isPublic: false
    }
  ],
  admissionConsults: [
    {
      id: 'ac-1',
      category: '학생부종합(학종)',
      targetMajor: '소프트웨어 / AI융합학부',
      targetSchool: '고려대 / 서강대 / 한양대',
      gradeAverage: '내신 일반고 1.8등급',
      title: '내신 1.8 일반고 컴공 학종, 수학 세특이 조금 평범한데 합격 가능성 있을까요?',
      content: '진로활동과 동아리 활동은 코딩 프로젝트로 꽉 차 있는데, 수학I/II 세특이 교과 문제풀이 위주로만 적혀있어서 불안합니다. 3학년 1학기 미적분과 확통에서 어떻게 보완하면 좋을까요?',
      expertAdvice: '컴공 학종에서 수학 세특은 1순위 평가 요소입니다. 3학년 1학기 미적분에서는 "경사하강법의 미분 원리" 또는 "그래픽스 렌더링 3D 변환 행렬"을 다루고, 확통에서는 "나이브 베이즈 분류기의 조건부 확률 적용"을 직접 보고서로 작성해 선생님께 제출하여 기록되도록 집중 보완을 권장합니다.',
      expertName: '대치동 입시연구소 김멘토',
      status: '상담완료',
      createdAt: '2일 전'
    },
    {
      id: 'ac-2',
      category: '교과/수능최저',
      targetMajor: '약학과',
      targetSchool: '중앙대 / 성균관대',
      gradeAverage: '내신 1.25등급',
      title: '약대 지역인재 교과전형 수능 3합 5 최저 맞추기 전략',
      content: '국어 2~3등급 진동, 수학(미적) 안정 1등급, 영어 2등급, 과탐(생1/화1) 2~3등급 상태입니다. 6월 모평 전까지 국어에 집중해야 할까요 과탐 1개를 1등급으로 굳혀야 할까요?',
      expertAdvice: '수능최저 3합 5 기준이라면 수학(1등급)을 기본 축으로 두고, 절대평가인 영어(1등급 목표)와 탐구 1과목(1등급 목표)을 조합하는 것이 국어 등급 상승보다 훨씬 확률이 높습니다. 과탐 중 본인에게 더 잘 맞는 1과목에 n제와 실모를 집중 투자하세요.',
      expertName: '수능 수리/과학 전문 수석컨설턴트',
      status: '상담완료',
      createdAt: '3일 전'
    }
  ]
};

// 7. 내 학교 생활 정보 (급식, 시간표, D-Day)
export const INITIAL_SCHOOL_LIFE = {
  todayMeal: {
    date: '2026. 11. 15 (수) 중식',
    calorie: '892 kcal',
    menu: [
      { name: '차조밥', allergy: '' },
      { name: '얼큰순두부찌개', allergy: '①,⑤,⑩' },
      { name: '수제 치즈 돈까스 & 브라운소스', allergy: '①,②,⑤,⑥,⑩,⑫' },
      { name: '단호박 마카로니 샐러드', allergy: '①,⑤' },
      { name: '배추김치', allergy: '⑨' },
      { name: '생딸기 요거트 드링크', allergy: '②' }
    ]
  },
  weeklySchedule: [
    { day: '월', periods: ['문학', '수학I', '영어', '물리학I', '운동과 건강', '화학I', '진로와 직업'] },
    { day: '화', periods: ['기하', '문학', '생명과학I', '한국사', '영어', '독일어I', '자율활동'] },
    { day: '수', periods: ['수학I', '지구과학I', '문학', '체육', '영어', '정보'] }, // 6교시
    { day: '목', periods: ['화학I', '영어', '수학I', '한국사', '생명과학I', '미술', '동아리활동'] },
    { day: '금', periods: ['물리학I', '문학', '기하', '정보', '영어', '수학I', '진로상담'] }
  ],
  dDayList: [
    { title: '2027학년도 대학수학능력시험 (수능)', targetDate: '2026-11-19', dDay: 'D-4', badgeColor: 'bg-red-500' },
    { title: '2학기 기말고사 지필평가', targetDate: '2026-12-14', dDay: 'D-29', badgeColor: 'bg-indigo-500' },
    { title: '겨울방학식', targetDate: '2027-01-08', dDay: 'D-54', badgeColor: 'bg-emerald-500' },
    { title: '전국연합학력평가 (3월 모의고사)', targetDate: '2027-03-25', dDay: 'D-130', badgeColor: 'bg-purple-500' }
  ]
};

// 8. 1:1 채팅 샘플 대화방 목록
export const INITIAL_CHAT_ROOMS = [
  {
    id: 'chat-room-1',
    peerName: '하얀가운꿈나무 (의약학 멘토)',
    peerSchool: '상산고 3학년',
    avatar: 'HeartPulse',
    avatarBg: 'bg-rose-500',
    unreadCount: 1,
    lastMessage: '네! 카탈레이스 기질 농도별 속도 공식 유도한 노트 사진 보내드릴게요.',
    lastTime: '오후 2:48',
    safetyNotice: '건전하고 안전한 학생 간 학습 멘토링을 위해 개인 연락처 요구 및 비방 행위는 자동 차단됩니다.',
    messages: [
      { id: 'm-1', sender: 'peer', text: '안녕하세요! 의약학 세특 글 보고 1:1 질문 주셔서 연락드렸어요.', time: '오후 2:30' },
      { id: 'm-2', sender: 'me', text: '선배님 안녕하세요! 아까 미하엘리스-멘텐 곡선 관련해서 답변 정말 도움 많이 되었습니다 ㅠㅠ', time: '오후 2:32' },
      { id: 'm-3', sender: 'me', text: '혹시 고2 수준에서 실제 실험 진행할 때 오차 줄이는 팁이 있을까요?', time: '오후 2:35' },
      { id: 'm-4', sender: 'peer', text: '네! 카탈레이스 기질 농도별 속도 공식 유도한 노트 사진 보내드릴게요.', time: '오후 2:48' }
    ]
  },
  {
    id: 'chat-room-2',
    peerName: '코드마스터27 (컴공 선배)',
    peerSchool: '하나고 2학년',
    avatar: 'Code',
    avatarBg: 'bg-blue-500',
    unreadCount: 0,
    lastMessage: '깃허브 리포지토리 링크 확인해보세요!',
    lastTime: '어제',
    safetyNotice: '학생 간 안전한 교류를 위해 욕설 및 유해 콘텐츠 필터링이 적용 중입니다.',
    messages: [
      { id: 'm-21', sender: 'me', text: '안녕하세요! RAG 파이썬 코드 오픈소스 사용하신 건가요?', time: '어제 오후 5:10' },
      { id: 'm-22', sender: 'peer', text: '네 맞아요! LangChain이랑 OpenAI API 대신 로컬 Ollama 모델 썼어요.', time: '어제 오후 5:15' },
      { id: 'm-23', sender: 'peer', text: '깃허브 리포지토리 링크 확인해보세요!', time: '어제 오후 5:16' }
    ]
  }
];
