// =============================================================================
// 🗄️ HighTime (고교타임) - Supabase (PostgreSQL on AWS) 데이터베이스 연동 서비스
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  MajorPost,
  SchoolPost,
  DirectQuestion,
  AdmissionConsult,
  PostComment,
  CurrentUser,
  School,
  ChatRoom,
} from '../types';

// -----------------------------------------------------------------------------
// 🔑 [여기에 발급받은 Supabase Project URL과 Publishable API Key를 입력합니다]
// -----------------------------------------------------------------------------
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://caxkxzlvusyqywdixuhh.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_4ZkmCO4uigObXWSAbK7Iig_REMHeNhD';

// URL과 Key가 설정되었는지 확인하는 헬퍼 함수
export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('https://') &&
      SUPABASE_ANON_KEY.length > 20
  );
}

// Supabase 클라이언트 인스턴스 (설정되어 있을 때만 생성)
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// =============================================================================
// 1. 전공게시판 (major_posts) DB 조회 / 저장 / 수정 / 삭제
// =============================================================================

/** DB에서 전공게시판 글 목록 불러오기 */
export async function fetchMajorPostsFromDb(): Promise<MajorPost[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('major_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('전공게시판 DB 조회 실패:', error?.message);
    return null;
  }

  return data
    .filter((row: any) => {
      const id = String(row.id || '');
      return (
        !id.startsWith('chatroom_') &&
        !id.startsWith('school_comments_') &&
        !id.startsWith('consult_') &&
        row.topic !== '우리학교 댓글' &&
        row.status !== '동기화'
      );
    })
    .map((row: any) => ({
    id: row.id,
    majorId: row.major_id,
    majorName: row.major_name,
    tag: row.tag,
    title: row.title,
    content: row.content,
    author: {
      nickname: row.author_nickname,
      school: row.author_school,
      grade: row.author_grade,
      isAnonymous: row.is_anonymous,
      avatarColor: row.avatar_color,
    },
    likes: row.likes,
    scraps: row.scraps,
    commentCount: row.comment_count,
    isMine: false, // 로그인한 사용자(이름+학교) 기준으로 클라이언트에서 동적 판별
    createdAt: row.created_at_label,
    comments: Array.isArray(row.comments) ? row.comments : [],
  }));
}

/** 전공게시판 새 글을 DB에 저장 */
export async function insertMajorPostToDb(post: MajorPost): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('major_posts').upsert({
    id: post.id,
    major_id: post.majorId,
    major_name: post.majorName,
    tag: post.tag,
    title: post.title,
    content: post.content,
    author_nickname: post.author.nickname,
    author_school: post.author.school,
    author_grade: post.author.grade,
    is_anonymous: post.author.isAnonymous,
    avatar_color: post.author.avatarColor,
    likes: post.likes,
    scraps: post.scraps,
    comment_count: post.commentCount,
    is_mine: Boolean(post.isMine),
    created_at_label: post.createdAt,
    comments: post.comments || [],
  });

  if (error) {
    console.warn('전공게시판 DB 저장 실패:', error.message);
    return false;
  }
  return true;
}

/** 전공게시판 좋아요 및 댓글 DB 업데이트 */
export async function updateMajorPostInDb(
  postId: string,
  updates: { likes?: number; comments?: PostComment[]; commentCount?: number }
): Promise<boolean> {
  if (!supabase) return false;

  const payload: Record<string, any> = {};
  if (typeof updates.likes === 'number') payload.likes = updates.likes;
  if (updates.comments !== undefined) payload.comments = updates.comments;
  if (typeof updates.commentCount === 'number') payload.comment_count = updates.commentCount;

  const { error } = await supabase.from('major_posts').update(payload).eq('id', postId);
  return !error;
}



/** 전공게시판 글 DB에서 삭제 */
export async function deleteMajorPostFromDb(postId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('major_posts').delete().eq('id', postId);
  return !error;
}



// =============================================================================
// 2. 우리학교 게시판 (school_posts) DB 조회 / 저장 / 삭제
// =============================================================================

