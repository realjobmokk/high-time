import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Edit3, CheckCircle2, LogOut, School, Camera, Image as ImageIcon } from 'lucide-react';
import { MAJOR_CATEGORIES } from '../data/mockData';

// 웹 프로토타입용 내 프로필 조회 및 수정 탭 컴포넌트
export default function ProfileSection({
  currentUser,
  currentSchool,
  onUpdateProfile,
  onOpenAuthModal,
  onLogout
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '서정윤');
  const [nickname, setNickname] = useState(currentUser?.nickname || `${currentUser?.name || '서정윤'}학생`);
  const [grade, setGrade] = useState(currentUser?.grade || '고2');
  const [targetMajor, setTargetMajor] = useState(currentUser?.targetMajor || '컴퓨터·IT·인공지능');
  const [bio, setBio] = useState(currentUser?.bio || `${currentSchool.name} 재학 중인 ${currentUser?.grade || '고2'} 학생입니다.`);
  const [savedBanner, setSavedBanner] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const editSectionRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleOpenEditFromCard = () => {
    setIsEditing(true);
    setTimeout(() => {
      editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  // 기기(브라우저/모바일 OS) 사진 선택기 바로 열기
  const handleRequestGallery = () => {
    setGalleryError('');
    fileInputRef.current?.click();
  };

  // 선택한 이미지 파일 읽어서 프로필 사진으로 반영
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGalleryError('이미지 파일(PNG, JPG 등)만 선택할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateProfile({
          name: name.trim() || currentUser?.name || '서정윤',
          nickname: nickname.trim() || currentUser?.nickname || '학생',
          grade,
          targetMajor,
          bio: bio.trim(),
          profileImage: reader.result
        });
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 2500);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    setName(currentUser?.name || '서정윤');
    setNickname(currentUser?.nickname || `${currentUser?.name || '서정윤'}학생`);
    setGrade(currentUser?.grade || '고2');
    setTargetMajor(currentUser?.targetMajor || '컴퓨터·IT·인공지능');
    setBio(currentUser?.bio || `${currentSchool.name} 재학 중인 ${currentUser?.grade || '고2'} 학생입니다.`);
  }, [currentUser, currentSchool.name]);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      nickname: nickname.trim(),
      grade,
      targetMajor,
      bio: bio.trim()
    });
    setIsEditing(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="p-4 pb-24 space-y-3.5">
      {/* 학생증 카드 */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-widest text-slate-400 font-mono font-bold">
            HIGHTIME STUDENT ID
          </span>
          <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            PASS + 재학PDF 인증완료
          </span>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleRequestGallery}
            className="relative w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-lg font-black overflow-visible shrink-0"
            title="갤러리에서 프로필 사진 변경"
          >
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt="프로필"
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <span>{(currentUser?.name || '서').slice(0, 1)}</span>
            )}
            <span className="absolute -right-0.5 -bottom-0.5 w-5 h-5 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center">
              <Camera className="w-2.5 h-2.5 text-white" />
            </span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black">{currentUser?.name || '서정윤'}</h3>
              <span className="text-xs text-red-300 font-bold">
                @{currentUser?.nickname || `${currentUser?.name || '서정윤'}학생`}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold">
              {currentSchool.name} ({currentSchool.region}) · {currentUser?.grade || '고2'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              희망 진로: {currentUser?.targetMajor || '컴퓨터·IT·인공지능'}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 italic">
          "{currentUser?.bio || `${currentSchool.name} 재학 중인 ${currentUser?.grade || '고2'} 학생입니다.`}"
        </p>

        {/* 검은 학생증 카드 내 사진 변경 & 프로필 수정 버튼 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleRequestGallery}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>사진 변경</span>
          </button>
          <button
            type="button"
            onClick={handleOpenEditFromCard}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>프로필 수정</span>
          </button>
        </div>

        {galleryError && (
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/40 text-red-200 text-[11px] font-bold">
            {galleryError}
          </div>
        )}
      </div>

      {savedBanner && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>프로필 정보가 저장되어 앱 전체에 반영되었습니다!</span>
        </div>
      )}

      {/* 프로필 수정 카드 */}
      <div ref={editSectionRef} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
            <Edit3 className="w-4 h-4 text-red-500" />
            <span>내 프로필 정보 관리 및 수정</span>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition"
            >
              프로필 수정
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">이름 (실명)</span>
              <span className="font-bold text-slate-900">{currentUser?.name || '서정윤'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">커뮤니티 닉네임</span>
              <span className="font-bold text-slate-900">
                {currentUser?.nickname || `${currentUser?.name || '서정윤'}학생`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">소속 고등학교</span>
              <span className="font-bold text-red-600">{currentSchool.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">현재 학년</span>
              <span className="font-bold text-slate-900">{currentUser?.grade || '고2'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">희망 전공 / 진로</span>
              <span className="font-bold text-slate-900">
                {currentUser?.targetMajor || '컴퓨터·IT·인공지능'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">한줄 소개</span>
              <span className="font-bold text-slate-900 max-w-[65%] text-right">
                {currentUser?.bio || `${currentSchool.name} 재학 중인 ${currentUser?.grade || '고2'} 학생입니다.`}
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">커뮤니티 닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">현재 학년</label>
              <div className="grid grid-cols-3 gap-2">
                {['고1', '고2', '고3'].map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`py-2 rounded-xl font-bold border ${
                      grade === g
                        ? 'bg-red-50 border-red-500 text-red-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">희망 진로 / 전공</label>
              <select
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                {MAJOR_CATEGORIES.filter((m) => m.id !== 'all').map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">한줄 자기소개</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold"
              >
                프로필 변경사항 저장
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 학교 재인증 및 로그아웃 */}
      <div className="space-y-2">
        <button
          onClick={onOpenAuthModal}
          className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
        >
          <span className="flex items-center gap-2">
            <School className="w-4 h-4 text-red-500" />
            <span>전학 / 소속 고등학교 재인증 (PASS + 재학증명서 PDF)</span>
          </span>
          <span className="text-slate-400">→</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-red-100 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃 (로그인 화면으로 돌아가기)</span>
        </button>
      </div>
    </div>
  );
}
