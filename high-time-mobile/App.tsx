// 🎓 HighTime (고교타임) - 대한민국 고등학생 커뮤니티 & 학교생활 플랫폼
// React Native + Expo TypeScript 메인 앱 파일

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';

// 타입 정의
import {
  CurrentUser,
  School,
  SocialProvider,
  MajorPost,
  SchoolPost,
  DirectQuestion,
  AdmissionConsult,
  ChatRoom,
  ChatMessage,
  NotificationItem,
  PostComment,
  CustomTimetableBlock,
} from './src/types';

// 초기 빈 데이터
import {
  INITIAL_MAJOR_POSTS,
  INITIAL_SCHOOL_POSTS,
  INITIAL_DIRECT_QUESTIONS,
  INITIAL_ADMISSION_CONSULTS,
  INITIAL_CHAT_ROOMS,
  INITIAL_NOTIFICATIONS,
} from './src/data/mockData';

// 컴포넌트 임포트
import { Header } from './src/components/Header';
import { BottomNav, TabType } from './src/components/BottomNav';
import { HomeTab } from './src/components/tabs/HomeTab';
import { MajorBoardTab } from './src/components/tabs/MajorBoardTab';
import { SchoolBoardTab } from './src/components/tabs/SchoolBoardTab';
import { CounselingTab } from './src/components/tabs/CounselingTab';
import { DirectChatTab } from './src/components/tabs/DirectChatTab';
import { ProfileTab } from './src/components/tabs/ProfileTab';
import { LoginScreen } from './src/components/LoginScreen';
import { PhoneModal } from './src/components/PhoneModal';

// 모달 임포트
import { AuthModal } from './src/modals/AuthModal';
import { NotificationModal } from './src/modals/NotificationModal';
import { WritePostModal } from './src/modals/WritePostModal';
import { PostDetailModal } from './src/modals/PostDetailModal';
import { AskQuestionModal } from './src/modals/AskQuestionModal';
import { ChatRequestModal } from './src/modals/ChatRequestModal';

// Supabase (PostgreSQL on AWS) 데이터베이스 서비스 임포트
import {
  isSupabaseConfigured,
  fetchMajorPostsFromDb,
  insertMajorPostToDb,
  updateMajorPostInDb,
  deleteMajorPostFromDb,
  fetchSchoolPostsFromDb,
  insertSchoolPostToDb,
  deleteSchoolPostFromDb,
  updateSchoolPostInteractionInDb,
  fetchDirectQuestionsFromDb,
  insertDirectQuestionToDb,
  updateDirectQuestionAnswerInDb,
  fetchAdmissionConsultsFromDb,
  insertAdmissionConsultToDb,
  saveVerifiedUserToDb,
  fetchLatestVerifiedUserFromDb,
  fetchChatRoomsFromDb,
  upsertChatMessageToDb,
  markChatRoomReadInDb,
  subscribeChatRoomsRealtime,
  subscribePostsRealtime,
  buildUserChatKey,
  buildPairRoomId,
} from './src/services/supabaseService';
import { searchNeisHighSchools } from './src/services/neisService';