/** DB에서 우리학교 게시판 글 목록 불러오기 */
export async function fetchSchoolPostsFromDb(schoolId = 'daehyeon'): Promise<SchoolPost[] | null> {
  if (!supabase) return null;

  const [{ data, error }, { data: commentRows }] = await Promise.all([
    supabase
      .from('school_posts')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('direct_questions')
      .select('id, answer')
      .like('id', 'school_comments_%'),
  ]);

  if (error || !data) {
    console.warn('우리학교 게시판 DB 조회 실패:', error?.message);
    return null;
  }

  // 클라우드 보조 저장소(direct_questions)에 저장된 댓글 매핑
  const cloudCommentsMap = new Map<string, any[]>();
  for (const cr of commentRows || []) {
    try {
      const postId = String(cr.id || '').replace('school_comments_', '');
      const parsed = JSON.parse(cr.answer || '[]');
      if (postId && Array.isArray(parsed)) {
        cloudCommentsMap.set(postId, parsed);
      }
    } catch {}
  }

  return data
    .filter((row: any) => !String(row.id || '').startsWith('chatroom_'))
    .map((row: any) => {
      const cloudComments = cloudCommentsMap.get(row.id) || [];
      const comments =
        Array.isArray(row.comments) && row.comments.length > 0
          ? row.comments
          : cloudComments;

      return {
        id: row.id,
        category: row.category,
        title: row.title,
        content: row.content,
        author: row.author,
        grade: row.grade,
        isAnonymous: row.is_anonymous,
        isMine: false, // 로그인한 사용자(이름+학교) 기준으로 클라이언트에서 동적 판별
        likes: row.likes,
        commentCount: Math.max(row.comment_count || 0, comments.length),
        comments,
        createdAt: row.created_at_label,
      };
    });
}

/** 우리학교 게시판 새 글을 DB에 저장 */
export async function insertSchoolPostToDb(
  post: SchoolPost,
  schoolId = 'daehyeon'
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('school_posts').upsert({
    id: post.id,
    school_id: schoolId,
    category: post.category,
    title: post.title,
    content: post.content,
    author: post.author,
    grade: post.grade,
    is_anonymous: post.isAnonymous,
    is_mine: post.isMine,
    likes: post.likes,
    comment_count: post.commentCount,
    created_at_label: post.createdAt,
  });

  if (error) {
    console.warn('우리학교 게시판 DB 저장 실패:', error.message);
    return false;
  }
  return true;
}

/** 우리학교 게시판 글 DB에서 삭제 */
export async function deleteSchoolPostFromDb(postId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('school_posts').delete().eq('id', postId);
  return !error;
}

/** 우리학교 게시판 좋아요 및 댓글 수/목록 업데이트 (모든 기기 클라우드 동기화) */
export async function updateSchoolPostInteractionInDb(
  postId: string,
  likes: number,
  commentCount: number,
  comments?: any[]
): Promise<boolean> {
  if (!supabase) return false;

  // 1순위: school_posts.comments 컬럼 포함 업데이트 시도
  const updatePayload: any = { likes, comment_count: commentCount };
  if (comments) updatePayload.comments = comments;

  const { error } = await supabase
    .from('school_posts')
    .update(updatePayload)
    .eq('id', postId);

  if (error) {
    // school_posts.comments 컬럼이 아직 없는 경우 likes/comment_count만 업데이트
    await supabase
      .from('school_posts')
      .update({ likes, comment_count: commentCount })
      .eq('id', postId);
  }

  return true;
}



// =============================================================================
// 3. 1:1 질문 (direct_questions) DB 조회 / 저장
// =============================================================================

