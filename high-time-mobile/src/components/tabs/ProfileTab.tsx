// =============================================================================
// 👤 HighTime (고교타임) - 내 프로필(Profile) 조회 및 수정 탭 컴포넌트
// - 로그인된 학생증 카드 표시 (학교 · 학년 · 실명 · 소셜 계정 · PASS/재학PDF 인증 상태)
// - 프로필 수정: 활동 닉네임, 학년(고1/고2/고3), 희망 진로/전공, 한줄 자기소개 수정 후 DB 반영
// - 소속 학교/재학증명서 재인증 및 로그아웃(로그인 화면으로 복귀) 지원
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CurrentUser, School } from '../../types';
import { MAJOR_CATEGORIES } from '../../data/mockData';

interface ProfileTabProps {
  currentUser: CurrentUser;
  currentSchool: School;
  myMajorPostCount: number;
  mySchoolPostCount: number;
  onUpdateProfile: (updated: {
    name: string;
    nickname: string;
    grade: string;
    targetMajor: string;
    bio: string;
    phone: string;
    profileImage?: string;
  }) => void;
  onOpenReAuthModal: () => void;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  currentSchool,
  myMajorPostCount,
  mySchoolPostCount,
  onUpdateProfile,
  onOpenReAuthModal,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [nickname, setNickname] = useState(
    currentUser.nickname || `${currentUser.name}학생`
  );
  const [grade, setGrade] = useState(currentUser.grade || '고2');
  const [targetMajor, setTargetMajor] = useState(
    currentUser.targetMajor || '컴퓨터·IT·인공지능'
  );
  const [bio, setBio] = useState(
    currentUser.bio || `${currentSchool.name} 재학 중인 ${currentUser.grade} 학생입니다.`
  );
  const [phone, setPhone] = useState(currentUser.phone || '010-3849-2910');
  const [savedNotice, setSavedNotice] = useState(false);
  const [galleryPermissionError, setGalleryPermissionError] = useState<string | null>(null);

  // 상위에서 로그인 정보가 바뀌면 입력 폼도 동기화
  useEffect(() => {
    setName(currentUser.name);
    setNickname(currentUser.nickname || `${currentUser.name}학생`);
    setGrade(currentUser.grade || '고2');
    setTargetMajor(currentUser.targetMajor || '컴퓨터·IT·인공지능');
    setBio(currentUser.bio || `${currentSchool.name} 재학 중인 ${currentUser.grade} 학생입니다.`);
    setPhone(currentUser.phone || '010-3849-2910');
  }, [currentUser, currentSchool.name]);

