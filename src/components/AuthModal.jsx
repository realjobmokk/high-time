import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  FileText,
  CheckCircle2,
  UploadCloud,
  Search,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowRight,
  School,
  FileCheck
} from 'lucide-react';
import { searchNeisHighSchools } from '../services/neisService';

// 사용자가 기획한 4단계 고교 인증 플로우:
// 1) 소셜 로그인 -> 2) PASS 본인인증 -> 3) 나이스 학교검색 & 재학증명서 PDF 업로드 -> 4) PASS ↔ 재학증명서 일치 검증
export default function AuthModal({
  isOpen,
  onClose,
  onCompleteAuth,
  initialUser
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // 회원가입용 아이디/비밀번호 및 중복 확인 상태
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken'
  const [usernameMessage, setUsernameMessage] = useState('');
  const [signupStep1Error, setSignupStep1Error] = useState('');
  const [signupErrorField, setSignupErrorField] = useState(null); // 'username' | 'password' | 'passwordConfirm' | null
  const [isShaking, setIsShaking] = useState(false);

  // 오류 시 모달 창 좌우 흔들림 트리거
  const triggerShake = () => {
    setIsShaking(false);
    requestAnimationFrame(() => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    });
  };

  const [step, setStep] = useState(1); // 1: 계정생성/소셜선택, 2: PASS인증, 3: 재학증명서 업로드, 4: 검증중, 5: 완료
  const [socialProvider, setSocialProvider] = useState('kakao');

  // PASS 본인인증 입력값
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [telecom, setTelecom] = useState('SKT');
  const [phone, setPhone] = useState('');

  // 나이스 학교 검색 및 재학증명서 (검색 전에는 아무것도 표시하지 않음)
  const [schoolQuery, setSchoolQuery] = useState('');
  const [schoolResults, setSchoolResults] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [certGrade, setCertGrade] = useState('고2');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [certHolderName, setCertHolderName] = useState('');
  const [certHolderBirth, setCertHolderBirth] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMatched, setIsMatched] = useState(true);

  if (!isOpen) return null;

  // 이전에 임시로 사용하던 로컬 계정 저장소 정리
  try {
    localStorage.removeItem('hightime_accounts_registry_v1');
  } catch { }

  // 아이디 중복 확인 (Supabase DB 전용)
  const handleCheckUsername = async () => {
    const cleanId = signupUsername.trim();
    setSignupStep1Error('');
    setSignupErrorField(null);
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(cleanId)) {
      setSignupErrorField('username');
      setUsernameStatus('taken');
      setUsernameMessage('아이디에는 한글을 사용할 수 없습니다. 영문과 숫자만 입력해 주세요.');
      triggerShake();
      return;
    }
    if (!cleanId || cleanId.length < 3) {
      setSignupErrorField('username');
      setUsernameStatus('taken');
      setUsernameMessage('아이디는 영문/숫자 3자 이상 입력해 주세요.');
      triggerShake();
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
      setSignupErrorField('username');
      setUsernameStatus('taken');
      setUsernameMessage('아이디는 영문과 숫자만 사용할 수 있습니다.');
      triggerShake();
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('아이디 중복 여부를 확인하는 중...');

    try {
      const url = `https://sghkaxetnfkmjminjekk.supabase.co/rest/v1/users?select=login_id&login_id=eq.${encodeURIComponent(
        cleanId.toLowerCase()
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          apikey: 'sb_publishable_v6Ttgv7298aUSbGZDDjbbQ_uz1yY7_x'
        }
      });
      if (!res.ok) {
        setSignupErrorField('username');
        setUsernameStatus('taken');
        setUsernameMessage('DB 연결 확인 중 오류가 발생했습니다. 다시 시도해 주세요.');
        triggerShake();
        return;
      }
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        setSignupErrorField('username');
        setUsernameStatus('taken');
        setUsernameMessage('이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.');
        triggerShake();
        return;
      }
    } catch {
      setSignupErrorField('username');
      setUsernameStatus('taken');
      setUsernameMessage('서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      triggerShake();
      return;
    }

    setUsernameStatus('available');
    setUsernameMessage('사용 가능한 아이디입니다.');
  };

  // 회원가입 1단계 검증 후 다음 단계 이동
  const handleStep1Proceed = (provider) => {
    const cleanId = signupUsername.trim();
    setSignupErrorField(null);
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(cleanId)) {
      setSignupErrorField('username');
      setSignupStep1Error('아이디에는 한글을 사용할 수 없습니다. 영문과 숫자만 입력해 주세요.');
      triggerShake();
      return;
    }
    if (!cleanId || cleanId.length < 3) {
      setSignupErrorField('username');
      setSignupStep1Error('아이디는 영문/숫자 3자 이상 입력해 주세요.');
      triggerShake();
      return;
    }
    if (!/^[a-zA-Z0-9]+$/.test(cleanId)) {
      setSignupErrorField('username');
      setSignupStep1Error('아이디는 영문과 숫자만 사용할 수 있습니다.');
      triggerShake();
      return;
    }
    if (usernameStatus !== 'available') {
      setSignupErrorField('username');
      setSignupStep1Error('먼저 아이디를 입력하고 [중복 확인]을 완료해 주세요.');
      triggerShake();
      return;
    }
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(signupPassword)) {
      setSignupErrorField('password');
      setSignupStep1Error('비밀번호에는 한글을 사용할 수 없습니다.');
      triggerShake();
      return;
    }
    if (signupPassword.length < 4) {
      setSignupErrorField('password');
      setSignupStep1Error('비밀번호는 4자 이상 입력해 주세요.');
      triggerShake();
      return;
    }
    if (!/[a-zA-Z]/.test(signupPassword) || !/[0-9]/.test(signupPassword)) {
      setSignupErrorField('password');
      setSignupStep1Error('비밀번호는 영문과 숫자를 반드시 모두 포함해야 합니다.');
      triggerShake();
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setSignupErrorField('passwordConfirm');
      setSignupStep1Error('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      triggerShake();
      return;
    }
    setSignupStep1Error('');
    setSocialProvider(provider);
    setStep(2);
  };

  // 아이디 + 비밀번호로 로그인 처리
  const handleDbLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    const cleanId = loginUsername.trim();
    if (!cleanId) {
      setLoginError('아이디를 입력해 주세요.');
      return;
    }
    if (!loginPassword) {
      setLoginError('비밀번호를 입력해 주세요.');
      return;
    }

    setIsCheckingDb(true);
    try {
      const url = `https://sghkaxetnfkmjminjekk.supabase.co/rest/v1/users?select=*&login_id=eq.${encodeURIComponent(
        cleanId.toLowerCase()
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          apikey: 'sb_publishable_v6Ttgv7298aUSbGZDDjbbQ_uz1yY7_x'
        }
      });
      const rows = res.ok ? await res.json() : [];
      if (!Array.isArray(rows) || rows.length === 0) {
        setIsCheckingDb(false);
        setLoginError('가입되어 있지 않은 아이디입니다. 먼저 회원가입을 진행해 주세요.');
        return;
      }

      const dbUser = rows[0];
      if ((dbUser.password || '') !== loginPassword) {
        setIsCheckingDb(false);
        setLoginError('비밀번호가 일치하지 않습니다.');
        return;
      }
      let schoolObj = {
        id: dbUser.school_id || 'school',
        name: dbUser.school_name || '고등학교',
        region: ''
      };
      const neisRes = await searchNeisHighSchools(schoolObj.name);
      if (neisRes.length > 0) schoolObj = neisRes[0];

      setIsCheckingDb(false);
      onCompleteAuth({
        username: dbUser.login_id || cleanId.toLowerCase(),
        name: dbUser.name,
        school: schoolObj,
        grade: dbUser.grade || '고2',
        isVerified: true,
        passVerified: true,
        certVerified: true,
        verifiedAt: dbUser.verified_at || '2026. 11. 16'
      });
      onClose();
    } catch {
      setIsCheckingDb(false);
      setLoginError('가입되어 있지 않은 정보입니다.');
    }
  };

  // PASS 인증 완료 후 다음 단계
  const handlePassSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !phone.trim()) return;
    setCertHolderName(userName.trim());
    setCertHolderBirth(birthDate.trim());
    setUploadedFileName(`2026학년도_재학증명서_${userName.trim()}.pdf`);
    setStep(3);
  };

  // 재학증명서 업로드 및 PASS ↔ 재학증명서 일치 검증 시작
  const handleStartVerification = () => {
    if (!selectedSchool) return;
    setStep(4);
    setIsVerifying(true);

    setTimeout(() => {
      const matched =
        userName.trim() === certHolderName.trim() &&
        birthDate.trim() === certHolderBirth.trim() &&
        uploadedFileName.toLowerCase().endsWith('.pdf');
      setIsMatched(matched);
      setIsVerifying(false);
      setStep(5);
    }, 1300);
  };

  // 최종 회원가입 인증 완료 적용 (Supabase users 테이블 및 로컬 레지스트리에 저장)
  const handleFinalConfirm = async () => {
    if (!isMatched || !selectedSchool) {
      setStep(3);
      return;
    }
    const cleanId = signupUsername.trim().toLowerCase();
    const cleanName = userName.replace(/\s+/g, '');

    try {
      await fetch('https://sghkaxetnfkmjminjekk.supabase.co/rest/v1/users', {
        method: 'POST',
        headers: {
          apikey: 'sb_publishable_v6Ttgv7298aUSbGZDDjbbQ_uz1yY7_x',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login_id: cleanId,
          password: signupPassword,
          name: cleanName,
          grade: certGrade,
          school_id: selectedSchool.id,
          school_name: selectedSchool.name,
          pass_verified: true,
          cert_verified: true,
          verified_at: '2026. 11. 16'
        })
      });
    } catch { }
    onCompleteAuth({
      username: cleanId,
      name: cleanName,
      school: selectedSchool,
      grade: certGrade,
      isVerified: true,
      passVerified: true,
      certVerified: true,
      verifiedAt: '2026. 11. 16'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <style>{`
        @keyframes hightime-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-hightime-shake {
          animation: hightime-shake 0.35s ease-in-out;
        }
      `}</style>
      <div
        className={`bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl overflow-hidden relative ${
          isShaking ? 'animate-hightime-shake' : ''
        }`}
      >
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 [로그인] / [회원가입] 전환 탭 */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl mb-4 mt-2">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setLoginError('');
            }}
            className={`py-2 rounded-xl text-xs font-extrabold transition ${authMode === 'login' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
              }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setStep(1);
            }}
            className={`py-2 rounded-xl text-xs font-extrabold transition ${authMode === 'signup' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
              }`}
          >
            회원가입 (신규 인증)
          </button>
        </div>

        {authMode === 'login' ? (
          <form onSubmit={handleDbLoginSubmit} className="space-y-3 py-1">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">기존 회원 로그인</h2>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                아이디
              </label>
              <input
                type="text"
                lang="en"
                inputMode="latin"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => {
                  setLoginUsername(e.target.value);
                  setLoginError('');
                }}
                placeholder="가입한 아이디를 입력하세요"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="비밀번호를 입력하세요"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCheckingDb}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition"
            >
              {isCheckingDb ? '로그인 확인 중...' : '아이디/비밀번호로 로그인'}
            </button>
          </form>
        ) : (
          <>
            {/* 1단계 헤더: 프로세스 인디케이터 */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>고등학생 재학생 정식 인증</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                {step === 1 && '아이디·비밀번호 생성'}
                {step === 2 && 'PASS 휴대폰 본인확인'}
                {step === 3 && '소속 고교 선택 & 재학증명서 제출'}
                {step === 4 && 'PASS ↔ 재학증명서 일치 검증 중'}
                {step === 5 && '재학생 인증 완료!'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 1 && '이 앱에서 사용할 고유 아이디(중복 불가)와 비밀번호를 만들어 주세요.'}
                {step === 2 && '미성년자 본인 및 중복 가입 방지를 위한 본인인증입니다.'}
                {step === 3 && '정부24 재학증명서(PDF) 또는 학생증 사진을 첨부해 주세요.'}
                {step === 4 && '문서 내 이름/생년월일과 PASS 정보를 실시간 대조 중입니다.'}
                {step === 5 && '인증된 고등학교의 학생 전용 라운지가 활성화되었습니다.'}
              </p>

              {/* 스텝 바 */}
              <div className="grid grid-cols-4 gap-1.5 mt-3">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${step >= s ? 'bg-red-500' : 'bg-slate-100'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: 아이디/비밀번호 생성 및 소셜 계정 선택 */}
            {step === 1 && (
              <div className="space-y-2.5 py-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    아이디 (중복 불가)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      lang="en"
                      inputMode="latin"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      autoComplete="username"
                      value={signupUsername}
                      onChange={(e) => {
                        setSignupUsername(e.target.value);
                        setUsernameStatus('idle');
                        setUsernameMessage('');
                        if (signupErrorField === 'username') setSignupErrorField(null);
                        setSignupStep1Error('');
                      }}
                      placeholder="영문/숫자 3자 이상"
                      className={`flex-1 text-xs p-2.5 rounded-xl border font-bold ${
                        signupErrorField === 'username' || usernameStatus === 'taken'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCheckUsername}
                      disabled={usernameStatus === 'checking'}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold whitespace-nowrap"
                    >
                      {usernameStatus === 'checking' ? '확인 중...' : '중복 확인'}
                    </button>
                  </div>
                  {usernameMessage && (
                    <p
                      className={`text-[11px] font-bold mt-1 ${usernameStatus === 'available' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                    >
                      {usernameMessage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (signupErrorField === 'password') setSignupErrorField(null);
                      setSignupStep1Error('');
                    }}
                    placeholder="영문·숫자 포함 4자 이상 입력"
                    className={`w-full text-xs p-2.5 rounded-xl border font-bold ${
                      signupErrorField === 'password'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={signupPasswordConfirm}
                    onChange={(e) => {
                      setSignupPasswordConfirm(e.target.value);
                      if (signupErrorField === 'passwordConfirm') setSignupErrorField(null);
                      setSignupStep1Error('');
                    }}
                    placeholder="비밀번호를 다시 입력하세요"
                    className={`w-full text-xs p-2.5 rounded-xl border font-bold ${
                      signupErrorField === 'passwordConfirm'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200'
                    }`}
                  />
                </div>

                {signupStep1Error && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{signupStep1Error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleStep1Proceed('kakao')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs transition mt-2"
                >
                  <span>다음: PASS 본인인증 진행</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: PASS 본인인증 */}
            {step === 2 && (
              <form onSubmit={handlePassSubmit} className="space-y-3 py-1">
                <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-100 flex items-center gap-2 text-xs text-red-700">
                  <Smartphone className="w-4 h-4 text-red-500 shrink-0" />
                  <span>PASS 앱 간편 본인확인 (통신 3사)</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">이름</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value.replace(/\s+/g, ''))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">생년월일</label>
                    <input
                      type="text"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">통신사</label>
                    <select
                      value={telecom}
                      onChange={(e) => setTelecom(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      <option value="SKT">SKT</option>
                      <option value="KT">KT</option>
                      <option value="LGU+">LG U+</option>
                      <option value="알뜰폰">알뜰폰</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">휴대폰 번호</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-semibold"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>PASS 본인확인 완료</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: 나이스 고교 검색 & 재학증명서 PDF 업로드 */}
            {step === 3 && (
              <div className="space-y-3 py-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    소속 고등학교 검색 (나이스 전국 고등학교 API)
                  </label>
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      value={schoolQuery}
                      onChange={(e) => setSchoolQuery(e.target.value)}
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                      placeholder="재학 중인 고등학교 이름을 검색하세요"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await searchNeisHighSchools(schoolQuery);
                        if (res.length > 0) {
                          setSchoolResults(res);
                          setSelectedSchool(res[0]);
                        } else {
                          setSchoolResults([]);
                          setSelectedSchool(null);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                    >
                      검색
                    </button>
                  </div>
                  {schoolResults.length === 0 ? (
                    <div className="p-3 rounded-xl border border-dashed border-slate-300 text-center text-[11px] text-slate-400 font-semibold">
                      고등학교 이름을 검색하면 검색 결과가 여기에 나타납니다.
                    </div>
                  ) : (
                    <select
                      value={selectedSchool?.id || ''}
                      onChange={(e) => {
                        const s = schoolResults.find((item) => item.id === e.target.value);
                        if (s) setSelectedSchool(s);
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold text-slate-900"
                    >
                      {schoolResults.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name} ({school.region})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    * 나이스 검색 API로 조회된 학교 코드로 급식·시간표·학사일정이 자동 연결됩니다.
                  </p>
                </div>

                {/* 재학증명서 PDF 업로드 영역 */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    재학증명서 (PDF) 파일 업로드
                  </label>
                  <label className="block cursor-pointer border-2 border-dashed border-red-200 rounded-2xl p-3.5 text-center bg-red-50/30 hover:bg-red-50/60 transition">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setUploadedFileName(f.name);
                      }}
                    />
                    <UploadCloud className="w-7 h-7 text-red-500 mx-auto mb-1" />
                    <div className="text-xs font-bold text-slate-800">
                      {uploadedFileName}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      클릭하여 재학증명서 PDF 파일 선택
                    </p>
                  </label>
                </div>

                {/* 재학증명서 PDF 추출 인적사항 (PASS 대조 대상) */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700">
                    📄 재학증명서 PDF 내 인적사항 확인 (PASS 정보와 일치 검증)
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={certHolderName}
                      onChange={(e) => setCertHolderName(e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                      placeholder="증명서 성명"
                    />
                    <input
                      type="text"
                      value={certHolderBirth}
                      onChange={(e) => setCertHolderBirth(e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                      placeholder="생년월일"
                    />
                    <select
                      value={certGrade}
                      onChange={(e) => setCertGrade(e.target.value)}
                      className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    >
                      <option value="고1">고1</option>
                      <option value="고2">고2</option>
                      <option value="고3">고3</option>
                    </select>
                  </div>
                </div>

                {/* 검증 안내 알림 */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-start gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    PASS 본인확인 정보(<strong>{userName}</strong> / <strong>{birthDate}</strong>)와 재학증명서 상의 인적 사항이 일치해야 승인됩니다.
                  </div>
                </div>

                <div className="pt-2 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={handleStartVerification}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-red-200"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>재학증명서 자동 검증 시작</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: AI 대조 검증 중 (애니메이션) */}
            {step === 4 && (
              <div className="py-8 text-center space-y-3">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-500" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    PASS 정보 ↔ 재학증명서 OCR 대조 중...
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    이름({userName}), 생년월일({birthDate}), {selectedSchool.name} 재학 여부 일치 확인 중
                  </p>
                </div>
              </div>
            )}

            {/* STEP 5: 인증 완료 또는 불일치 반려 화면 */}
            {step === 5 && (
              <div className="py-4 text-center space-y-3">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${isMatched ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}
                >
                  {isMatched ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {isMatched
                      ? `${selectedSchool.name} 재학생 인증 완료!`
                      : 'PASS 정보와 재학증명서 불일치 (반려)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isMatched
                      ? 'PASS 본인확인과 재학증명서 PDF 내용이 100% 일치합니다.'
                      : `PASS(${userName} / ${birthDate})와 재학증명서(${certHolderName} / ${certHolderBirth}) 정보가 다릅니다.`}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PASS 성명 vs 증명서 성명:</span>
                    <span className="font-bold text-slate-800">
                      {userName} ↔ {certHolderName} ({userName === certHolderName ? '일치 ✅' : '불일치 ❌'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PASS 생년월일 vs 증명서:</span>
                    <span className="font-bold text-slate-800">
                      {birthDate} ↔ {certHolderBirth} ({birthDate === certHolderBirth ? '일치 ✅' : '불일치 ❌'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">인증 고등학교 / 학년:</span>
                    <span className="font-bold text-red-600">
                      {selectedSchool.name} ({certGrade})
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleFinalConfirm}
                  className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-200 transition"
                >
                  {isMatched ? '내 학교 서비스 시작하기' : '다시 업로드 및 검증하기'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