export async function fetchDirectQuestionsFromDb(): Promise<DirectQuestion[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('direct_questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return null;

  return data
    .filter((row: any) => {
      const id = String(row.id || '');
      return (
        !id.startsWith('chatroom_') &&
        !id.startsWith('school_comments_') &&
        !id.startsWith('consult_') &&
        row.topic !== '우리학교 댓글' &&
        row.status !== '동기화'
      );
    })
    .map((row: any) => ({
    id: row.id,
    targetAuthor: row.target_author,
    topic: row.topic,
    question: row.question,
    answer: row.answer,
    status: row.status,
    createdAt: row.created_at_label,
    answeredAt: row.answered_at_label,
    isPublic: row.is_public,
  }));
}

export async function insertDirectQuestionToDb(q: DirectQuestion): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('direct_questions').upsert({
    id: q.id,
    target_author: q.targetAuthor,
    topic: q.topic,
    question: q.question,
    answer: q.answer,
    status: q.status,
    created_at_label: q.createdAt,
    answered_at_label: q.answeredAt,
    is_public: q.isPublic,
  });

  return !error;
}

export async function updateDirectQuestionAnswerInDb(
  questionId: string,
  answer: string,
  status: '답변완료' | '답변대기중',
  answeredAt: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('direct_questions')
    .update({
      answer,
      status,
      answered_at_label: answeredAt,
    })
    .eq('id', questionId);

  return !error;
}
// =============================================================================

export async function fetchAdmissionConsultsFromDb(): Promise<AdmissionConsult[] | null> {
  if (!supabase) return null;

  // 1순위: admission_consults 전용 테이블 조회
  const { data: dedicatedRows, error: dedicatedErr } = await supabase
    .from('admission_consults')
    .select('*')
    .order('created_at', { ascending: false });

  if (!dedicatedErr && Array.isArray(dedicatedRows)) {
    return dedicatedRows.map((row: any) => ({
      id: row.id,
      category: row.category,
      targetMajor: row.target_major,
      targetSchool: row.target_school,
      gradeAverage: row.grade_average,
      title: row.title,
      content: row.content,
      expertAdvice: row.expert_advice,
      expertName: row.expert_name,
      status: row.status,
      createdAt: row.created_at_label,
    }));
  }

  // 폴백: 아직 전용 테이블 미생성 시 direct_questions 조회
  const { data, error } = await supabase
    .from('direct_questions')
    .select('*')
    .like('id', 'consult_%')
    .order('created_at', { ascending: false });

  if (error || !data) return null;

  const list: AdmissionConsult[] = [];
  for (const row of data) {
    try {
      const parsed = JSON.parse(row.answer || '{}');
      if (parsed && parsed.id) {
        list.push(parsed as AdmissionConsult);
      }
    } catch {}
  }
  return list;
}

export async function insertAdmissionConsultToDb(consult: AdmissionConsult): Promise<boolean> {
  if (!supabase) return false;

  // 1순위: admission_consults 전용 테이블에 저장
  const { error: dedicatedErr } = await supabase.from('admission_consults').upsert({
    id: consult.id,
    category: consult.category,
    target_major: consult.targetMajor,
    target_school: consult.targetSchool,
    grade_average: consult.gradeAverage,
    title: consult.title,
    content: consult.content,
    expert_advice: consult.expertAdvice,
    expert_name: consult.expertName,
    status: consult.status,
    created_at_label: consult.createdAt,
  } as any);

  if (!dedicatedErr) return true;

  // 폴백: 전용 테이블 미생성 시 direct_questions에 임시 저장
  const dbId = consult.id.startsWith('consult_') ? consult.id : `consult_${consult.id}`;
  const { error } = await supabase.from('direct_questions').upsert({
    id: dbId,
    target_author: consult.targetMajor || '입시 컨설팅',
    topic: consult.category || '입시 컨설팅',
    question: consult.title,
    answer: JSON.stringify(consult),
    status: consult.status,
    created_at_label: consult.createdAt,
    answered_at_label: consult.createdAt,
    is_public: true,
  } as any);

  return !error;
}

// =============================================================================
// 3-B. 카카오톡 스타일 실시간 1:1 채팅방 DB 조회 / 저장 / Realtime 구독
// =============================================================================

export interface StoredChatMessage {
  id: string;
  senderKey: string;
  senderName: string;
  text: string;
  time: string;
  readBy: string[];
}

