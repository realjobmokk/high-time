// 4번 탭: 내 정보(Profile) 조회 및 수정 탭 컴포넌트 (Figma v2.0 에디토리얼 디자인 적용)
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CurrentUser, School } from '../../types';
import { MAJOR_CATEGORIES } from '../../data/mockData';
import { COLORS } from '../../theme/colors';

interface ProfileTabProps {
  currentUser: CurrentUser;
  currentSchool: School;
  myMajorPostCount: number;
  mySchoolPostCount: number;
  myCommentCount?: number;
  chatRoomCount?: number;
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
  onOpenAdmissionConsult?: () => void;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  currentSchool,
  myMajorPostCount,
  mySchoolPostCount,
  myCommentCount = 0,
  chatRoomCount = 0,
  onUpdateProfile,
  onOpenReAuthModal,
  onOpenAdmissionConsult,
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

  useEffect(() => {
    setName(currentUser.name);
    setNickname(currentUser.nickname || `${currentUser.name}학생`);
    setGrade(currentUser.grade || '고2');
    setTargetMajor(currentUser.targetMajor || '컴퓨터·IT·인공지능');
    setBio(currentUser.bio || `${currentSchool.name} 재학 중인 ${currentUser.grade} 학생입니다.`);
    setPhone(currentUser.phone || '010-3849-2910');
  }, [currentUser, currentSchool.name]);

  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

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