  const handleSaveProfile = () => {
    if (!name.trim() || !nickname.trim()) {
      Alert.alert('프로필 수정', '이름과 닉네임을 입력해주세요.');
      return;
    }

    onUpdateProfile({
      name: name.trim(),
      nickname: nickname.trim(),
      grade,
      targetMajor,
      bio: bio.trim(),
      phone: phone.trim(),
    });

    setIsEditing(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const editSectionYRef = useRef<number>(0);

  const handleOpenEditFromCard = () => {
    setIsEditing(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, editSectionYRef.current - 12),
        animated: true,
      });
    }, 80);
  };

  // 아이폰/안드로이드 OS 시스템 갤러리 접근 권한 요청 후 바로 사진 선택 실행
  const handleRequestGalleryAccess = async () => {
    setGalleryPermissionError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setGalleryPermissionError(
          '갤러리 접근 권한이 거부되었습니다. 기기 설정에서 사진 접근 권한을 허용해 주세요.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;

        onUpdateProfile({
          name: name.trim() || currentUser.name,
          nickname: nickname.trim() || currentUser.nickname || `${currentUser.name}학생`,
          grade,
          targetMajor,
          bio: bio.trim(),
          phone: phone.trim(),
          profileImage: imageUri,
        });
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
      }
    } catch {
      setGalleryPermissionError('갤러리를 여는 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  // 기본 프로필 아바타로 초기화
  const handleResetProfileImage = () => {
    onUpdateProfile({
      name: name.trim() || currentUser.name,
      nickname: nickname.trim() || currentUser.nickname || `${currentUser.name}학생`,
      grade,
      targetMajor,
      bio: bio.trim(),
      phone: phone.trim(),
      profileImage: '',
    });
  };

  const socialLabel =
    currentUser.socialProvider === 'naver'
      ? '네이버'
      : currentUser.socialProvider === 'google'
      ? 'Google'
      : currentUser.socialProvider === 'apple'
      ? 'Apple'
      : '카카오톡';

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. 디지털 모바일 학생증 카드 */}
      <View style={styles.studentIdCard}>
        <View style={styles.idCardTopRow}>
          <View style={styles.idCardTitleWrap}>
            <Ionicons name="shield-checkmark" size={14} color="#34d399" />
            <Text style={styles.idCardTitleText}>HIGHTIME STUDENT ID</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>PASS + 재학PDF 인증완료</Text>
          </View>
        </View>

        <View style={styles.profileRow}>
          <TouchableOpacity
            style={{ position: 'relative' }}
            onPress={handleRequestGalleryAccess}
            activeOpacity={0.8}
          >
            {currentUser.profileImage ? (
              <Image
                source={{ uri: currentUser.profileImage }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  borderWidth: 2,
                  borderColor: '#f8fafc',
                }}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{currentUser.name.slice(0, 1)}</Text>
              </View>
            )}
            <View
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: '#334155',
                borderWidth: 1.5,
                borderColor: '#0f172a',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="camera" size={11} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.studentName}>{currentUser.name}</Text>
              <Text style={styles.nicknameBadge}>
                @{currentUser.nickname || `${currentUser.name}학생`}
              </Text>
            </View>
            <Text style={styles.schoolInfoText}>
              {currentSchool.name} ({currentSchool.region}) · {currentUser.grade}
            </Text>
            <Text style={styles.majorInfoText}>
              희망 진로: {currentUser.targetMajor || '컴퓨터·IT·인공지능'}
            </Text>
          </View>
        </View>

        <Text style={styles.bioText}>
          "{currentUser.bio || `${currentSchool.name} 재학 중인 ${currentUser.grade} 학생입니다.`}"
        </Text>

        {/* 인증 상세 내역 */}
        <View style={styles.certMetaBox}>
          <View style={styles.certMetaRow}>
            <Text style={styles.certMetaLabel}>연동 소셜 계정</Text>
            <Text style={styles.certMetaValue}>
              {socialLabel} ({currentUser.email || 'seojeongyun@kakao.com'})
            </Text>
          </View>
          <View style={styles.certMetaRow}>
            <Text style={styles.certMetaLabel}>PASS 본인인증</Text>
            <Text style={styles.certMetaSuccess}>
              실명 일치 완료 ({currentUser.telecom || 'SKT'} · {currentUser.birthDate || '090514'})
            </Text>
          </View>
          <View style={styles.certMetaRow}>
            <Text style={styles.certMetaLabel}>재학증명서 PDF</Text>
            <Text style={styles.certMetaSuccess} numberOfLines={1}>
              {currentUser.certFileName || `2026학년도_재학증명서_${currentUser.name}.pdf`}
            </Text>
          </View>
        </View>

        {/* 검은 학생증 카드 내 프로필 수정 및 사진 변경 버튼 */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 12,
              paddingVertical: 10,
            }}
            onPress={handleRequestGalleryAccess}
            activeOpacity={0.85}
          >
            <Ionicons name="images-outline" size={15} color="#f8fafc" />
            <Text style={{ color: '#f8fafc', fontSize: 12, fontWeight: '800' }}>
              사진 변경
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: '#1e293b',
              borderWidth: 1,
              borderColor: '#334155',
              borderRadius: 12,
              paddingVertical: 10,
            }}
            onPress={handleOpenEditFromCard}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={15} color="#f8fafc" />
            <Text style={{ color: '#f8fafc', fontSize: 12, fontWeight: '800' }}>
              프로필 수정
            </Text>
          </TouchableOpacity>
        </View>

        {currentUser.profileImage ? (
          <TouchableOpacity
            style={{ marginTop: 8, alignSelf: 'flex-end' }}
            onPress={handleResetProfileImage}
          >
            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>
              기본 프로필 이미지로 되돌리기
            </Text>
          </TouchableOpacity>
        ) : null}

        {galleryPermissionError && (
          <View
            style={{
              marginTop: 10,
              backgroundColor: 'rgba(239, 68, 68, 0.16)',
              borderWidth: 1,
              borderColor: 'rgba(248, 113, 113, 0.45)',
              borderRadius: 10,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="alert-circle" size={15} color="#fca5a5" />
            <Text style={{ color: '#fecaca', fontSize: 11, fontWeight: '700', flex: 1 }}>
              {galleryPermissionError}
            </Text>
          </View>
        )}
      </View>

      {/* 저장 완료 알림 배너 */}
      {savedNotice && (
        <View style={styles.savedBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#15803d" />
          <Text style={styles.savedBannerText}>
            프로필 정보가 수정되어 앱 전체와 클라우드 DB에 반영되었습니다!
          </Text>
        </View>
      )}

      {/* 2. 내 활동 요약 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{myMajorPostCount}</Text>
          <Text style={styles.statLabel}>내 전공게시글</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mySchoolPostCount}</Text>
          <Text style={styles.statLabel}>내 학교게시글</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#16a34a' }]}>정회원</Text>
          <Text style={styles.statLabel}>커뮤니티 등급</Text>
        </View>
      </View>

      {/* 3. 프로필 정보 수정 섹션 */}
      <View
        style={styles.sectionCard}
        onLayout={(e) => {
          editSectionYRef.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="create-outline" size={18} color="#dc2626" />
            <Text style={styles.sectionTitle}>내 프로필 정보 관리 및 수정</Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editToggleBtnText}>프로필 수정</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isEditing ? (
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>이름 (실명)</Text>
              <Text style={styles.infoVal}>{currentUser.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>커뮤니티 닉네임</Text>
              <Text style={styles.infoVal}>
                {currentUser.nickname || `${currentUser.name}학생`}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>소속 고등학교</Text>
              <Text style={[styles.infoVal, { color: '#dc2626' }]}>{currentSchool.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>현재 학년</Text>
              <Text style={styles.infoVal}>{currentUser.grade}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>희망 전공 / 진로</Text>
              <Text style={styles.infoVal}>
                {currentUser.targetMajor || '컴퓨터·IT·인공지능'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>휴대폰 번호</Text>
              <Text style={styles.infoVal}>{currentUser.phone || '010-3849-2910'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>한줄 소개</Text>
              <Text style={styles.infoVal}>
                {currentUser.bio || `${currentSchool.name} 재학 중인 ${currentUser.grade} 학생입니다.`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.editForm}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>이름</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="이름 입력"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>커뮤니티 활동 닉네임</Text>
              <TextInput
                style={styles.textInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임 입력"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>학년 변경 (시간표 자동 연동)</Text>
              <View style={styles.gradeSelector}>
                {['고1', '고2', '고3'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.gradeBtn, grade === g && styles.gradeBtnActive]}
                    onPress={() => setGrade(g)}
                  >
                    <Text
                      style={[
                        styles.gradeBtnText,
                        grade === g && styles.gradeBtnTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>희망 진로 / 전공 분야</Text>
              <View style={styles.majorChipWrap}>
                {MAJOR_CATEGORIES.filter((m) => m.id !== 'all').map((m) => {
                  const selected = targetMajor === m.name;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.majorChip, selected && styles.majorChipActive]}
                      onPress={() => setTargetMajor(m.name)}
                    >
                      <Text
                        style={[
                          styles.majorChipText,
                          selected && styles.majorChipTextActive,
                        ]}
                      >
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>휴대폰 번호</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="010-0000-0000"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>한줄 자기소개</Text>
              <TextInput
                style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                multiline
                placeholder="자신을 소개하는 한줄 메시지를 적어주세요"
              />
            </View>

            <View style={styles.editActionRow}>
              <TouchableOpacity
                style={styles.cancelEditBtn}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelEditBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveEditBtn} onPress={handleSaveProfile}>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                <Text style={styles.saveEditBtnText}>프로필 변경사항 저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 4. 계정 보안 및 학교 재인증 / 로그아웃 */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.reAuthButton} onPress={onOpenReAuthModal}>
          <View style={styles.reAuthLeft}>
            <Ionicons name="school-outline" size={18} color="#0f172a" />
            <View>
              <Text style={styles.reAuthTitle}>전학 / 소속 고등학교 재인증 신청</Text>
              <Text style={styles.reAuthSub}>
                PASS 본인인증 및 새 재학증명서 PDF를 다시 제출합니다
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>로그아웃 (로그인 화면으로 돌아가기)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 32,
  },
  studentIdCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  idCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  idCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idCardTitleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  nicknameBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fca5a5',
  },
  schoolInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  majorInfoText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  bioText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  certMetaBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    gap: 5,
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  certMetaLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  certMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  certMetaSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
    maxWidth: '65%',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  savedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532d',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  editToggleBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoVal: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '68%',
    textAlign: 'right',
  },
  editForm: {
    gap: 12,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  gradeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  gradeBtnActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  gradeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  gradeBtnTextActive: {
    color: '#dc2626',
    fontWeight: '800',
  },
  majorChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  majorChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  majorChipActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  majorChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  majorChipTextActive: {
    color: '#dc2626',
    fontWeight: '800',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  cancelEditBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  saveEditBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveEditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionSection: {
    gap: 10,
  },
  reAuthButton: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reAuthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reAuthTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  reAuthSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#fecaca',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
});