export interface StoredChatRoomPayload {
  roomId: string;
  userAKey: string;
  userAName: string;
  userASchool: string;
  userBKey: string;
  userBName: string;
  userBSchool: string;
  avatarBg: string;
  safetyNotice: string;
  messages: StoredChatMessage[];
}

export interface ChatPeerOption {
  key: string;
  loginId?: string;
  name: string;
  school: string;
  grade: string;
}

export function buildUserChatKey(
  username?: string,
  name?: string,
  schoolName?: string
): string {
  if (username && username.trim()) return username.trim().toLowerCase();
  return `${(schoolName || '').trim()}::${(name || '').trim()}`;
}

export function buildPairRoomId(key1: string, key2: string): string {
  const sorted = [key1.trim().toLowerCase(), key2.trim().toLowerCase()].sort();
  const safe = sorted.join('__').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
  return `chatroom_${safe}`;
}

/**
 * 가입된 다른 학생 목록 조회 (새 1:1 채팅 시작하기용)
 */
export async function fetchRegisteredChatPeers(
  myKey: string,
  myName: string,
  mySchool: string
): Promise<ChatPeerOption[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('users')
    .select('login_id, name, school_name, grade')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error || !data) return [];

  const seen = new Set<string>();
  const peers: ChatPeerOption[] = [];
  for (const row of data) {
    const pKey = buildUserChatKey(row.login_id, row.name, row.school_name);
    if (!row.name) continue;
    // 자기 자신 제외
    if (
      pKey === myKey ||
      (row.name === myName && row.school_name === mySchool)
    ) {
      continue;
    }
    if (seen.has(pKey)) continue;
    seen.add(pKey);
    peers.push({
      key: pKey,
      loginId: row.login_id || undefined,
      name: row.name,
      school: row.school_name || '고등학교',
      grade: row.grade || '고2',
    });
  }
  return peers;
}

/**
 * 내가 참여한 1:1 채팅방 목록을 Supabase(chat_rooms + chat_messages)에서 불러와 변환
 */
export async function fetchChatRoomsFromDb(
  myKey: string,
  myName: string,
  mySchool: string
): Promise<ChatRoom[] | null> {
  if (!supabase) return null;

  const { data: roomRows, error: roomErr } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('updated_at', { ascending: false });

  if (roomErr || !Array.isArray(roomRows)) return null;

  const norm = (s: any) => String(s || '').replace(/\s+/g, '').toLowerCase();
  const cleanMyName = norm(myName);
  const cleanMySchool = norm(mySchool);
  const cleanMyKey = norm(myKey);

  const myRoomRows = roomRows.filter((r: any) => {
    const isUserA =
      norm(r.user_a_key) === cleanMyKey ||
      (norm(r.user_a_name) === cleanMyName && norm(r.user_a_school) === cleanMySchool);
    const isUserB =
      norm(r.user_b_key) === cleanMyKey ||
      (norm(r.user_b_name) === cleanMyName && norm(r.user_b_school) === cleanMySchool);
    return isUserA || isUserB;
  });

  if (myRoomRows.length === 0) return [];

  const roomIds = myRoomRows.map((r: any) => r.id);
  const { data: msgRows } = await supabase
    .from('chat_messages')
    .select('*')
    .in('room_id', roomIds)
    .order('created_at', { ascending: true });

  const msgsByRoom = new Map<string, any[]>();
  for (const m of msgRows || []) {
    const list = msgsByRoom.get(m.room_id) || [];
    list.push(m);
    msgsByRoom.set(m.room_id, list);
  }

  return myRoomRows.map((r: any) => {
    const isUserA =
      norm(r.user_a_key) === cleanMyKey ||
      (norm(r.user_a_name) === cleanMyName && norm(r.user_a_school) === cleanMySchool);
    const peerName = String((isUserA ? r.user_b_name : r.user_a_name) || '학생')
      .replace(/[\r\n]+/g, '')
      .trim();
    const peerSchool = String((isUserA ? r.user_b_school : r.user_a_school) || '')
      .replace(/[\r\n]+/g, '')
      .trim();
    const peerKey = isUserA ? r.user_b_key : r.user_a_key;
    const rawMsgs = msgsByRoom.get(r.id) || [];
    const lastRaw = rawMsgs[rawMsgs.length - 1];

    const unreadCount = rawMsgs.filter((m) => {
      const readBy: string[] = Array.isArray(m.read_by) ? m.read_by : [];
      return m.sender_key !== myKey && !readBy.includes(myKey);
    }).length;

    return {
      id: r.id,
      peerKey,
      peerName,
      peerSchool,
      avatar: peerName.slice(0, 1),
      avatarBg: r.avatar_bg || '#dc2626',
      unreadCount,
      lastMessage: lastRaw ? lastRaw.text : r.last_message || '대화를 시작해 보세요!',
      lastTime: lastRaw ? lastRaw.time_label : r.last_time || '방금 전',
      safetyNotice:
        r.safety_notice ||
        '개인 연락처(전화번호·SNS) 요구 및 비속어는 자동 차단됩니다.',
      messages: rawMsgs.map((m) => {
        const isMe =
          m.sender_key === myKey || (m.sender_name === myName && !m.sender_key);
        const readBy: string[] = Array.isArray(m.read_by) ? m.read_by : [];
        const peerRead = readBy.some((k) => k !== myKey);
        return {
          id: m.id,
          sender: isMe ? 'me' : 'peer',
          senderKey: m.sender_key,
          senderName: m.sender_name,
          text: m.text,
          time: m.time_label,
          isRead: isMe ? peerRead : readBy.includes(myKey),
        };
      }),
    };
  });
}

