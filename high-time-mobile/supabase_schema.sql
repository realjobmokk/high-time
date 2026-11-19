-- =============================================================================
-- 🎓 HighTime (고교타임) - AWS 서울 리전 기반 PostgreSQL 데이터베이스 스키마 (SQL)
-- Supabase 대시보드의 [SQL Editor] 창에 붙여넣고 [Run]을 누르면 테이블이 자동 생성됩니다.
-- =============================================================================

-- 1. 학생 사용자 및 학교 인증 테이블 (users)
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id TEXT UNIQUE,
  password TEXT,
  name TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '고2',
  school_id TEXT NOT NULL DEFAULT '',
  school_name TEXT NOT NULL DEFAULT '',
  pass_verified BOOLEAN NOT NULL DEFAULT true,
  cert_verified BOOLEAN NOT NULL DEFAULT true,
  verified_at TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 users 테이블에 아이디(중복 불가)/비밀번호 컬럼 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. 전국 전공게시판 테이블 (major_posts)
CREATE TABLE IF NOT EXISTS public.major_posts (
  id TEXT PRIMARY KEY,
  major_id TEXT NOT NULL,
  major_name TEXT NOT NULL,
  tag TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_nickname TEXT NOT NULL,
  author_school TEXT NOT NULL,
  author_grade TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  avatar_color TEXT NOT NULL DEFAULT '#3b82f6',
  likes INTEGER NOT NULL DEFAULT 0,
  scraps INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  is_mine BOOLEAN NOT NULL DEFAULT true,
  created_at_label TEXT NOT NULL DEFAULT '방금 전',
  comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. 우리학교 전용 게시판 테이블 (school_posts)
CREATE TABLE IF NOT EXISTS public.school_posts (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL DEFAULT 'daehyeon',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  grade TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  is_mine BOOLEAN NOT NULL DEFAULT true,
  likes INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at_label TEXT NOT NULL DEFAULT '방금 전',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 school_posts 테이블에 댓글(JSONB) 컬럼 추가
ALTER TABLE public.school_posts ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4. 1:1 질문 테이블 (direct_questions)
CREATE TABLE IF NOT EXISTS public.direct_questions (
  id TEXT PRIMARY KEY,
  target_author TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  status TEXT NOT NULL DEFAULT '답변대기중',
  created_at_label TEXT NOT NULL DEFAULT '방금 전',
  answered_at_label TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. 개발/실습 편의를 위해 Row Level Security(RLS) 읽기/쓰기 허용 정책 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.major_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to major_posts" ON public.major_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to school_posts" ON public.school_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to direct_questions" ON public.direct_questions FOR ALL USING (true) WITH CHECK (true);

-- 6. 1:1 채팅방 및 메시지 전용 테이블 (관계형 분리 구조)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id TEXT PRIMARY KEY,
  user_a_key TEXT NOT NULL,
  user_a_name TEXT NOT NULL,
  user_a_school TEXT NOT NULL DEFAULT '',
  user_b_key TEXT NOT NULL,
  user_b_name TEXT NOT NULL,
  user_b_school TEXT NOT NULL DEFAULT '',
  avatar_bg TEXT NOT NULL DEFAULT '#dc2626',
  safety_notice TEXT NOT NULL DEFAULT '개인 연락처(전화번호·SNS) 요구 및 비속어는 자동 차단됩니다.',
  last_message TEXT NOT NULL DEFAULT '',
  last_time TEXT NOT NULL DEFAULT '방금 전',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_key TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  time_label TEXT NOT NULL DEFAULT '방금 전',
  read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 채팅방별 메시지 시간순 조회 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON public.chat_messages (room_id, created_at ASC);

-- 채팅 테이블 RLS 허용 정책
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to chat_rooms" ON public.chat_rooms;
CREATE POLICY "Allow public access to chat_rooms" ON public.chat_rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access to chat_messages" ON public.chat_messages;
CREATE POLICY "Allow public access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Supabase Realtime 실시간 구독 활성화
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.major_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.school_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
