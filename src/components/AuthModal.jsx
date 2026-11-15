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
import { SAMPLE_SCHOOLS } from '../data/mockData';

// 사용자가 기획한 3단계 고교 인증 플로우:
// 1) 소셜 로그인 -> 2) PASS 본인인증 -> 3) 재학증명서 PDF 검증
export default function AuthModal({
  isOpen,
  onClose,
  onCompleteAuth,
  initialUser
}) {
  const [step, setStep] = useState(1); // 1: 소셜선택, 2: PASS인증, 3: 재학증명서 업로드, 4: 검증중, 5: 완료
  const [socialProvider, setSocialProvider] = useState('kakao');
  
  // PASS 본인인증 입력값
  const [userName, setUserName] = useState('김민준');
  const [birthDate, setBirthDate] = useState('2009.05.14');
  const [telecom, setTelecom] = useState('SKT');
  const [phone, setPhone] = useState('010-3849-2910');

  // 학교 선택 및 재학증명서
  const [selectedSchool, setSelectedSchool] = useState(SAMPLE_SCHOOLS[1]); // 기본: 하나고
  const [uploadedFileName, setUploadedFileName] = useState('2026학년도_재학증명서_김민준.pdf');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  // PASS 인증 완료 후 다음 단계
  const handlePassSubmit = (e) => {
    e.preventDefault();
    if (!userName.trim() || !phone.trim()) return;
    setStep(3);
  };

  // 재학증명서 업로드 및 검증 시작
  const handleStartVerification = () => {
    setStep(4);
    setIsVerifying(true);

    // AI OCR 및 PASS 대조 검증 시뮬레이션 (2초 후 완료)
    setTimeout(() => {
      setIsVerifying(false);
      setStep(5);
    }, 2000);
  };

  // 최종 인증 완료 적용
  const handleFinalConfirm = () => {
    onCompleteAuth({
      name: userName,
      school: selectedSchool,
      grade: '고2',
      isVerified: true,
      passVerified: true,
      certVerified: true,
      verifiedAt: '2026. 11. 15'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl overflow-hidden relative">
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1단계 헤더: 프로세스 인디케이터 */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>고등학생 재학생 정식 인증</span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            {step === 1 && '간편 소셜 로그인'}
            {step === 2 && 'PASS 휴대폰 본인확인'}
            {step === 3 && '소속 고교 선택 & 재학증명서 제출'}
            {step === 4 && 'PASS ↔ 재학증명서 일치 검증 중'}
            {step === 5 && '재학생 인증 완료!'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {step === 1 && '사용하실 간편 계정을 선택해 주세요.'}
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
                className={`h-1.5 rounded-full transition-all ${
                  step >= s ? 'bg-red-500' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: 소셜 로그인 */}
        {step === 1 && (
          <div className="space-y-2.5 py-2">
            <button
              onClick={() => {
                setSocialProvider('kakao');
                setStep(2);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#3C1E1E] text-[#FEE500] font-black flex items-center justify-center text-[10px]">
                  TALK
                </span>
                <span>카카오톡으로 계속하기</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => {
                setSocialProvider('naver');
                setStep(2);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#03C75A] hover:bg-[#02b350] text-white font-bold text-xs transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white text-[#03C75A] font-black flex items-center justify-center text-xs">
                  N
                </span>
                <span>네이버로 계속하기</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => {
                setSocialProvider('google');
                setStep(2);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-slate-100 font-black text-red-500 flex items-center justify-center text-xs">
                  G
                </span>
                <span>Google 계정으로 계속하기</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                setSocialProvider('apple');
                setStep(2);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-white text-slate-900 font-black flex items-center justify-center text-xs">
                  
                </span>
                <span>Apple로 계속하기</span>
              </div>
              <ArrowRight className="w-4 h-4 opacity-70" />
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
                onChange={(e) => setUserName(e.target.value)}
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

        {/* STEP 3: 소속 고교 선택 & 재학증명서 PDF 업로드 */}
        {step === 3 && (
          <div className="space-y-3 py-1">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                현재 재학 중인 고등학교 선택
              </label>
              <select
                value={selectedSchool.id}
                onChange={(e) => {
                  const s = SAMPLE_SCHOOLS.find((item) => item.id === e.target.value);
                  if (s) setSelectedSchool(s);
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 font-bold text-slate-900"
              >
                {SAMPLE_SCHOOLS.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.region})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                * 인증 완료 시 위 학교로만 소속이 고정되며 교내 게시판이 잠금 해제됩니다.
              </p>
            </div>

            {/* 재학증명서 PDF 업로드 영역 */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                재학증명서 (PDF) 또는 학생증 사진 첨부
              </label>
              <div className="border-2 border-dashed border-red-200 rounded-2xl p-4 text-center bg-red-50/30">
                <UploadCloud className="w-8 h-8 text-red-500 mx-auto mb-1.5" />
                <div className="text-xs font-bold text-slate-800">
                  {uploadedFileName}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  정부24 인터넷 발급 PDF, 나이스 학생확인서, 실물/모바일 학생증
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 shadow-xs">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>문서 첨부 완료 (1.2 MB)</span>
                </div>
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

        {/* STEP 5: 인증 완료 화면 */}
        {step === 5 && (
          <div className="py-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {selectedSchool.name} 재학생 인증 완료!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                본인확인과 재학증명서 내용이 100% 일치합니다.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">인증 학생:</span>
                <span className="font-bold text-slate-800">{userName} (고2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">소속 고교:</span>
                <span className="font-bold text-red-600">{selectedSchool.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PASS 본인인증:</span>
                <span className="font-bold text-emerald-600">인증 완료</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">교내 게시판 권한:</span>
                <span className="font-bold text-slate-800">정회원 (열람/작성 가능)</span>
              </div>
            </div>

            <button
              onClick={handleFinalConfirm}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-200 transition"
            >
              내 학교 서비스 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