/**
 * 1:1 채팅방에 새 메시지를 추가(chat_messages INSERT)하고 방 요약(chat_rooms) 갱신
 */
export async function upsertChatMessageToDb(params: {
  roomId: string;
  myKey: string;
  myName: string;
  mySchool: string;
  peerKey: string;
  peerName: string;
  peerSchool: string;
  avatarBg?: string;
  newMessage: { id: string; text: string; time: string };
}): Promise<boolean> {
  if (!supabase) return false;

  // 기존 방 존재 여부 확인 후 생성 또는 요약 갱신 (참여자 A/B 순서 유지)
  const { data: existingRoom } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('id', params.roomId)
    .limit(1);

  if (existingRoom && existingRoom.length > 0) {
    const { error: updateErr } = await supabase
      .from('chat_rooms')
      .update({
        last_message: params.newMessage.text,
        last_time: params.newMessage.time,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', params.roomId);
    if (updateErr) return false;
  } else {
    const { error: insertRoomErr } = await supabase.from('chat_rooms').insert({
      id: params.roomId,
      user_a_key: params.myKey,
      user_a_name: params.myName,
      user_a_school: params.mySchool,
      user_b_key: params.peerKey,
      user_b_name: params.peerName,
      user_b_school: params.peerSchool,
      avatar_bg: params.avatarBg || '#dc2626',
      last_message: params.newMessage.text,
      last_time: params.newMessage.time,
      updated_at: new Date().toISOString(),
    } as any);
    if (insertRoomErr) return false;
  }

  const { error: msgInsertErr } = await supabase.from('chat_messages').insert({
    id: params.newMessage.id,
    room_id: params.roomId,
    sender_key: params.myKey,
    sender_name: params.myName,
    text: params.newMessage.text,
    time_label: params.newMessage.time,
    read_by: [params.myKey],
  } as any);

  return !msgInsertErr;
}

/**
 * 채팅방 입장 시 상대방 메시지를 읽음 처리 (chat_messages.read_by 업데이트)
 */
export async function markChatRoomReadInDb(
  roomId: string,
  readerKey: string
): Promise<void> {
  if (!supabase) return;

  const { data: msgRows, error: msgErr } = await supabase
    .from('chat_messages')
    .select('id, read_by')
    .eq('room_id', roomId);

  if (msgErr || !Array.isArray(msgRows)) return;

  const toUpdate = msgRows.filter((m: any) => {
    const readBy: string[] = Array.isArray(m.read_by) ? m.read_by : [];
    return !readBy.includes(readerKey);
  });

  for (const m of toUpdate) {
    const readBy: string[] = Array.isArray(m.read_by) ? m.read_by : [];
    await supabase
      .from('chat_messages')
      .update({ read_by: [...readBy, readerKey] } as any)
      .eq('id', m.id);
  }
}

/**
 * Supabase Realtime 구독 + 실시간 채팅 변경 감지 (chat_messages / chat_rooms)
 */
export function subscribeChatRoomsRealtime(onUpdate: () => void): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('hightime-chat-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => {
        onUpdate();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_rooms' },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    try {
      supabase?.removeChannel(channel);
    } catch {}
  };
}