export default function App() {
  // =========================================================
  //  1. 로그인 여부 & 사용자 · 소속 학교 상태
  // =========================================================
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 웹/모바일 브라우저에서 바깥 어두운 배경이 화면 끝까지 꽉 차도록 body/html 배경 동기화
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = '#0f172a';
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.margin = '0';
      document.body.style.minHeight = '100dvh';
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    socialProvider: 'kakao',
    email: '',
    name: '',
    nickname: '',
    bio: '',
    targetMajor: '컴퓨터·IT·인공지능',
    birthDate: '',
    telecom: 'SKT',
    phone: '',
    grade: '고2',
    certFileName: '',
    isVerified: false,
    passVerified: false,
    certVerified: false,
    verifiedAt: '',
  });

  const [currentSchool, setCurrentSchool] = useState<School>({
    id: '',
    name: '',
    region: '',
  });

  // =========================================================
  //  2. 탭 & UI 상태
  // =========================================================
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [counselingSubTab, setCounselingSubTab] = useState<'direct' | 'admission'>('direct');
  const [isChatRoomFullOpen, setIsChatRoomFullOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 채팅 탭에서 벗어나면 전체화면 대화방 상태 초기화
  useEffect(() => {
    if (activeTab !== 'chat') {
      setIsChatRoomFullOpen(false);
    }
  }, [activeTab]);
  const [isNotiModalOpen, setIsNotiModalOpen] = useState(false);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [writeTargetBoard, setWriteTargetBoard] = useState<'major' | 'school'>('major');
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MajorPost | null>(null);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askMode, setAskMode] = useState<'direct' | 'admission'>('direct');
  const [askDefaultTarget, setAskDefaultTarget] = useState('');
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [chatRequestPost, setChatRequestPost] = useState<MajorPost | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // =========================================================
  //  3. 콘텐츠 상태 (전공게시판 / 우리학교 / 상담 / 채팅 / 알림)
  // =========================================================
  const [majorPosts, setMajorPosts] = useState<MajorPost[]>(INITIAL_MAJOR_POSTS);
  const [schoolPosts, setSchoolPosts] = useState<SchoolPost[]>(INITIAL_SCHOOL_POSTS);
  const [directQuestions, setDirectQuestions] = useState<DirectQuestion[]>(INITIAL_DIRECT_QUESTIONS);
  const [admissionConsults, setAdmissionConsults] = useState<AdmissionConsult[]>(INITIAL_ADMISSION_CONSULTS);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(INITIAL_CHAT_ROOMS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // 로그인한 사용자별 고유 시간표 스토리지 키 생성 (다른 사용자와 절대 공유되지 않음)
  const getUserTimetableStorageKey = (
    userName: string,
    schoolName: string,
    username?: string
  ) =>
    username && username.trim()
      ? `hightime_user_timetable_id_${encodeURIComponent(username.trim())}`
      : `hightime_user_timetable_${encodeURIComponent(schoolName.trim())}_${encodeURIComponent(
          userName.trim()
        )}`;

  // 현재 로그인한 사용자가 직접 추가/편집하는 주간 시간표 블록 목록
  const [customTimetable, setCustomTimetable] = useState<CustomTimetableBlock[]>([]);

  // 로그인한 학생(이름 + 학교)이 바뀔 때마다 해당 학생 전용 시간표만 불러오기
  React.useEffect(() => {
    if (!isLoggedIn || !currentUser.name) {
      setCustomTimetable([]);
      return;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const key = getUserTimetableStorageKey(
          currentUser.name,
          currentSchool.name,
          currentUser.username
        );
        const saved = localStorage.getItem(key);
        setCustomTimetable(saved ? JSON.parse(saved) : []);
      }
    } catch {
      setCustomTimetable([]);
    }
  }, [isLoggedIn, currentUser.name, currentUser.username, currentSchool.name]);

  // 현재 로그인한 사용자의 시간표에 블록 추가 또는 수정 핸들러
  const handleAddOrUpdateTimetableBlock = (block: CustomTimetableBlock) => {
    setCustomTimetable((prev) => {
      const exists = prev.some((b) => b.id === block.id);
      const next = exists
        ? prev.map((b) => (b.id === block.id ? block : b))
        : [...prev, block];
      try {
        if (typeof localStorage !== 'undefined' && currentUser.name) {
          const key = getUserTimetableStorageKey(
            currentUser.name,
            currentSchool.name,
            currentUser.username
          );
          localStorage.setItem(key, JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  // 현재 로그인한 사용자의 시간표에서 블록 삭제 핸들러
  const handleDeleteTimetableBlock = (blockId: string) => {
    setCustomTimetable((prev) => {
      const next = prev.filter((b) => b.id !== blockId);
      try {
        if (typeof localStorage !== 'undefined' && currentUser.name) {
          const key = getUserTimetableStorageKey(
            currentUser.name,
            currentSchool.name,
            currentUser.username
          );
          localStorage.setItem(key, JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  };

  // 읽지 않은 알림 카운트
  const unreadNotiCount = notifications.filter((n) => !n.isRead).length;
  // 읽지 않은 채팅 카운트
  const unreadChatCount = chatRooms.reduce((sum, r) => sum + r.unreadCount, 0);

  // 현재 로그인한 사용자의 채팅 식별자
  const myChatKey = buildUserChatKey(currentUser.username, currentUser.name, currentSchool.name);
  // 이미 벨 알림으로 등록한 채팅 메시지 / 댓글 ID 기록 (중복 알림 방지 + 영구 저장)
  const seenChatNotiIdsRef = React.useRef<Set<string>>(new Set());
  const seenCommentNotiIdsRef = React.useRef<Set<string>>(new Set());

  const getSeenCommentStorageKey = (userKey: string) =>
    `hightime_seen_comment_notis_${userKey}`;

  const loadSeenCommentIds = (userKey: string): Set<string> => {
    try {
      if (typeof localStorage !== 'undefined' && userKey) {
        const raw = localStorage.getItem(getSeenCommentStorageKey(userKey));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return new Set(parsed.map(String));
        }
      }
    } catch {}
    return new Set();
  };

  const saveSeenCommentIds = (userKey: string, ids: Set<string>) => {
    try {
      if (typeof localStorage !== 'undefined' && userKey) {
        localStorage.setItem(
          getSeenCommentStorageKey(userKey),
          JSON.stringify(Array.from(ids))
        );
      }
    } catch {}
  };

  // 카카오톡 스타일 실시간 1:1 채팅방 동기화 (Supabase Realtime + 2.5초 주기 갱신)
  const refreshChatRooms = React.useCallback(async () => {
    if (!isLoggedIn || !currentUser.name || !isSupabaseConfigured()) return;
    const rooms = await fetchChatRoomsFromDb(myChatKey, currentUser.name, currentSchool.name);
    if (rooms) {
      setChatRooms(rooms);

      // 상대방이 보낸 안 읽은 새 메시지가 있으면 상단 벨 알림 센터에도 추가
      const incomingNotis: NotificationItem[] = [];
      for (const room of rooms) {
        if (room.unreadCount <= 0) continue;
        // 현재 이 채팅방을 전체화면으로 보고 있는 중이면 알림 생략
        if (activeTab === 'chat' && isChatRoomFullOpen && activeChatRoomId === room.id) {
          continue;
        }
        const unreadPeerMsgs = room.messages.filter(
          (m) => m.sender === 'peer' && !m.isRead && !seenChatNotiIdsRef.current.has(m.id)
        );
        for (const msg of unreadPeerMsgs) {
          seenChatNotiIdsRef.current.add(msg.id);
          incomingNotis.push({
            id: `chat-noti-${msg.id}`,
            type: 'chat',
            title: `${room.peerName}님의 1:1 채팅`,
            message: msg.text,
            time: msg.time || '방금 전',
            isRead: false,
            roomId: room.id,
          });
        }
      }

      if (incomingNotis.length > 0) {
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const fresh = incomingNotis.filter((n) => !existingIds.has(n.id));
          return fresh.length > 0 ? [...fresh.reverse(), ...prev] : prev;
        });
      }
    }
  }, [
    isLoggedIn,
    myChatKey,
    currentUser.name,
    currentSchool.name,
    activeTab,
    isChatRoomFullOpen,
    activeChatRoomId,
  ]);

  const refreshChatRoomsRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    refreshChatRoomsRef.current = refreshChatRooms;
  }, [refreshChatRooms]);

  React.useEffect(() => {
    if (!isLoggedIn) {
      setChatRooms([]);
      return;
    }
    refreshChatRoomsRef.current();
    // 로그인 중 WebSocket 채널이 탭/대화방 전환으로 끊기지 않도록 ref를 통해 1회만 구독
    const unsubscribe = subscribeChatRoomsRealtime(() => {
      refreshChatRoomsRef.current();
    });
    const poll = setInterval(() => {
      refreshChatRoomsRef.current();
    }, 2000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [isLoggedIn]);

  // Supabase (AWS PostgreSQL) 연결 시 DB 데이터 로드 + 내 글 댓글 실시간 알림 감지
  const syncMajorPostsAndCommentNotis = React.useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const dbMajor = await fetchMajorPostsFromDb();
    if (!dbMajor) return;
    setMajorPosts(dbMajor);

    if (!isLoggedIn || !currentUser.name) return;
    // 스토리지에 저장된 이미 확인한 댓글 ID 동기화 (로그인/새로고침 시 재알림 방지)
    const storedSeen = loadSeenCommentIds(myChatKey);
    storedSeen.forEach((id) => seenCommentNotiIdsRef.current.add(id));

    const incomingCommentNotis: NotificationItem[] = [];
    let addedSeen = false;
    for (const post of dbMajor) {
      const isMyPost =
        post.author.school === currentSchool.name &&
        (post.author.nickname === currentUser.name ||
          (Boolean(currentUser.nickname) && post.author.nickname === currentUser.nickname));
      if (!isMyPost) continue;

      for (const c of post.comments || []) {
        const commentAuthorName = c.author?.nickname || '';
        const isMyComment =
          c.author?.school === currentSchool.name &&
          (commentAuthorName === currentUser.name ||
            (Boolean(currentUser.nickname) && commentAuthorName === currentUser.nickname));
        if (isMyComment) continue;
        if (seenCommentNotiIdsRef.current.has(c.id)) continue;

        seenCommentNotiIdsRef.current.add(c.id);
        addedSeen = true;
        incomingCommentNotis.push({
          id: `comment-noti-${c.id}`,
          type: 'comment',
          title: `${commentAuthorName || '학생'}님이 내 글에 댓글을 남겼어요`,
          message: c.content,
          time: c.createdAt || '방금 전',
          isRead: false,
          postId: post.id,
        });
      }
    }

    if (addedSeen) {
      saveSeenCommentIds(myChatKey, seenCommentNotiIdsRef.current);
    }

    if (incomingCommentNotis.length > 0) {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const fresh = incomingCommentNotis.filter((n) => !existingIds.has(n.id));
        return fresh.length > 0 ? [...fresh.reverse(), ...prev] : prev;
      });
    }
  }, [isLoggedIn, myChatKey, currentUser.name, currentUser.nickname, currentSchool.name]);

  const syncMajorRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    syncMajorRef.current = syncMajorPostsAndCommentNotis;
  }, [syncMajorPostsAndCommentNotis]);

  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const refreshSchoolPosts = async () => {
      const dbSchool = await fetchSchoolPostsFromDb(currentSchool.id);
      if (dbSchool) setSchoolPosts(dbSchool);
    };

    (async () => {
      const [, dbSchool, dbQuestions, dbConsults] = await Promise.all([
        syncMajorRef.current(),
        fetchSchoolPostsFromDb(currentSchool.id),
        fetchDirectQuestionsFromDb(),
        fetchAdmissionConsultsFromDb(),
      ]);

      if (dbSchool) setSchoolPosts(dbSchool);
      if (dbQuestions) setDirectQuestions(dbQuestions);
      if (dbConsults) setAdmissionConsults(dbConsults);
    })();

    if (!isLoggedIn) return;
    const unsubscribePosts = subscribePostsRealtime(
      () => syncMajorRef.current(),
      () => refreshSchoolPosts()
    );
    const poll = setInterval(async () => {
      syncMajorRef.current();
      refreshSchoolPosts();
      const dbQuestions = await fetchDirectQuestionsFromDb();
      if (dbQuestions) setDirectQuestions(dbQuestions);
    }, 3500);
    return () => {
      unsubscribePosts();
      clearInterval(poll);
    };
  }, [currentSchool.id, isLoggedIn]);

  // =========================================================
  //  4. 핸들러 함수들
  // =========================================================

  /** 소속 학교 인증 뱃지 클릭 → 4단계 로그인/인증 모달 즉시 열기 */
  const handlePressSchoolBadge = () => {
    setIsAuthModalOpen(true);
  };

  /** 학생 로그인(DB 조회 완료) 또는 신규 4단계 회원가입 완료 핸들러 */
  const handleCompleteAuth = async (
    authData: {
      username?: string;
      socialProvider: SocialProvider;
      email: string;
      name: string;
      nickname?: string;
      birthDate: string;
      telecom: string;
      phone: string;
      grade: string;
      school: School;
      certFileName: string;
      passVerified: boolean;
      certVerified: boolean;
      verifiedAt: string;
    },
    isNewSignup = true
  ) => {
    let savedProfileImage: string | undefined;
    try {
      if (typeof localStorage !== 'undefined') {
        const imgKey = `hightime_profile_image_${encodeURIComponent(
          authData.username || `${authData.school.name}_${authData.name}`
        )}`;
        savedProfileImage = localStorage.getItem(imgKey) || undefined;
      }
    } catch {}

    const updatedUser: CurrentUser = {
      ...currentUser,
      username: authData.username || currentUser.username,
      socialProvider: authData.socialProvider,
      email: authData.email,
      name: authData.name,
      nickname: authData.nickname || `${authData.name}학생`,
      birthDate: authData.birthDate,
      telecom: authData.telecom,
      phone: authData.phone,
      grade: authData.grade,
      profileImage: savedProfileImage || currentUser.profileImage,
      certFileName: authData.certFileName,
      isVerified: true,
      passVerified: authData.passVerified,
      certVerified: authData.certVerified,
      verifiedAt: authData.verifiedAt,
    };

    setCurrentUser(updatedUser);
    setCurrentSchool(authData.school);
    setIsLoggedIn(true);

    // 신규 회원가입이거나 학교 재인증인 경우에만 Supabase(AWS PostgreSQL) users 테이블에 INSERT 저장
    if (isNewSignup) {
      await saveVerifiedUserToDb(updatedUser, authData.school);
    }
  };

  /** 하단 [프로필] 탭에서 내 프로필 수정 시 앱 전체 및 DB 즉시 업데이트 */
  const handleUpdateProfile = async (updated: {
    name: string;
    nickname: string;
    grade: string;
    targetMajor: string;
    bio: string;
    phone: string;
    profileImage?: string;
  }) => {
    const nextProfileImage =
      updated.profileImage !== undefined ? updated.profileImage : currentUser.profileImage;
    try {
      if (typeof localStorage !== 'undefined') {
        const imgKey = `hightime_profile_image_${encodeURIComponent(
          currentUser.username || `${currentSchool.name}_${updated.name}`
        )}`;
        if (nextProfileImage) {
          localStorage.setItem(imgKey, nextProfileImage);
        } else {
          localStorage.removeItem(imgKey);
        }
      }
    } catch {}

    const nextUser: CurrentUser = {
      ...currentUser,
      name: updated.name,
      nickname: updated.nickname,
      grade: updated.grade,
      targetMajor: updated.targetMajor,
      bio: updated.bio,
      phone: updated.phone,
      profileImage: nextProfileImage,
    };
    setCurrentUser(nextUser);
    await saveVerifiedUserToDb(nextUser, currentSchool);
  };

  /** 로그아웃 (처음 4단계 로그인 화면으로 돌아가기) */
  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('home');
  };

  /** 알림 모두 읽음 처리 */
  const handleMarkAllNotiRead = () => {
    setNotifications([]);
  };

  /** 글쓰기 모달 열기 */
  const [writeInitialSchoolCategory, setWriteInitialSchoolCategory] = useState('자유게시판');

  const handleOpenWriteModal = (
    targetBoard: 'major' | 'school',
    initialSchoolCategory?: string
  ) => {
    setWriteTargetBoard(targetBoard);
    setWriteInitialSchoolCategory(initialSchoolCategory || '자유게시판');
    setIsWriteModalOpen(true);
  };

  /** 전공게시판 글 등록 */
  const handleSubmitMajorPost = (post: MajorPost) => {
    setMajorPosts((prev) => [post, ...prev]);
    insertMajorPostToDb(post);
  };

  /** 우리학교 글 등록 */
  const handleSubmitSchoolPost = (post: SchoolPost) => {
    setSchoolPosts((prev) => [post, ...prev]);
    insertSchoolPostToDb(post, currentSchool.id);
  };

  /** 우리학교 글 좋아요 토글 */
  const handleToggleSchoolLike = (postId: string) => {
    setSchoolPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextLiked = !post.isLikedByUser;
        const nextLikes = Math.max(0, post.likes + (nextLiked ? 1 : -1));
        updateSchoolPostInteractionInDb(
          postId,
          nextLikes,
          (post.comments || []).length || post.commentCount,
          post.comments
        );
        return { ...post, isLikedByUser: nextLiked, likes: nextLikes };
      })
    );
  };

  /** 우리학교 글 댓글 등록 */
  const handleAddSchoolComment = (postId: string, content: string, isAnonymous: boolean) => {
    const newComment = {
      id: `sc-${Date.now()}`,
      author: currentUser.name || '학생',
      grade: currentUser.grade || '고2',
      isAnonymous,
      content,
      createdAt: '방금 전',
    };
    setSchoolPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextComments = [...(post.comments || []), newComment];
        updateSchoolPostInteractionInDb(postId, post.likes, nextComments.length, nextComments);
        return {
          ...post,
          comments: nextComments,
          commentCount: nextComments.length,
        };
      })
    );
  };

  /** 우리학교 글 댓글 삭제 */
  const handleDeleteSchoolComment = (postId: string, commentId: string) => {
    setSchoolPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextComments = (post.comments || []).filter((c) => c.id !== commentId);
        updateSchoolPostInteractionInDb(postId, post.likes, nextComments.length, nextComments);
        return {
          ...post,
          comments: nextComments,
          commentCount: nextComments.length,
        };
      })
    );
  };

  /** 전공게시판 글 삭제 (이름 + 소속 학교가 모두 일치하는 내 글만 삭제 가능) */
  const handleDeleteMajorPost = (postId: string, skipConfirm = false) => {
    const target = majorPosts.find((p) => p.id === postId);
    const isActuallyMine =
      target &&
      target.author.school === currentSchool.name &&
      (target.author.nickname === currentUser.name ||
        (Boolean(currentUser.nickname) && target.author.nickname === currentUser.nickname));

    if (!isActuallyMine) {
      Alert.alert('권한 없음', '본인이 작성한 글만 삭제할 수 있습니다.');
      return;
    }

    const executeDelete = () => {
      setMajorPosts((prev) => prev.filter((p) => p.id !== postId));
      deleteMajorPostFromDb(postId);
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setIsPostDetailOpen(false);
      }
    };

    if (skipConfirm) {
      executeDelete();
      return;
    }

    setDeleteConfirmModal({
      title: '게시글 삭제',
      message: '삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.',
      onConfirm: executeDelete,
    });
  };

  /** 우리학교 글 삭제 (본인 글만 삭제 가능) */
  const handleDeleteSchoolPost = (postId: string) => {
    const target = schoolPosts.find((p) => p.id === postId);
    const isActuallyMine =
      target &&
      (target.author === currentUser.name ||
        (Boolean(currentUser.nickname) && target.author === currentUser.nickname));
    if (!isActuallyMine) {
      Alert.alert('권한 없음', '본인이 작성한 글만 삭제할 수 있습니다.');
      return;
    }

    setDeleteConfirmModal({
      title: '게시글 삭제',
      message: '삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.',
      onConfirm: () => {
        setSchoolPosts((prev) => prev.filter((p) => p.id !== postId));
        deleteSchoolPostFromDb(postId);
      },
    });
  };

  /** 좋아요 토글 */
  const handleToggleLike = (postId: string) => {
    setMajorPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const liked = post.isLikedByUser;
        const nextLikes = liked ? post.likes - 1 : post.likes + 1;
        updateMajorPostInDb(postId, { likes: nextLikes });
        return {
          ...post,
          likes: nextLikes,
          isLikedByUser: !liked,
        };
      })
    );
    if (selectedPost?.id === postId) {
      setSelectedPost((prev) => {
        if (!prev) return null;
        const liked = prev.isLikedByUser;
        return { ...prev, likes: liked ? prev.likes - 1 : prev.likes + 1, isLikedByUser: !liked };
      });
    }
  };

  /** 댓글 등록 */
  const handleAddComment = (postId: string, comment: PostComment) => {
    setMajorPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const updated = [...(post.comments || []), comment];
        updateMajorPostInDb(postId, { comments: updated, commentCount: updated.length });
        return { ...post, comments: updated, commentCount: updated.length };
      })
    );
    if (selectedPost?.id === postId) {
      setSelectedPost((prev) => {
        if (!prev) return null;
        const updated = [...(prev.comments || []), comment];
        return { ...prev, comments: updated, commentCount: updated.length };
      });
    }
  };

  /** 댓글 삭제 (내 댓글만) */
  const handleDeleteComment = (postId: string, commentId: string) => {
    setMajorPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const updated = (post.comments || []).filter((c) => c.id !== commentId);
        updateMajorPostInDb(postId, { comments: updated, commentCount: updated.length });
        return { ...post, comments: updated, commentCount: updated.length };
      })
    );
    if (selectedPost?.id === postId) {
      setSelectedPost((prev) => {
        if (!prev) return null;
        const updated = (prev.comments || []).filter((c) => c.id !== commentId);
        return { ...prev, comments: updated, commentCount: updated.length };
      });
    }
  };

  /** 게시글 상세 보기 열기 */
  const handleSelectPost = (post: MajorPost) => {
    setSelectedPost(post);
    setIsPostDetailOpen(true);
  };

  /** 1:1 질문 모달 열기 */
  const handleOpenAskModal = (mode: 'direct' | 'admission' = 'direct', target = '') => {
    setAskMode(mode);
    setAskDefaultTarget(target);
    setIsAskModalOpen(true);
  };

  /** 전공게시판 게시글에서 작성자에게 [1:1 채팅 신청] 클릭 시 메시지 작성 모달 오픈 */
  const handleStartDirectChatFromPost = (post: MajorPost) => {
    setIsPostDetailOpen(false);
    setSelectedPost(null);
    setChatRequestPost(post);
  };

  /** 사용자가 직접 작성한 1:1 채팅 신청 메시지를 전송하고 채팅방 열기 */
  const handleSendDirectChatRequest = (post: MajorPost, messageText: string) => {
    const peerDisplayName = post.author.isAnonymous ? '익명 멘토' : post.author.nickname;
    const peerSchoolInfo = `${post.author.school} ${post.author.grade}`;
    const peerKey = buildUserChatKey(undefined, post.author.nickname, post.author.school);
    const roomId = buildPairRoomId(myChatKey, peerKey);

    const nowTimeStr = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const userMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'me',
      senderKey: myChatKey,
      senderName: currentUser.name,
      text: messageText,
      time: nowTimeStr,
      isRead: false,
    };

    setChatRooms((prev) => {
      const existing = prev.find((r) => r.id === roomId);
      if (existing) {
        return prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                lastMessage: messageText,
                lastTime: nowTimeStr,
                messages: [...r.messages, userMessage],
              }
            : r
        );
      }

      const newRoom: ChatRoom = {
        id: roomId,
        peerKey,
        peerName: peerDisplayName,
        peerSchool: peerSchoolInfo,
        avatar: peerDisplayName.slice(0, 1),
        avatarBg: post.author.avatarColor || '#dc2626',
        unreadCount: 0,
        lastMessage: messageText,
        lastTime: nowTimeStr,
        safetyNotice:
          '건전하고 안전한 학생 간 학습·진로 교류를 위해 개인 연락처 요구 및 비방 행위는 자동 차단됩니다.',
        messages: [userMessage],
      };
      return [newRoom, ...prev];
    });

    upsertChatMessageToDb({
      roomId,
      myKey: myChatKey,
      myName: currentUser.name,
      mySchool: currentSchool.name,
      peerKey,
      peerName: peerDisplayName,
      peerSchool: post.author.school,
      avatarBg: post.author.avatarColor || '#dc2626',
      newMessage: { id: userMessage.id, text: messageText, time: nowTimeStr },
    });

    setChatRequestPost(null);
    setActiveChatRoomId(roomId);
    setActiveTab('chat');
  };

  /** 게시글에서 1:1 채팅으로 바로 연결 */
  const handleQuickAsk = (post: MajorPost) => {
    handleStartDirectChatFromPost(post);
  };

  /** 1:1 질문 등록 */
  const handleSubmitQuestion = (question: DirectQuestion) => {
    setDirectQuestions((prev) => [question, ...prev]);
    insertDirectQuestionToDb(question);
  };

  /** 입시 질문 댓글(답변) 등록 */
  const handleAddQuestionComment = (questionId: string, content: string) => {
    const newComment = {
      id: `qc-${Date.now()}`,
      author: currentUser.name || '학생',
      grade: currentUser.grade || '고2',
      content,
      createdAt: '방금 전',
    };
    setDirectQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        let existing: any[] = [];
        if (q.answer) {
          try {
            const parsed = JSON.parse(q.answer);
            existing = Array.isArray(parsed)
              ? parsed
              : [{ id: 'legacy-answer', author: '선배 답변', content: q.answer, createdAt: q.answeredAt || '방금 전' }];
          } catch {
            existing = [{ id: 'legacy-answer', author: '선배 답변', content: q.answer, createdAt: q.answeredAt || '방금 전' }];
          }
        }
        const nextComments = [...existing, newComment];
        const nextAnswerJson = JSON.stringify(nextComments);
        updateDirectQuestionAnswerInDb(questionId, nextAnswerJson, '답변완료', '방금 전');
        return {
          ...q,
          answer: nextAnswerJson,
          status: '답변완료',
          answeredAt: '방금 전',
        };
      })
    );
  };

  /** 입시 상담 등록 */
  const handleSubmitConsult = (consult: AdmissionConsult) => {
    setAdmissionConsults((prev) => [consult, ...prev]);
    insertAdmissionConsultToDb(consult);
  };

  /** 채팅방 메시지 전송 및 실시간 DB 저장 */
  const handleUpdateChatRoom = (roomId: string, messages: ChatMessage[]) => {
    const targetRoom = chatRooms.find((r) => r.id === roomId);
    const lastMsg = messages[messages.length - 1];
    setChatRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          messages,
          lastMessage: lastMsg?.text || room.lastMessage,
          lastTime: lastMsg?.time || room.lastTime,
          unreadCount: 0,
        };
      })
    );

    if (targetRoom && lastMsg && lastMsg.sender === 'me') {
      upsertChatMessageToDb({
        roomId,
        myKey: myChatKey,
        myName: currentUser.name,
        mySchool: currentSchool.name,
        peerKey:
          targetRoom.peerKey ||
          buildUserChatKey(undefined, targetRoom.peerName, targetRoom.peerSchool),
        peerName: targetRoom.peerName,
        peerSchool: targetRoom.peerSchool,
        avatarBg: targetRoom.avatarBg,
        newMessage: { id: lastMsg.id, text: lastMsg.text, time: lastMsg.time },
      });
    }
  };

  /** 채팅방 입장 시 읽음 처리 + 해당 방의 벨 알림 제거 */
  const handleMarkRoomRead = (roomId: string) => {
    setChatRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
    );
    setNotifications((prev) => prev.filter((n) => n.roomId !== roomId));
    markChatRoomReadInDb(roomId, myChatKey);
  };

  /** 새 채팅 상대 선택 시 1:1 카톡방 생성/이동 */
  const handleStartPeerChat = (peer: {
    key: string;
    name: string;
    school: string;
    grade: string;
  }) => {
    const roomId = buildPairRoomId(myChatKey, peer.key);
    const existing = chatRooms.find((r) => r.id === roomId);
    if (!existing) {
      const nowTimeStr = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      const newRoom: ChatRoom = {
        id: roomId,
        peerKey: peer.key,
        peerName: peer.name,
        peerSchool: `${peer.school} ${peer.grade}`,
        avatar: peer.name.slice(0, 1),
        avatarBg: '#dc2626',
        unreadCount: 0,
        lastMessage: '대화를 시작해 보세요!',
        lastTime: nowTimeStr,
        safetyNotice:
          '개인 연락처(전화번호·SNS) 요구 및 비속어는 자동 차단됩니다.',
        messages: [],
      };
      setChatRooms((prev) => [newRoom, ...prev]);
    }
    setActiveChatRoomId(roomId);
  };

  // =========================================================
  //  5. 현재 활성 탭에 따른 본문 화면 렌더링
  // =========================================================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            currentUser={currentUser}
            currentSchool={currentSchool}
            hotPosts={[...majorPosts].sort((a, b) => b.likes - a.likes)}
            customTimetable={customTimetable}
            onAddOrUpdateTimetableBlock={handleAddOrUpdateTimetableBlock}
            onDeleteTimetableBlock={handleDeleteTimetableBlock}
            onNavigateTab={setActiveTab}
            onOpenWriteModal={handleOpenWriteModal}
            onSelectPost={handleSelectPost}
            onOpenAskModal={() => handleOpenAskModal('direct')}
            onOpenAdmissionConsult={() => {
              setCounselingSubTab('admission');
              setActiveTab('counseling');
            }}
          />
        );
      case 'major':
        return (
          <MajorBoardTab
            posts={majorPosts}
            currentUser={currentUser}
            currentSchool={currentSchool}
            onSelectPost={handleSelectPost}
            onDeletePost={handleDeleteMajorPost}
            onOpenWriteModal={() => handleOpenWriteModal('major')}
            onToggleLike={handleToggleLike}
            onStartDirectChat={handleStartDirectChatFromPost}
          />
        );
      case 'school':
        return (
          <SchoolBoardTab
            currentSchool={currentSchool}
            currentUser={currentUser}
            posts={schoolPosts}
            onDeletePost={handleDeleteSchoolPost}
            onOpenWriteModal={(cat) => handleOpenWriteModal('school', cat)}
            onToggleLike={handleToggleSchoolLike}
            onAddComment={handleAddSchoolComment}
            onDeleteComment={handleDeleteSchoolComment}
          />
        );
      case 'counseling':
        return (
          <CounselingTab
            directQuestions={directQuestions}
            admissionConsults={admissionConsults}
            initialSubTab={counselingSubTab}
            onOpenAskDirect={() => handleOpenAskModal('direct')}
            onOpenAskAdmission={() => handleOpenAskModal('admission')}
            onAddQuestionComment={handleAddQuestionComment}
          />
        );
      case 'chat':
        return (
          <DirectChatTab
            chatRooms={chatRooms}
            currentUser={currentUser}
            currentSchool={currentSchool}
            onUpdateChatRoom={handleUpdateChatRoom}
            onMarkRoomRead={handleMarkRoomRead}
            onStartPeerChat={handleStartPeerChat}
            initialOpenRoomId={activeChatRoomId}
            onRoomOpenChange={(isOpen) => {
              setIsChatRoomFullOpen(isOpen);
              if (!isOpen) setActiveChatRoomId(null);
            }}
          />
        );
      case 'profile':
        return (
          <ProfileTab
            currentUser={currentUser}
            currentSchool={currentSchool}
            myMajorPostCount={
              majorPosts.filter(
                (p) =>
                  p.author.school === currentSchool.name &&
                  (p.author.nickname === currentUser.name ||
                    (Boolean(currentUser.nickname) &&
                      p.author.nickname === currentUser.nickname))
              ).length
            }
            mySchoolPostCount={
              schoolPosts.filter(
                (p) =>
                  p.author === currentUser.name ||
                  (Boolean(currentUser.nickname) && p.author === currentUser.nickname)
              ).length
            }
            onUpdateProfile={handleUpdateProfile}
            onOpenReAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />
        );
    }
  };

  // =========================================================
  //  6. 앱 최종 렌더링 (로그인 전에는 전용 4단계 로그인 화면부터 시작)
  // =========================================================
  // PC 웹 브라우저(8081)에서 볼 때도 스마트폰 화면 비율(430px)로 깔끔하게 보이도록 래핑
  // (실제 iOS/Android 앱에서는 전체 화면 그대로 동작)
  const renderWithWebPhoneFrame = (content: React.ReactNode) => {
    if (Platform.OS !== 'web') return <>{content}</>;
    return (
      <View style={styles.webRoot}>
        <View style={styles.webPhoneFrame}>
          <View style={styles.webNotchWrap}>
            <View style={styles.webNotch} />
          </View>
          <View style={{ flex: 1, overflow: 'hidden' }}>{content}</View>
        </View>
      </View>
    );
  };

  if (!isLoggedIn) {
    return renderWithWebPhoneFrame(
      <LoginScreen
        initialUser={currentUser}
        initialSchool={currentSchool}
        onLoginSuccess={handleCompleteAuth}
      />
    );
  }

  return renderWithWebPhoneFrame(
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* 상단 고정 헤더 (1:1 채팅방 전체화면 진입 시 숨김) */}
      {!(activeTab === 'chat' && isChatRoomFullOpen) && (
        <Header
          currentUser={currentUser}
          currentSchool={currentSchool}
          unreadNotiCount={unreadNotiCount}
          onPressSchoolBadge={handlePressSchoolBadge}
          onPressNotification={() => setIsNotiModalOpen(true)}
        />
      )}

      {/* 본문: 탭 컨텐츠 */}
      <View style={styles.body}>
        {renderTabContent()}
      </View>

      {/* 하단 5탭 내비게이션 (1:1 채팅방 전체화면 진입 시 숨김) */}
      {!(activeTab === 'chat' && isChatRoomFullOpen) && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          unreadChatCount={unreadChatCount}
        />
      )}

      {/* ===== 모달들 ===== */}

      {/* 학생 인증 모달 */}
      <AuthModal
        visible={isAuthModalOpen}
        currentUser={currentUser}
        currentSchool={currentSchool}
        onClose={() => setIsAuthModalOpen(false)}
        onCompleteAuth={handleCompleteAuth}
      />

      {/* 알림 센터 모달 */}
      <NotificationModal
        visible={isNotiModalOpen}
        notifications={notifications}
        onClose={() => setIsNotiModalOpen(false)}
        onMarkAllAsRead={handleMarkAllNotiRead}
        onSelectNotification={(item) => {
          setNotifications((prev) => prev.filter((n) => n.id !== item.id));
          setIsNotiModalOpen(false);
          if (item.type === 'chat' && item.roomId) {
            setActiveChatRoomId(item.roomId);
            setActiveTab('chat');
          } else if (item.type === 'comment' && item.postId) {
            const targetPost = majorPosts.find((p) => p.id === item.postId);
            if (targetPost) {
              setSelectedPost(targetPost);
              setIsPostDetailOpen(true);
            }
          }
        }}
      />

      {/* 글쓰기 모달 */}
      <WritePostModal
        visible={isWriteModalOpen}
        targetBoard={writeTargetBoard}
        initialSchoolCategory={writeInitialSchoolCategory}
        currentUser={currentUser}
        currentSchool={currentSchool}
        onClose={() => setIsWriteModalOpen(false)}
        onSubmitMajorPost={handleSubmitMajorPost}
        onSubmitSchoolPost={handleSubmitSchoolPost}
      />

      {/* 게시글 상세 모달 */}
      <PostDetailModal
        visible={isPostDetailOpen}
        post={selectedPost}
        currentUser={currentUser}
        currentSchool={currentSchool}
        onClose={() => {
          setIsPostDetailOpen(false);
          setSelectedPost(null);
        }}
        onToggleLike={handleToggleLike}
        onDeletePost={handleDeleteMajorPost}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onQuickAsk={handleQuickAsk}
      />

      {/* 1:1 질문 / 입시 상담 모달 */}
      <AskQuestionModal
        visible={isAskModalOpen}
        mode={askMode}
        defaultTarget={askDefaultTarget}
        currentUser={currentUser}
        onClose={() => setIsAskModalOpen(false)}
        onSubmitQuestion={handleSubmitQuestion}
        onSubmitConsult={handleSubmitConsult}
      />

      {/* 전공게시판 1:1 채팅 신청 메시지 작성 모달 */}
      <ChatRequestModal
        visible={Boolean(chatRequestPost)}
        post={chatRequestPost}
        onClose={() => setChatRequestPost(null)}
        onSendRequest={handleSendDirectChatRequest}
      />

      {/* 공용 삭제 확인 모달 (예 / 아니요) */}
      <PhoneModal
        visible={Boolean(deleteConfirmModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModal(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>
              {deleteConfirmModal?.title || '삭제 확인'}
            </Text>
            <Text style={styles.confirmMessage}>
              {deleteConfirmModal?.message || '삭제하시겠습니까?'}
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setDeleteConfirmModal(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>아니요</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmYesBtn}
                onPress={() => {
                  const action = deleteConfirmModal?.onConfirm;
                  setDeleteConfirmModal(null);
                  action?.();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmYesText}>예</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </PhoneModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    width: '100%',
    minHeight: '100dvh' as any,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  webTopHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  webDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  webTopHintText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  webPhoneFrame: {
    width: '100%',
    maxWidth: 430,
    height: '90dvh' as any,
    maxHeight: 860,
    backgroundColor: '#ffffff',
    borderRadius: 36,
    borderWidth: 6,
    borderColor: '#1e293b',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  webNotchWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#ffffff',
  },
  webNotch: {
    width: 80,
    height: 14,
    borderRadius: 99,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  body: {
    flex: 1,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  confirmYesBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  confirmYesText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
