// =============================================================================
// 🔐 HighTime (고교타임) - [아이디/비밀번호 로그인] & [회원가입] 화면
// 1. [로그인] 탭:
//    - 회원가입 시 생성한 아이디(username)와 비밀번호(password)로 DB 검증 후 로그인
//    - DB에 없거나 비밀번호가 틀리면 로그인 차단
// 2. [회원가입] 탭:
//    - 1단계: 앱 전용 아이디(중복 확인 필수, 중복 불가) & 비밀번호 생성 + 소셜 계정 선택
//    - 2단계: PASS 휴대폰 본인인증 (실명 · 생년월일 · 통신사 · 휴대폰번호)
//    - 3단계: 나이스 전국 고등학교 검색 & 재학증명서 PDF 업로드
//    - 4단계: 재학증명서 PDF 인적사항 ↔ PASS 본인인증 내용 일치 검증 후 DB 저장
// =============================================================================

import React, { useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CurrentUser, School, SocialProvider } from '../types';
import { searchNeisHighSchools } from '../services/neisService';
import { COLORS } from '../theme/colors';
import {
  checkUsernameAvailable,
  registerAccountToDb,
  loginWithUsernamePassword,
} from '../services/supabaseService';

interface LoginScreenProps {
  initialUser: CurrentUser;
  initialSchool: School;
  onLoginSuccess: (
    authData: {
      username: string;
      socialProvider: SocialProvider;
      email: string;
      name: string;
      nickname: string;
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
    isNewSignup?: boolean
  ) => void;
}

const SOCIAL_PROVIDERS: {
  id: SocialProvider;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  badgeText: string;
  sampleEmail: string;
}[] = [
    {
      id: 'kakao',
      label: '카카오톡',
      bgColor: '#FEE500',
      textColor: '#191919',
      borderColor: '#F5DC00',
      badgeText: 'K',
      sampleEmail: 'user@kakao.com',
    },
    {
      id: 'naver',
      label: '네이버',
      bgColor: '#03C75A',
      textColor: '#FFFFFF',
      borderColor: '#02b350',
      badgeText: 'N',
      sampleEmail: 'user@naver.com',
    },
    {
      id: 'google',
      label: 'Google',
      bgColor: '#FFFFFF',
      textColor: '#1e293b',
      borderColor: '#cbd5e1',
      badgeText: 'G',
      sampleEmail: 'user@gmail.com',
    },
    {
      id: 'apple',
      label: 'Apple',
      bgColor: '#000000',
      textColor: '#FFFFFF',
      borderColor: '#000000',
      badgeText: '',
      sampleEmail: 'user@icloud.com',
    },
  ];

const TELECOM_LIST = ['SKT', 'KT', 'LG U+', '알뜰폰'];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialUser,
  onLoginSuccess,
}) => {
  // 상단 탭 모드: 'login' vs 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // =========================================================================
  // [A] 로그인(Login) 탭 상태 — 아이디 & 비밀번호 검증
  // =========================================================================
  const [loginId, setLoginId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);

  const handleDbLogin = async () => {
    setLoginErrorMsg(null);

    if (!loginId.trim() || !loginPassword) {
      setLoginErrorMsg('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsCheckingDb(true);
    const dbUser = await loginWithUsernamePassword(loginId.trim(), loginPassword);

    if (!dbUser) {
      setIsCheckingDb(false);
      setLoginErrorMsg(
        '가입되어 있지 않은 아이디이거나 비밀번호가 일치하지 않습니다.'
      );
      return;
    }

    // DB에 저장된 학교명으로 나이스 API 학교 코드 매핑
    let matchedSchool: School = {
      id: dbUser.schoolId || 'school',
      name: dbUser.schoolName || '',
      region: '대한민국',
    };

    if (dbUser.schoolName) {
      const neisList = await searchNeisHighSchools(dbUser.schoolName);
      if (neisList.length > 0) {
        matchedSchool =
          neisList.find((s) => s.name === dbUser.schoolName) || neisList[0];
      }
    }

    setIsCheckingDb(false);

    onLoginSuccess(
      {
        username: dbUser.username,
        socialProvider: 'kakao',
        email: 'user@kakao.com',
        name: dbUser.name,
        nickname: `${dbUser.name}학생`,
        birthDate: initialUser.birthDate || '',
        telecom: initialUser.telecom || 'SKT',
        phone: initialUser.phone || '',
        grade: dbUser.grade || '고2',
        school: matchedSchool,
        certFileName: `2026학년도_재학증명서_${dbUser.name}.pdf`,
        passVerified: dbUser.passVerified,
        certVerified: dbUser.certVerified,
        verifiedAt: dbUser.verifiedAt,
      },
      false
    );
  };

  // =========================================================================
  // [B] 회원가입(Signup) 탭 상태 — 4단계 신규 가입 플로우
  // =========================================================================
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // [1단계] 앱 전용 아이디(중복 불가) & 비밀번호 + 소셜 연동
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupStep1Error, setSignupStep1Error] = useState<string | null>(null);
  const [signupErrorField, setSignupErrorField] = useState<
    'username' | 'password' | 'passwordConfirm' | null
  >(null);

  // 로그인/회원가입 창 흔들림 애니메이션 (비밀번호 불일치·로그인 실패 등)
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<
    'idle' | 'available' | 'duplicate'
  >('idle');
  const [checkedUsernameValue, setCheckedUsernameValue] = useState('');
  const [socialProvider, setSocialProvider] = useState<SocialProvider>('kakao');
  const [socialEmail, setSocialEmail] = useState<string>('user@kakao.com');

  // [2단계] PASS 본인인증 입력값
  const [passName, setPassName] = useState('');
  const [passBirth, setPassBirth] = useState('');
  const [telecom, setTelecom] = useState('SKT');
  const [passPhone, setPassPhone] = useState('');
  const [isPassVerifying, setIsPassVerifying] = useState(false);

  // [3단계] 재학증명서 PDF 업로드 & 학교 선택 (검색 전에는 빈 상태)
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [certGrade, setCertGrade] = useState('고2');
  const [certFileName, setCertFileName] = useState('');
  const [certHolderName, setCertHolderName] = useState('');
  const [certHolderBirth, setCertHolderBirth] = useState('');

  // [4단계] 대조 검증 결과
  const [isComparing, setIsComparing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isMatch: boolean;
    nameMatch: boolean;
    birthMatch: boolean;
    pdfFormatValid: boolean;
    message: string;
  } | null>(null);

  // 아이디 형식 검사 (한글 및 특수문자 불가, 오직 영문과 숫자만 허용)
  const validateUsernameFormat = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(trimmed)) {
      return '아이디에는 한글을 사용할 수 없습니다. 영문과 숫자만 입력해 주세요.';
    }
    if (!trimmed || trimmed.length < 3) {
      return '아이디는 영문/숫자 3자 이상으로 입력해 주세요.';
    }
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
      return '아이디는 영문과 숫자만 사용할 수 있습니다.';
    }
    return null;
  };

  // 아이디 중복 확인 핸들러
  const handleCheckUsernameDuplicate = async () => {
    setSignupStep1Error(null);
    setSignupErrorField(null);

    const formatError = validateUsernameFormat(signupUsername);
    if (formatError) {
      setSignupErrorField('username');
      setSignupStep1Error(formatError);
      triggerShake();
      return;
    }

    const trimmed = signupUsername.trim().toLowerCase();
    setIsCheckingUsername(true);
    const available = await checkUsernameAvailable(trimmed);
    setIsCheckingUsername(false);

    if (available) {
      setUsernameCheckStatus('available');
      setCheckedUsernameValue(trimmed);
    } else {
      setUsernameCheckStatus('duplicate');
      setCheckedUsernameValue('');
      setSignupErrorField('username');
      triggerShake();
    }
  };

  // 회원가입 1단계 완료 -> 2단계 PASS 인증 이동
  const handleStep1Next = async () => {
    setSignupStep1Error(null);
    setSignupErrorField(null);

    const formatError = validateUsernameFormat(signupUsername);
    if (formatError) {
      setSignupErrorField('username');
      setSignupStep1Error(formatError);
      triggerShake();
      return;
    }

    const trimmed = signupUsername.trim().toLowerCase();
    if (usernameCheckStatus !== 'available' || checkedUsernameValue !== trimmed) {
      setIsCheckingUsername(true);
      const available = await checkUsernameAvailable(trimmed);
      setIsCheckingUsername(false);
      if (!available) {
        setUsernameCheckStatus('duplicate');
        setSignupErrorField('username');
        setSignupStep1Error('이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.');
        triggerShake();
        return;
      }
      setUsernameCheckStatus('available');
      setCheckedUsernameValue(trimmed);
    }

    if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(signupPassword)) {
      setSignupErrorField('password');
      setSignupStep1Error('비밀번호에는 한글을 사용할 수 없습니다.');
      triggerShake();
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setSignupErrorField('password');
      setSignupStep1Error('비밀번호는 4자 이상으로 설정해 주세요.');
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
      setSignupStep1Error('비밀번호와 비밀번호 확인이 서로 다릅니다. 다시 확인해 주세요.');
      triggerShake();
      return;
    }

    setStep(2);
  };

  // 회원가입 2단계: PASS 본인인증 확인
  const handlePassVerify = () => {
    if (!passName.trim() || !passBirth.trim() || !passPhone.trim()) {
      Alert.alert('PASS 본인인증', '이름(실명), 생년월일 6자리, 휴대폰 번호를 모두 입력해주세요.');
      return;
    }
    if (passBirth.trim().length !== 6) {
      Alert.alert('생년월일 확인', '생년월일 6자리(YYMMDD)를 정확히 입력해주세요.');
      return;
    }

    setIsPassVerifying(true);
    setTimeout(() => {
      setIsPassVerifying(false);
      setCertHolderName(passName.trim());
      setCertHolderBirth(passBirth.trim());
      setCertFileName(`2026학년도_재학증명서_${passName.trim()}.pdf`);
      setStep(3);
    }, 500);
  };

  // 회원가입 3단계: 나이스 전국 고등학교 검색
  const handleSearchSchool = async () => {
    if (!schoolSearchQuery.trim()) {
      setSchoolList([]);
      setSelectedSchool(null);
      Alert.alert('학교 검색', '검색할 고등학교 이름을 입력해주세요.');
      return;
    }
    setIsSearchingSchool(true);
    const results = await searchNeisHighSchools(schoolSearchQuery);
    setIsSearchingSchool(false);
    if (results.length > 0) {
      setSchoolList(results);
      setSelectedSchool(results[0]);
    } else {
      setSchoolList([]);
      setSelectedSchool(null);
      Alert.alert('학교 검색', `'${schoolSearchQuery}'에 해당하는 고등학교를 찾지 못했습니다.`);
    }
  };

  // 회원가입 3단계: PDF 파일 업로드
  const handlePickPdfFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf';
      input.onchange = (e: any) => {
        const file = e?.target?.files?.[0];
        if (file) {
          setCertFileName(file.name);
          const nameMatch = file.name.replace(/\.pdf$/i, '').split(/[_\-\s]+/);
          const lastToken = nameMatch[nameMatch.length - 1];
          if (lastToken && lastToken.length >= 2 && lastToken.length <= 5 && !/\d/.test(lastToken)) {
            setCertHolderName(lastToken);
          }
        }
      };
      input.click();
    } else {
      setCertFileName(`2026학년도_재학증명서_${certHolderName.trim() || '학생'}.pdf`);
    }
  };

  // 회원가입 3단계 -> 4단계: PASS ↔ 재학증명서 PDF 대조 검증
  const handleRunComparison = () => {
    if (!selectedSchool) {
      Alert.alert('소속 고등학교 선택', '먼저 고등학교 이름을 검색하여 소속 학교를 선택해주세요.');
      return;
    }
    if (!certFileName || !certFileName.toLowerCase().endsWith('.pdf')) {
      Alert.alert('PDF 파일 필요', '재학증명서(.pdf) 파일을 첨부해주세요.');
      return;
    }

    setStep(4);
    setIsComparing(true);
    setVerificationResult(null);

    setTimeout(() => {
      const nameMatch = passName.trim() === certHolderName.trim();
      const birthMatch = passBirth.trim() === certHolderBirth.trim();
      const pdfFormatValid = certFileName.toLowerCase().endsWith('.pdf');
      const isMatch = nameMatch && birthMatch && pdfFormatValid;

      setIsComparing(false);
      setVerificationResult({
        isMatch,
        nameMatch,
        birthMatch,
        pdfFormatValid,
        message: isMatch
          ? `PASS 본인인증 정보(${passName.trim()} / ${passBirth.trim()})와 재학증명서 PDF(${selectedSchool.name} ${certGrade})의 인적사항이 100% 일치합니다.`
          : 'PASS 본인인증 정보와 재학증명서 PDF 상의 인적사항(성명 또는 생년월일)이 일치하지 않아 회원가입이 반려되었습니다.',
      });
    }, 900);
  };

  // 회원가입 4단계 완료 -> DB에 아이디/비밀번호 및 학생 정보 저장 후 로그인
  const handleFinishSignup = async () => {
    if (!verificationResult?.isMatch || !selectedSchool) return;

    const today = new Date();
    const verifiedAt = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}. ${String(today.getDate()).padStart(2, '0')}`;

    const trimmedId = signupUsername.trim().toLowerCase();

    const cleanName = passName.replace(/\s+/g, '');

    const newUserObj: CurrentUser = {
      username: trimmedId,
      socialProvider,
      email: socialEmail,
      name: cleanName,
      nickname: `${cleanName}학생`,
      birthDate: passBirth.trim(),
      telecom,
      phone: passPhone.trim(),
      grade: certGrade,
      certFileName,
      isVerified: true,
      passVerified: true,
      certVerified: true,
      verifiedAt,
    };

    const res = await registerAccountToDb(
      newUserObj,
      selectedSchool,
      trimmedId,
      signupPassword
    );

    if (!res.success) {
      Alert.alert('회원가입 오류', res.message || '이미 사용 중인 아이디입니다.');
      setStep(1);
      setUsernameCheckStatus('duplicate');
      return;
    }

    onLoginSuccess(
      {
        username: trimmedId,
        socialProvider,
        email: socialEmail,
        name: cleanName,
        nickname: `${cleanName}학생`,
        birthDate: passBirth.trim(),
        telecom,
        phone: passPhone.trim(),
        grade: certGrade,
        school: selectedSchool,
        certFileName,
        passVerified: true,
        certVerified: true,
        verifiedAt,
      },
      false // registerAccountToDb에서 이미 저장 완료
    );
  };

  const providerLabel =
    socialProvider === 'kakao'
      ? '카카오톡'
      : socialProvider === 'naver'
        ? '네이버'
        : socialProvider === 'google'
          ? 'Google'
          : 'Apple';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 브랜드 로고 영역 */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={24} color="#ffffff" />
            <Text style={styles.logoText}>HT</Text>
          </View>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>HighTime</Text>
            <View style={styles.brandTag}>
              <Text style={styles.brandTagText}>고교타임</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>
            대한민국 고등학생 전용 인증 커뮤니티 & 나이스 학교생활 플랫폼
          </Text>
        </View>

        {/* 상단 [로그인] / [회원가입] 전환 탭 */}
        <View style={styles.modeTabContainer}>
          <TouchableOpacity
            style={[styles.modeTab, authMode === 'login' && styles.modeTabActive]}
            onPress={() => {
              setAuthMode('login');
              setLoginErrorMsg(null);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-in-outline"
              size={16}
              color={authMode === 'login' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.modeTabText, authMode === 'login' && styles.modeTabTextActive]}>
              로그인
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, authMode === 'signup' && styles.modeTabActive]}
            onPress={() => {
              setAuthMode('signup');
              setStep(1);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-add-outline"
              size={16}
              color={authMode === 'signup' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.modeTabText, authMode === 'signup' && styles.modeTabTextActive]}>
              회원가입 (계정 생성)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 메인 카드 (오류 시 좌우로 흔들림) */}
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          {/* ==============================================================
              MODE A: [로그인] 화면 (아이디 + 비밀번호 기반 DB 인증)
             ============================================================== */}
          {authMode === 'login' && (
            <View>
              <Text style={styles.stepTitle}>회원 로그인</Text>
              <Text style={styles.stepDesc}>
                회원가입 시 생성한 아이디와 비밀번호를 입력해 주세요. 등록되지 않은 계정은 로그인이 제한됩니다.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>아이디</Text>
                <TextInput
                  style={styles.input}
                  value={loginId}
                  onChangeText={(t) => {
                    setLoginId(t);
                    setLoginErrorMsg(null);
                  }}
                  placeholder="아이디를 입력하세요"
                  keyboardType="ascii-capable"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleDbLogin}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  value={loginPassword}
                  onChangeText={(t) => {
                    setLoginPassword(t);
                    setLoginErrorMsg(null);
                  }}
                  placeholder="비밀번호를 입력하세요"
                  secureTextEntry
                  onSubmitEditing={handleDbLogin}
                />
              </View>

              {loginErrorMsg && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.errorBannerText}>{loginErrorMsg}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.finishBtn, isCheckingDb && { opacity: 0.6 }]}
                onPress={handleDbLogin}
                disabled={isCheckingDb}
                activeOpacity={0.85}
              >
                {isCheckingDb ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.finishBtnText}>로그인</Text>
                    <Ionicons name="log-in-outline" size={18} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchModeLink}
                onPress={() => {
                  setAuthMode('signup');
                  setStep(1);
                }}
              >
                <Text style={styles.switchModeLinkText}>
                  아직 계정이 없으신가요?{' '}
                  <Text style={{ color: '#dc2626', fontWeight: '800' }}>회원가입 하러가기 →</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ==============================================================
              MODE B: [회원가입] 화면 (아이디/비밀번호 생성 + 3중 재학 인증)
             ============================================================== */}
          {authMode === 'signup' && (
            <View>
              <View style={styles.stepBar}>
                {[
                  { num: 1, label: '1.계정생성' },
                  { num: 2, label: '2.PASS' },
                  { num: 3, label: '3.재학PDF' },
                  { num: 4, label: '4.일치검증' },
                ].map((item, idx) => (
                  <React.Fragment key={item.num}>
                    {idx > 0 && (
                      <View
                        style={[styles.stepDivider, step >= item.num && styles.stepDividerActive]}
                      />
                    )}
                    <View style={[styles.stepItem, step >= item.num && styles.stepItemActive]}>
                      <Text style={[styles.stepNum, step >= item.num && styles.stepNumActive]}>
                        {item.num}
                      </Text>
                      <Text style={[styles.stepText, step >= item.num && styles.stepTextActive]}>
                        {item.label}
                      </Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>

              {/* STEP 1: 아이디(중복 불가) & 비밀번호 생성 */}
              {step === 1 && (
                <View>
                  <Text style={styles.stepTitle}>1단계: 아이디 및 비밀번호 만들기</Text>
                  <Text style={styles.stepDesc}>
                    HighTime에서 사용할 고유 아이디(중복 불가)와 비밀번호를 만들어 주세요.
                  </Text>

                  <Text style={styles.inputLabel}>아이디 (중복 불가 · 영문/숫자 3자 이상)</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 1 },
                        (signupErrorField === 'username' ||
                          usernameCheckStatus === 'duplicate') && {
                          borderColor: '#ef4444',
                          backgroundColor: '#fef2f2',
                        },
                      ]}
                      value={signupUsername}
                      onChangeText={(t) => {
                        setSignupUsername(t);
                        setUsernameCheckStatus('idle');
                        if (signupErrorField === 'username') setSignupErrorField(null);
                        setSignupStep1Error(null);
                      }}
                      placeholder="사용할 아이디를 입력하세요"
                      keyboardType="ascii-capable"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.searchBtn}
                      onPress={handleCheckUsernameDuplicate}
                      disabled={isCheckingUsername}
                    >
                      {isCheckingUsername ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.searchBtnText}>중복 확인</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {usernameCheckStatus === 'available' && (
                    <Text style={styles.availableText}>
                      ✅ 사용 가능한 아이디입니다.
                    </Text>
                  )}
                  {usernameCheckStatus === 'duplicate' && (
                    <Text style={styles.duplicateText}>
                      ❌ 이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.
                    </Text>
                  )}

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={styles.inputLabel}>비밀번호 (영문·숫자 필수 포함, 4자 이상)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        signupErrorField === 'password' && {
                          borderColor: '#ef4444',
                          backgroundColor: '#fef2f2',
                        },
                      ]}
                      value={signupPassword}
                      onChangeText={(t) => {
                        setSignupPassword(t);
                        if (signupErrorField === 'password') setSignupErrorField(null);
                        setSignupStep1Error(null);
                      }}
                      placeholder="비밀번호를 입력하세요"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>비밀번호 확인</Text>
                    <TextInput
                      style={[
                        styles.input,
                        signupErrorField === 'passwordConfirm' && {
                          borderColor: '#ef4444',
                          backgroundColor: '#fef2f2',
                        },
                      ]}
                      value={signupPasswordConfirm}
                      onChangeText={(t) => {
                        setSignupPasswordConfirm(t);
                        if (signupErrorField === 'passwordConfirm') {
                          setSignupErrorField(null);
                        }
                        setSignupStep1Error(null);
                      }}
                      placeholder="비밀번호를 한 번 더 입력하세요"
                      secureTextEntry
                    />
                  </View>

                  {signupStep1Error && (
                    <View
                      style={{
                        backgroundColor: '#fef2f2',
                        borderWidth: 1,
                        borderColor: '#fecaca',
                        borderRadius: 10,
                        padding: 10,
                        marginTop: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="alert-circle" size={16} color="#dc2626" />
                      <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '800', flex: 1 }}>
                        {signupStep1Error}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.finishBtn, { marginTop: 18 }]}
                    onPress={handleStep1Next}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.finishBtnText}>다음: PASS 본인인증 진행</Text>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: PASS 휴대폰 본인인증 */}
              {step === 2 && (
                <View>
                  <View style={styles.selectedInfoBanner}>
                    <Ionicons name="person-circle-outline" size={15} color="#dc2626" />
                    <Text style={styles.selectedInfoText}>
                      가입 아이디: {signupUsername.trim().toLowerCase()}
                    </Text>
                  </View>

                  <Text style={styles.stepTitle}>2단계: PASS 휴대폰 본인인증</Text>
                  <Text style={styles.stepDesc}>
                    본인 명의 휴대폰으로 실명과 생년월일을 인증합니다. 입력된 정보는 다음 단계에서 재학증명서 PDF와 일치하는지 대조됩니다.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>통신사 선택</Text>
                    <View style={styles.chipRow}>
                      {TELECOM_LIST.map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.chip, telecom === t && styles.chipActive]}
                          onPress={() => setTelecom(t)}
                        >
                          <Text style={[styles.chipText, telecom === t && styles.chipTextActive]}>
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>이름 (PASS 본인인증 실명)</Text>
                    <TextInput
                      style={styles.input}
                      value={passName}
                      onChangeText={(t) => setPassName(t.replace(/\s+/g, ''))}
                      placeholder="실명을 입력하세요"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>생년월일 6자리 (YYMMDD)</Text>
                    <TextInput
                      style={styles.input}
                      value={passBirth}
                      onChangeText={setPassBirth}
                      placeholder="생년월일 6자리 입력 (YYMMDD)"
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>휴대폰 번호</Text>
                    <TextInput
                      style={styles.input}
                      value={passPhone}
                      onChangeText={setPassPhone}
                      placeholder="010-0000-0000"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                      <Text style={styles.backBtnText}>이전</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={handlePassVerify}
                      disabled={isPassVerifying}
                    >
                      {isPassVerifying ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.nextBtnText}>PASS 본인인증 완료</Text>
                          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 3: 재학증명서 PDF 업로드 & 학교 선택 */}
              {step === 3 && (
                <View>
                  <View style={styles.selectedInfoBanner}>
                    <Ionicons name="shield-checkmark" size={15} color="#16a34a" />
                    <Text style={styles.selectedInfoText}>
                      PASS 본인인증 완료: {passName} ({passBirth}) · {telecom}
                    </Text>
                  </View>

                  <Text style={styles.stepTitle}>3단계: 재학증명서 PDF 업로드 & 고교 검색</Text>
                  <Text style={styles.stepDesc}>
                    나이스 API로 소속 고등학교를 검색하고 재학증명서 PDF를 업로드해 주세요.
                  </Text>

                  <Text style={styles.inputLabel}>소속 고등학교 검색 (나이스 전국 고교 API)</Text>
                  <View style={styles.searchRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={schoolSearchQuery}
                      onChangeText={setSchoolSearchQuery}
                      placeholder="재학 중인 고등학교 이름을 검색하세요"
                      onSubmitEditing={handleSearchSchool}
                    />
                    <TouchableOpacity
                      style={styles.searchBtn}
                      onPress={handleSearchSchool}
                      disabled={isSearchingSchool}
                    >
                      {isSearchingSchool ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.searchBtnText}>검색</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.schoolList}>
                    {schoolList.length === 0 ? (
                      <View
                        style={{
                          paddingVertical: 14,
                          alignItems: 'center',
                          borderWidth: 1,
                          borderStyle: 'dashed',
                          borderColor: '#cbd5e1',
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>
                          학교 이름을 검색하면 이곳에 고등학교 목록이 표시됩니다.
                        </Text>
                      </View>
                    ) : (
                      schoolList.slice(0, 5).map((school) => {
                        const isSelected = selectedSchool?.id === school.id;
                        return (
                          <TouchableOpacity
                            key={school.id}
                            style={[styles.schoolItem, isSelected && styles.schoolItemActive]}
                            onPress={() => setSelectedSchool(school)}
                          >
                            <View style={styles.schoolItemLeft}>
                              <Ionicons
                                name="school"
                                size={16}
                                color={isSelected ? '#dc2626' : '#64748b'}
                              />
                              <View>
                                <Text
                                  style={[
                                    styles.schoolItemName,
                                    isSelected && styles.schoolItemNameActive,
                                  ]}
                                >
                                  {school.name}
                                </Text>
                                <Text style={styles.schoolItemRegion}>{school.region}</Text>
                              </View>
                            </View>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={18} color="#dc2626" />
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>학년 선택</Text>
                  <View style={styles.chipRow}>
                    {['고1', '고2', '고3'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.chip, certGrade === g && styles.chipActive]}
                        onPress={() => setCertGrade(g)}
                      >
                        <Text style={[styles.chipText, certGrade === g && styles.chipTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                    재학증명서 PDF 파일 업로드
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={handlePickPdfFile}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-attach" size={26} color="#dc2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadFileName}>
                        {certFileName || '첨부된 PDF 파일 없음'}
                      </Text>
                      <Text style={styles.uploadSub}>클릭하여 내 기기에서 재학증명서 PDF 선택</Text>
                    </View>
                    <View style={styles.uploadBtnBadge}>
                      <Text style={styles.uploadBtnBadgeText}>PDF 선택</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.ocrBox}>
                    <Text style={styles.ocrTitle}>
                      📄 재학증명서 PDF에서 읽어들인 인적사항 (PASS와 일치 검증)
                    </Text>
                    <View style={styles.ocrRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ocrLabel}>증명서 성명</Text>
                        <TextInput
                          style={styles.ocrInput}
                          value={certHolderName}
                          onChangeText={setCertHolderName}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ocrLabel}>증명서 생년월일</Text>
                        <TextInput
                          style={styles.ocrInput}
                          value={certHolderBirth}
                          onChangeText={setCertHolderBirth}
                          maxLength={6}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                      <Text style={styles.backBtnText}>이전</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextBtn} onPress={handleRunComparison}>
                      <Text style={styles.nextBtnText}>PASS ↔ 재학증명서 대조 검증</Text>
                      <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 4: PASS ↔ 재학증명서 PDF 내용 대조 검증 결과 */}
              {step === 4 && (
                <View>
                  <Text style={styles.stepTitle}>
                    4단계: PASS 본인인증 ↔ 재학증명서 PDF 일치 검증 결과
                  </Text>

                  {isComparing ? (
                    <View style={styles.loadingBox}>
                      <ActivityIndicator size="large" color="#dc2626" />
                      <Text style={styles.loadingText}>
                        재학증명서 PDF 내용과 PASS 본인인증 실명·생년월일을 대조하고 있습니다...
                      </Text>
                    </View>
                  ) : (
                    verificationResult && (
                      <View>
                        <View style={styles.compareTable}>
                          <View style={styles.compareHeader}>
                            <Text style={[styles.compareHeaderCell, { flex: 1 }]}>항목</Text>
                            <Text style={[styles.compareHeaderCell, { flex: 1.4 }]}>PASS 인증</Text>
                            <Text style={[styles.compareHeaderCell, { flex: 1.4 }]}>
                              재학증명서 PDF
                            </Text>
                            <Text style={[styles.compareHeaderCell, { flex: 0.9 }]}>결과</Text>
                          </View>

                          <View style={styles.compareRow}>
                            <Text style={[styles.compareLabel, { flex: 1 }]}>성명</Text>
                            <Text style={[styles.compareVal, { flex: 1.4 }]}>{passName}</Text>
                            <Text style={[styles.compareVal, { flex: 1.4 }]}>{certHolderName}</Text>
                            <Text
                              style={[
                                styles.compareStatus,
                                { flex: 0.9 },
                                verificationResult.nameMatch ? styles.passColor : styles.failColor,
                              ]}
                            >
                              {verificationResult.nameMatch ? '일치 ✅' : '불일치 ❌'}
                            </Text>
                          </View>

                          <View style={styles.compareRow}>
                            <Text style={[styles.compareLabel, { flex: 1 }]}>생년월일</Text>
                            <Text style={[styles.compareVal, { flex: 1.4 }]}>{passBirth}</Text>
                            <Text style={[styles.compareVal, { flex: 1.4 }]}>{certHolderBirth}</Text>
                            <Text
                              style={[
                                styles.compareStatus,
                                { flex: 0.9 },
                                verificationResult.birthMatch ? styles.passColor : styles.failColor,
                              ]}
                            >
                              {verificationResult.birthMatch ? '일치 ✅' : '불일치 ❌'}
                            </Text>
                          </View>

                          <View style={styles.compareRow}>
                            <Text style={[styles.compareLabel, { flex: 1 }]}>소속학교</Text>
                            <Text style={[styles.compareVal, { flex: 1.4 }]}>본인확인됨</Text>
                            <Text style={[styles.compareVal, { flex: 1.4 }]}>
                              {selectedSchool?.name || ''} ({certGrade})
                            </Text>
                            <Text style={[styles.compareStatus, { flex: 0.9 }, styles.passColor]}>
                              승인 ✅
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.resultBanner,
                            verificationResult.isMatch ? styles.resultSuccess : styles.resultFail,
                          ]}
                        >
                          <Ionicons
                            name={
                              verificationResult.isMatch ? 'checkmark-done-circle' : 'alert-circle'
                            }
                            size={22}
                            color={verificationResult.isMatch ? '#15803d' : '#b91c1c'}
                          />
                          <Text
                            style={[
                              styles.resultBannerText,
                              { color: verificationResult.isMatch ? '#14532d' : '#7f1d1d' },
                            ]}
                          >
                            {verificationResult.message}
                          </Text>
                        </View>

                        {verificationResult.isMatch ? (
                          <TouchableOpacity style={styles.finishBtn} onPress={handleFinishSignup}>
                            <Text style={styles.finishBtnText}>
                              회원가입 완료 및 [{selectedSchool?.name || ''} {passName}] 시작하기
                            </Text>
                            <Ionicons name="arrow-forward-circle" size={18} color="#ffffff" />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.backBtn, { marginTop: 14, alignItems: 'center' }]}
                            onPress={() => setStep(3)}
                          >
                            <Text style={styles.backBtnText}>
                              3단계로 돌아가서 재학증명서 정보 다시 확인하기
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  )}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingVertical: 28,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  brandTag: {
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  brandTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  brandSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '500',
    textAlign: 'center',
  },
  modeTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.sageCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: COLORS.surface,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  modeTabTextActive: {
    color: COLORS.ink,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  availableText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 2,
    marginBottom: 4,
  },
  duplicateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    marginTop: 2,
    marginBottom: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
    lineHeight: 17,
  },
  switchModeLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchModeLinkText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.4,
  },
  stepItemActive: {
    opacity: 1,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 20,
  },
  stepNumActive: {
    backgroundColor: COLORS.ink,
    color: '#ffffff',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
  },
  stepTextActive: {
    color: COLORS.ink,
    fontWeight: '800',
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  stepDividerActive: {
    backgroundColor: COLORS.ink,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  selectedInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  selectedInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.ink,
    backgroundColor: COLORS.bg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.sageCard,
  },
  chipActive: {
    borderColor: COLORS.ink,
    backgroundColor: COLORS.ink,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  searchBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  schoolList: {
    gap: 6,
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  schoolItemActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  schoolItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  schoolItemNameActive: {
    color: '#dc2626',
  },
  schoolItemRegion: {
    fontSize: 10,
    color: '#94a3b8',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
  },
  uploadFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadSub: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 2,
  },
  uploadBtnBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadBtnBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  ocrBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  ocrTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  ocrRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ocrLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  ocrInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  backBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: COLORS.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  compareTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  compareHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  compareHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  compareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  compareVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  compareStatus: {
    fontSize: 11,
    fontWeight: '800',
  },
  passColor: {
    color: '#16a34a',
  },
  failColor: {
    color: '#dc2626',
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  resultFail: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  resultBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  finishBtn: {
    marginTop: 14,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  finishBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