/**
 * Supabase Realtime 구독 + 전공/우리학교 게시판 실시간 변경 감지
 */
export function subscribePostsRealtime(
  onMajorUpdate: () => void,
  onSchoolUpdate: () => void
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel('hightime-posts-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'major_posts' },
      () => {
        onMajorUpdate();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'school_posts' },
      () => {
        onSchoolUpdate();
      }
    )
    .subscribe();

  return () => {
    try {
      supabase?.removeChannel(channel);
    } catch {}
  };
}

// =============================================================================
// 4. 학생 계정 및 인증 정보 (users) DB 저장 / 조회
// =============================================================================

// 이전에 임시로 사용하던 로컬 계정 저장소 키가 남아 있으면 정리
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hightime_accounts_registry_v1');
  }
} catch {}

/**
 * [아이디 중복 확인]
 * 입력한 아이디(login_id)가 이미 Supabase DB에 존재하는지 확인합니다.
 * - 사용 가능하면 true, 이미 사용 중(중복)이면 false 반환
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || trimmed.length < 3) return false;

  if (!supabase) return false;

  const { data, error } = await supabase
    .from('users')
    .select('login_id')
    .eq('login_id', trimmed)
    .limit(1);

  if (error) return false;
  return !data || data.length === 0;
}

/**
 * [아이디 + 비밀번호 기반 신규 회원가입 저장]
 * Supabase users 테이블의 login_id, password 컬럼에 직접 저장합니다.
 */
export async function registerAccountToDb(
  user: CurrentUser,
  school: School,
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  if (!supabase) {
    return { success: false, message: 'Supabase 연결이 설정되어 있지 않습니다.' };
  }

  const trimmedId = username.trim().toLowerCase();
  const available = await checkUsernameAvailable(trimmedId);
  if (!available) {
    return { success: false, message: '이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.' };
  }

  const { error } = await supabase.from('users').insert({
    login_id: trimmedId,
    password,
    name: user.name,
    grade: user.grade,
    school_id: school.id,
    school_name: school.name,
    pass_verified: user.passVerified,
    cert_verified: user.certVerified,
    verified_at: user.verifiedAt,
  });

  if (error) {
    // 중복 제약 위반 시
    if (error.code === '23505') {
      return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }
    return { success: false, message: `회원 저장 중 오류가 발생했습니다: ${error.message}` };
  }

  return { success: true };
}

/**
 * [아이디 + 비밀번호 기반 로그인 검증]
 * Supabase DB에 저장된 login_id와 password가 모두 일치하는 경우에만 회원 정보를 반환합니다.
 */
export async function loginWithUsernamePassword(
  username: string,
  password: string
): Promise<{
  username: string;
  name: string;
  grade: string;
  schoolId: string;
  schoolName: string;
  passVerified: boolean;
  certVerified: boolean;
  verifiedAt: string;
} | null> {
  const trimmedId = username.trim().toLowerCase();
  if (!trimmedId || !password || !supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('login_id', trimmedId)
    .eq('password', password)
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    username: row.login_id || trimmedId,
    name: row.name,
    grade: row.grade,
    schoolId: row.school_id,
    schoolName: row.school_name,
    passVerified: row.pass_verified,
    certVerified: row.cert_verified,
    verifiedAt: row.verified_at,
  };
}