  const totalMyPosts = myMajorPostCount + mySchoolPostCount;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. 학생 프로필 영역 */}
      <View style={styles.profileSection}>
        <View style={styles.nameRow}>
          <TouchableOpacity
            style={styles.nameWithAvatar}
            onPress={handleRequestGalleryAccess}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrap}>
              {currentUser.profileImage ? (
                <Image
                  source={{ uri: currentUser.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(currentUser.name || currentUser.nickname || '학').slice(0, 1)}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={11} color="#ffffff" />
              </View>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {currentUser.name || currentUser.nickname || '학생'}
            </Text>
          </TouchableOpacity>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{currentUser.grade || '고2'}</Text>
          </View>
        </View>

        <Text style={styles.schoolText}>{currentSchool.name}</Text>

        {/* 관심 있는 진로 카드 */}
        <View style={styles.majorCard}>
          <Text style={styles.majorCardLabel}>관심 있는 진로</Text>
          <Text style={styles.majorCardTitle}>
            {currentUser.targetMajor || '컴퓨터·IT·인공지능'}
          </Text>
          <TouchableOpacity
            style={styles.consultLinkBtn}
            onPress={onOpenAdmissionConsult}
            activeOpacity={0.75}
          >
            <Text style={styles.consultLinkText}>입시 컨설팅 알아보기  →</Text>
          </TouchableOpacity>
        </View>

        {/* 학교 인증 상태 */}
        <View style={styles.authRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} />
          <Text style={styles.authText}>
            {currentUser.passVerified || currentUser.certVerified
              ? 'PASS · 재학증명서 인증 완료'
              : '학교 학생 인증 대기 중'}
          </Text>
        </View>
      </View>

      {savedNotice && (
        <View style={styles.savedBanner}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
          <Text style={styles.savedBannerText}>프로필 정보가 저장되었습니다.</Text>
        </View>
      )}

      {galleryPermissionError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{galleryPermissionError}</Text>
        </View>
      )}

      {/* 2. 내 활동 요약 */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionTitle}>내 활동</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalMyPosts}</Text>
            <Text style={styles.statLabel}>작성한 글</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myCommentCount}</Text>
            <Text style={styles.statLabel}>달린 댓글</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{chatRoomCount}</Text>
            <Text style={styles.statLabel}>1:1 채팅</Text>
          </View>
        </View>
      </View>

      {/* 3. 프로필 수정 인라인 폼 (수정 클릭 시 펼침) */}
      {isEditing && (
        <View style={styles.editCard}>
          <Text style={styles.editTitle}>프로필 및 희망 전공 수정</Text>

          <Text style={styles.inputLabel}>이름</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="이름"
            placeholderTextColor={COLORS.muted}
          />

          <Text style={styles.inputLabel}>활동 닉네임</Text>
          <TextInput
            style={styles.textInput}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임"
            placeholderTextColor={COLORS.muted}
          />

          <Text style={styles.inputLabel}>학년</Text>
          <View style={styles.gradeRow}>
            {(['고1', '고2', '고3'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.gradeOption, grade === g && styles.gradeOptionActive]}
                onPress={() => setGrade(g)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.gradeOptionText,
                    grade === g && styles.gradeOptionTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>희망 진로 / 전공</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.majorChipRow}
          >
            {MAJOR_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const selected = targetMajor === cat.name;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.majorOption, selected && styles.majorOptionActive]}
                  onPress={() => setTargetMajor(cat.name)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.majorOptionText,
                      selected && styles.majorOptionTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>한줄 소개</Text>
          <TextInput
            style={styles.textInput}
            value={bio}
            onChangeText={setBio}
            placeholder="나를 한 줄로 소개해보세요"
            placeholderTextColor={COLORS.muted}
          />

          <View style={styles.editBtnRow}>
            <TouchableOpacity
              style={styles.cancelEditBtn}
              onPress={() => setIsEditing(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelEditBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveEditBtn}
              onPress={handleSaveProfile}
              activeOpacity={0.85}
            >
              <Text style={styles.saveEditBtnText}>저장하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 4. 프로필 및 계정 관리 메뉴 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>프로필 및 계정</Text>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setIsEditing((prev) => !prev)}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={19} color={COLORS.ink} />
          <Text style={styles.menuText}>프로필 및 희망 전공 수정</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={onOpenReAuthModal}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={19} color={COLORS.ink} />
          <Text style={styles.menuText}>학교 재인증 관리</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={19} color={COLORS.muted} />
          <Text style={styles.menuTextMuted}>로그아웃</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 26,
  },

  // 1. 학생 프로필
  profileSection: {
    gap: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameWithAvatar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.avatarGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.success,
  },
  cameraBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.ink,
    borderWidth: 2,
    borderColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.6,
  },
  gradeBadge: {
    backgroundColor: COLORS.sageSurface,
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
    letterSpacing: -0.24,
  },
  schoolText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.28,
    marginTop: -6,
  },
  majorCard: {
    backgroundColor: COLORS.sageCard,
    borderRadius: 12,
    padding: 16,
    gap: 5,
  },
  majorCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.22,
  },
  majorCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  consultLinkBtn: {
    paddingTop: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  consultLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
    letterSpacing: -0.26,
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.success,
    letterSpacing: -0.24,
  },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sageSurface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  savedBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  errorBanner: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: 10,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: COLORS.accent,
  },

  // 2. 내 활동
  sectionBlock: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    gap: 5,
  },
  statNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.24,
  },

  // 수정 폼
  editCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  editTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  textInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeOption: {
    flex: 1,
    backgroundColor: COLORS.sageCard,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  gradeOptionActive: {
    backgroundColor: COLORS.ink,
  },
  gradeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  gradeOptionTextActive: {
    color: '#ffffff',
  },
  majorChipRow: {
    gap: 6,
  },
  majorOption: {
    backgroundColor: COLORS.sageCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  majorOptionActive: {
    backgroundColor: COLORS.ink,
  },
  majorOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  majorOptionTextActive: {
    color: '#ffffff',
  },
  editBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  cancelEditBtn: {
    flex: 1,
    backgroundColor: COLORS.sageCard,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  saveEditBtn: {
    flex: 1,
    backgroundColor: COLORS.ink,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // 4. 메뉴
  menuSection: {
    width: '100%',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.ink,
    letterSpacing: -0.28,
  },
  menuTextMuted: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.muted,
    letterSpacing: -0.28,
  },
});