/** 소셜 로그인 + PASS 본인인증 + 재학증명서 PDF 대조 검증 완료된 학생 정보를 DB에 저장 */
export async function saveVerifiedUserToDb(
  user: CurrentUser,
  school: School
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('users').insert({
    name: user.name,
    grade: user.grade,
    school_id: school.id,
    school_name: school.name,
    pass_verified: user.passVerified,
    cert_verified: user.certVerified,
    verified_at: user.verifiedAt,
  });

  if (error) {
    console.warn('사용자 인증 정보 DB 저장 오류:', error.message);
    return false;
  }
  return true;
}

/** 가장 최근에 인증 완료된 학생 정보를 DB에서 불러오기 */
export async function fetchLatestVerifiedUserFromDb(): Promise<{
  name: string;
  grade: string;
  schoolId: string;
  schoolName: string;
  passVerified: boolean;
  certVerified: boolean;
  verifiedAt: string;
} | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    name: row.name,
    grade: row.grade,
    schoolId: row.school_id,
    schoolName: row.school_name,
    passVerified: row.pass_verified,
    certVerified: row.cert_verified,
    verifiedAt: row.verified_at,
  };
}

/**
 * [로그인 전용 검증 함수]
 * 입력한 학생 이름(및 선택적 학교명)이 Supabase(AWS PostgreSQL) `users` 테이블에 실제로 가입되어 있는지 확인합니다.
 * - DB에 존재하면 해당 회원의 저장된 정보(이름, 학년, 학교ID, 학교명 등)를 반환하고
 * - DB에 없으면 null을 반환하여 로그인이 차단되도록 합니다.
 */
export async function verifyRegisteredUserInDb(
  name: string,
  schoolName?: string
): Promise<{
  id: string;
  name: string;
  grade: string;
  schoolId: string;
  schoolName: string;
  passVerified: boolean;
  certVerified: boolean;
  verifiedAt: string;
} | null> {
  if (!supabase) return null;

  const trimmedName = name.trim();
  if (!trimmedName) return null;

  let query = supabase
    .from('users')
    .select('*')
    .eq('name', trimmedName)
    .order('created_at', { ascending: false });

  if (schoolName && schoolName.trim()) {
    query = query.ilike('school_name', `%${schoolName.trim()}%`);
  }

  const { data, error } = await query.limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    id: row.id,
    name: row.name,
    grade: row.grade,
    schoolId: row.school_id,
    schoolName: row.school_name,
    passVerified: row.pass_verified,
    certVerified: row.cert_verified,
    verifiedAt: row.verified_at,
  };
}

// =============================================================================
// 6. Supabase Google OAuth 소셜 로그인 / 세션 조회 / 로그아웃
// =============================================================================

export interface GoogleOAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

/** Google OAuth 로그인 시작 (브라우저에서 구글 계정 선택 창으로 이동) */
export async function signInWithGoogleOAuth(): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  if (!supabase) {
    return { ok: false, errorMessage: 'Supabase 연결 설정이 되어 있지 않습니다.' };
  }

  const redirectTo =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return { ok: false, errorMessage: error.message };
  }
  return { ok: true };
}

/** 현재 Supabase Auth 세션에서 Google 로그인 유저 정보 읽기 */
export async function getGoogleSessionUser(): Promise<GoogleOAuthUserInfo | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;

  const u = data.session.user;
  const meta = u.user_metadata || {};
  const displayName =
    meta.full_name ||
    meta.name ||
    (u.email ? u.email.split('@')[0] : '구글학생');

  return {
    id: u.id,
    email: u.email || '',
    name: String(displayName),
    avatarUrl: meta.avatar_url || meta.picture || undefined,
  };
}

/** Supabase Auth 로그아웃 */
export async function signOutSupabaseAuth(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}


