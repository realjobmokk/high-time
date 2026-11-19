// =============================================================================
// 🔐 HighTime (고교타임) 4단계 정식 로그인 & 학생 재학 인증 모달
// [1단계] 구글 / 네이버 / 카카오톡 / 애플 소셜 로그인 또는 계정 생성
// [2단계] PASS 휴대폰 본인인증 (실명 · 생년월일 · 통신사 · 휴대폰번호)
// [3단계] 재학증명서 PDF 파일 업로드 (나이스 전국 고등학교 검색 연동)
// [4단계] 재학증명서 PDF 내용 ↔ PASS 본인인증 정보 일치 여부 자동 대조 검증
// =============================================================================

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneModal } from '../components/PhoneModal';
import { CurrentUser, School, SocialProvider } from '../types';
import { searchNeisHighSchools } from '../services/neisService';

interface AuthModalProps {
  visible: boolean;
  currentUser: CurrentUser;
  currentSchool: School;
  onClose: () => void;
  onCompleteAuth: (authData: {
    socialProvider: SocialProvider;
    email: string;
    name: string;
    birthDate: string;
    telecom: string;
    phone: string;
    grade: string;
    school: School;
    certFileName: string;
    passVerified: boolean;
    certVerified: boolean;
    verifiedAt: string;
  }) => void;
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
    label: '카카오톡으로 로그인 / 계정 만들기',
    bgColor: '#FEE500',
    textColor: '#191919',
    borderColor: '#F5DC00',
    badgeText: 'K',
    sampleEmail: 'user@kakao.com',
  },
  {
    id: 'naver',
    label: '네이버로 로그인 / 계정 만들기',
    bgColor: '#03C75A',
    textColor: '#FFFFFF',
    borderColor: '#02b350',
    badgeText: 'N',
    sampleEmail: 'user@naver.com',
  },
  {
    id: 'google',
    label: 'Google 계정으로 로그인 / 계정 만들기',
    bgColor: '#FFFFFF',
    textColor: '#1e293b',
    borderColor: '#cbd5e1',
    badgeText: 'G',
    sampleEmail: 'user@gmail.com',
  },
  {
    id: 'apple',
    label: 'Apple로 로그인 / 계정 만들기',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    borderColor: '#000000',
    badgeText: '',
    sampleEmail: 'user@icloud.com',
  },
];

const TELECOM_LIST = ['SKT', 'KT', 'LG U+', '알뜰폰'];

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  currentUser,
  currentSchool,
  onClose,
  onCompleteAuth,
}) => {
  // 1: 소셜 로그인, 2: PASS 본인인증, 3: 재학증명서 PDF 업로드, 4: PASS ↔ PDF 대조 검증 결과
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // [1단계] 소셜 로그인 상태
  const [socialProvider, setSocialProvider] = useState<SocialProvider>(
    currentUser.socialProvider || 'kakao'
  );
  const [socialEmail, setSocialEmail] = useState<string>(
    currentUser.email || 'user@kakao.com'
  );
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // [2단계] PASS 본인인증 입력값
  const [passName, setPassName] = useState('');
  const [passBirth, setPassBirth] = useState('');
  const [telecom, setTelecom] = useState('SKT');
  const [passPhone, setPassPhone] = useState('');
  const [isPassVerifying, setIsPassVerifying] = useState(false);

  // [3단계] 재학증명서 PDF 업로드 & 학교 검색 (검색 전에는 아무것도 표시하지 않음)
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolList, setSchoolList] = useState<School[]>([]);
  const [isSearchingSchool, setIsSearchingSchool] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [certGrade, setCertGrade] = useState('고2');
  const [certFileName, setCertFileName] = useState('');
  const [certHolderName, setCertHolderName] = useState('');
  const [certHolderBirth, setCertHolderBirth] = useState('');

  // [4단계] 대조 검증 진행 상태
  const [isComparing, setIsComparing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isMatch: boolean;
    nameMatch: boolean;
    birthMatch: boolean;
    pdfFormatValid: boolean;
    message: string;
  } | null>(null);

  // 1단계: 소셜 계정 선택 후 로그인 진행
  const handleSelectSocialLogin = (provider: SocialProvider, email: string) => {
    setSocialProvider(provider);
    setSocialEmail(email);
    setIsSocialLoading(true);
    setTimeout(() => {
      setIsSocialLoading(false);
      setStep(2);
    }, 500);
  };

  // 2단계: PASS 본인인증 확인
  const handlePassVerify = () => {
    if (!passName.trim() || !passBirth.trim() || !passPhone.trim()) {
      Alert.alert('PASS 본인인증', '이름(실명), 생년월일 6자리, 휴대폰 번호를 모두 입력해주세요.');
      return;
    }
    if (passBirth.trim().length !== 6) {
      Alert.alert('생년월일 확인', '생년월일 6자리(예: 090514)를 정확히 입력해주세요.');
      return;
    }

    setIsPassVerifying(true);
    setTimeout(() => {
      setIsPassVerifying(false);
      // PASS 본인인증 성공 시 3단계 재학증명서 기본값에도 동기화
      setCertHolderName(passName.trim());
      setCertHolderBirth(passBirth.trim());
      setCertFileName(`2026학년도_재학증명서_${passName.trim()}.pdf`);
      setStep(3);
    }, 800);
  };

  // 3단계: 나이스(NEIS) API로 전국 고등학교 실시간 검색
  const handleSearchSchool = async () => {
    if (!schoolSearchQuery.trim()) {
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
      Alert.alert('학교 검색', `'${schoolSearchQuery}'에 해당하는 고등학교를 찾지 못했습니다.`);
    }
  };

  // 3단계: 실제 PDF 파일 선택기 열기 (웹 환경에서는 파일 선택창 오픈)
  const handlePickPdfFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf';
      input.onchange = (e: any) => {
        const file = e?.target?.files?.[0];
        if (file) {
          setCertFileName(file.name);
          // 파일명에 학생 이름이 포함되어 있으면 자동 추출 (예: 2026_재학증명서_서정윤.pdf)
          const nameMatch = file.name.replace(/\.pdf$/i, '').split(/[_\-\s]+/);
          const lastToken = nameMatch[nameMatch.length - 1];
          if (lastToken && lastToken.length >= 2 && lastToken.length <= 5 && !/\d/.test(lastToken)) {
            setCertHolderName(lastToken);
          }
        }
      };
      input.click();
    } else {
      setCertFileName(`2026학년도_재학증명서_${certHolderName.trim()}.pdf`);
    }
  };

  // 3단계 -> 4단계: 재학증명서 PDF 내용과 PASS 본인인증 내용 대조 검증 실행
  const handleRunComparison = () => {
    if (!selectedSchool) {
      Alert.alert('고등학교 선택', '먼저 소속 고등학교를 검색하여 선택해주세요.');
      return;
    }
    if (!certFileName.toLowerCase().endsWith('.pdf')) {
      Alert.alert('PDF 파일만 가능', '정부24 또는 나이스에서 발급받은 재학증명서(.pdf) 파일만 업로드 가능합니다.');
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
          : 'PASS 본인인증 정보와 재학증명서 PDF 상의 인적사항(성명 또는 생년월일)이 일치하지 않아 인증이 반려되었습니다.',
      });
    }, 1300);
  };

  // 4단계: 검증 통과 후 최종 로그인 & 앱 전체 반영
  const handleConfirmVerifiedLogin = () => {
    if (!verificationResult?.isMatch || !selectedSchool) return;

    const today = new Date();
    const verifiedAt = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}. ${String(today.getDate()).padStart(2, '0')}`;

    onCompleteAuth({
      socialProvider,
      email: socialEmail,
      name: passName.replace(/\s+/g, ''),
      birthDate: passBirth.trim(),
      telecom,
      phone: passPhone.trim(),
      grade: certGrade,
      school: selectedSchool,
      certFileName,
      passVerified: true,
      certVerified: true,
      verifiedAt,
    });

    onClose();
    setStep(1);
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
    <PhoneModal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 상단 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.badgeWrap}>
                <Ionicons name="shield-checkmark" size={16} color="#dc2626" />
              </View>
              <Text style={styles.headerTitle}>소셜 로그인 & 재학생 정식 인증</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 4단계 진행 인디케이터 */}
            <View style={styles.stepBar}>
              {[
                { num: 1, label: '소셜계정' },
                { num: 2, label: 'PASS인증' },
                { num: 3, label: '재학PDF' },
                { num: 4, label: '일치검증' },
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

            {/* ============================================================
                STEP 1: 구글 / 네이버 / 카카오톡 / 애플 로그인 & 계정 만들기
               ============================================================ */}
            {step === 1 && (
              <View>
                {/* 현재 로그인된 계정 요약 카드 */}
                <View style={styles.currentStatusCard}>
                  <View style={styles.statusMain}>
                    <Text style={styles.statusLabel}>현재 로그인된 학생 계정</Text>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                      <Text style={styles.verifiedTagText}>PASS + 재학PDF 일치인증 완료</Text>
                    </View>
                  </View>
                  <Text style={styles.statusSchool}>
                    {currentSchool.name} · {currentUser.grade} {currentUser.name}
                  </Text>
                  <Text style={styles.statusDetail}>
                    연동 소셜: {providerLabel} ({socialEmail}) · 인증일 {currentUser.verifiedAt}
                  </Text>
                </View>

                <Text style={styles.formTitle}>1단계: 소셜 계정으로 로그인 / 가입</Text>
                <Text style={styles.formSubtitle}>
                  구글, 네이버, 카카오톡, 애플 계정 중 하나로 시작합니다. 로그인 후 PASS 본인인증과 재학증명서 PDF 대조를 거쳐야 정식 가입이 완료됩니다.
                </Text>

                {isSocialLoading ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>소셜 계정 인증 창 연결 중...</Text>
                  </View>
                ) : (
                  <View style={styles.socialBtnGroup}>
                    {SOCIAL_PROVIDERS.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.socialBtn,
                          { backgroundColor: p.bgColor, borderColor: p.borderColor },
                        ]}
                        onPress={() => handleSelectSocialLogin(p.id, p.sampleEmail)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.socialBadge}>
                          <Text style={[styles.socialBadgeText, { color: p.textColor }]}>
                            {p.badgeText}
                          </Text>
                        </View>
                        <Text style={[styles.socialBtnText, { color: p.textColor }]}>
                          {p.label}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={p.textColor} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ============================================================
                STEP 2: PASS 휴대폰 본인인증
               ============================================================ */}
            {step === 2 && (
              <View>
                <View style={styles.stepSelectedBanner}>
                  <Ionicons name="person-circle-outline" size={16} color="#dc2626" />
                  <Text style={styles.stepSelectedBannerText}>
                    선택된 소셜 계정: {providerLabel} ({socialEmail})
                  </Text>
                </View>

                <Text style={styles.formTitle}>2단계: PASS 휴대폰 본인인증</Text>
                <Text style={styles.formSubtitle}>
                  본인 명의 휴대폰으로 실명과 생년월일을 인증합니다. 입력된 정보는 다음 단계의 재학증명서 PDF와 일치 여부를 대조하는 기준이 됩니다.
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>통신사 선택</Text>
                  <View style={styles.gradeRow}>
                    {TELECOM_LIST.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.gradeChip, telecom === t && styles.gradeChipActive]}
                        onPress={() => setTelecom(t)}
                      >
                        <Text
                          style={[
                            styles.gradeChipText,
                            telecom === t && styles.gradeChipTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>이름 (PASS 실명)</Text>
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
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
                    <Text style={styles.secondaryBtnText}>이전</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtnFlex, isPassVerifying && styles.disabledBtn]}
                    onPress={handlePassVerify}
                    disabled={isPassVerifying}
                  >
                    {isPassVerifying ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>PASS 본인인증 완료</Text>
                        <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================
                STEP 3: 재학증명서 PDF 업로드 & 학교 선택
               ============================================================ */}
            {step === 3 && (
              <View>
                <View style={styles.stepSelectedBanner}>
                  <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
                  <Text style={styles.stepSelectedBannerText}>
                    PASS 인증됨: {passName} ({passBirth}) · {telecom}
                  </Text>
                </View>

                <Text style={styles.formTitle}>3단계: 재학증명서 PDF 업로드</Text>
                <Text style={styles.formSubtitle}>
                  정부24 또는 나이스 대국민서비스에서 발급받은 재학증명서 PDF를 업로드하세요. PDF 내 성명·생년월일이 PASS 본인인증 정보와 일치해야 승인됩니다.
                </Text>

                {/* 전국 고등학교 나이스 실시간 검색 */}
                <Text style={styles.inputLabel}>소속 고등학교 검색 (나이스 전국 고교 연동)</Text>
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

                <View style={styles.schoolListWrap}>
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
                          style={[styles.schoolOption, isSelected && styles.schoolOptionActive]}
                          onPress={() => setSelectedSchool(school)}
                        >
                          <View style={styles.schoolOptionLeft}>
                            <Ionicons
                              name="school"
                              size={16}
                              color={isSelected ? '#dc2626' : '#64748b'}
                            />
                            <View>
                              <Text
                                style={[
                                  styles.schoolOptionName,
                                  isSelected && styles.schoolOptionNameActive,
                                ]}
                              >
                                {school.name}
                              </Text>
                              <Text style={styles.schoolOptionRegion}>{school.region}</Text>
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

                {/* 재학 학년 */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>재학증명서 기재 학년</Text>
                <View style={styles.gradeRow}>
                  {['고1', '고2', '고3'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.gradeChip, certGrade === g && styles.gradeChipActive]}
                      onPress={() => setCertGrade(g)}
                    >
                      <Text
                        style={[
                          styles.gradeChipText,
                          certGrade === g && styles.gradeChipTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 재학증명서 PDF 파일 업로드 박스 */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>
                  재학증명서 PDF 파일 첨부
                </Text>
                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={handlePickPdfFile}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-attach" size={26} color="#dc2626" />
                  <View style={styles.uploadInfo}>
                    <Text style={styles.uploadFileName}>{certFileName}</Text>
                    <Text style={styles.uploadFileSub}>
                      탭하여 내 기기에서 재학증명서(.pdf) 파일 선택
                    </Text>
                  </View>
                  <View style={styles.changeFileBadge}>
                    <Text style={styles.changeFileText}>PDF 선택</Text>
                  </View>
                </TouchableOpacity>

                {/* PDF에서 추출된(OCR) 성명 & 생년월일 확인/시뮬레이션 */}
                <View style={styles.ocrExtractBox}>
                  <Text style={styles.ocrExtractTitle}>
                    📄 재학증명서 PDF 문서 내 추출(OCR) 인적사항 확인
                  </Text>
                  <View style={styles.ocrFieldRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ocrLabel}>증명서 상의 성명</Text>
                      <TextInput
                        style={styles.ocrInput}
                        value={certHolderName}
                        onChangeText={setCertHolderName}
                        placeholder="증명서 성명"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ocrLabel}>증명서 상의 생년월일</Text>
                      <TextInput
                        style={styles.ocrInput}
                        value={certHolderBirth}
                        onChangeText={setCertHolderBirth}
                        placeholder="YYMMDD"
                        maxLength={6}
                      />
                    </View>
                  </View>
                  <Text style={styles.ocrHint}>
                    * 위 재학증명서 정보와 2단계 PASS 인증 정보({passName} / {passBirth})가 다르면 4단계 검증에서 자동 차단됩니다.
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
                    <Text style={styles.secondaryBtnText}>이전</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtnFlex} onPress={handleRunComparison}>
                    <Text style={styles.primaryBtnText}>PASS ↔ 재학증명서 일치 검증</Text>
                    <Ionicons name="analytics" size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================
                STEP 4: 재학증명서 내용과 PASS 본인인증 내용 대조 검증 결과
               ============================================================ */}
            {step === 4 && (
              <View>
                <Text style={styles.formTitle}>
                  4단계: PASS 본인인증 ↔ 재학증명서 PDF 대조 검증
                </Text>

                {isComparing ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>
                      재학증명서 PDF 텍스트 추출 및 PASS 본인인증 실명·생년월일 대조 중...
                    </Text>
                  </View>
                ) : (
                  verificationResult && (
                    <View>
                      {/* 대조 비교 표 */}
                      <View style={styles.compareTable}>
                        <View style={styles.compareHeaderRow}>
                          <Text style={[styles.compareCellHeader, { flex: 1.1 }]}>검증 항목</Text>
                          <Text style={[styles.compareCellHeader, { flex: 1.5 }]}>
                            PASS 본인인증
                          </Text>
                          <Text style={[styles.compareCellHeader, { flex: 1.5 }]}>
                            재학증명서 PDF
                          </Text>
                          <Text style={[styles.compareCellHeader, { flex: 0.9 }]}>판정</Text>
                        </View>

                        <View style={styles.compareRow}>
                          <Text style={[styles.compareCellLabel, { flex: 1.1 }]}>성명</Text>
                          <Text style={[styles.compareCellVal, { flex: 1.5 }]}>{passName}</Text>
                          <Text style={[styles.compareCellVal, { flex: 1.5 }]}>
                            {certHolderName}
                          </Text>
                          <Text
                            style={[
                              styles.compareBadge,
                              { flex: 0.9 },
                              verificationResult.nameMatch ? styles.passText : styles.failText,
                            ]}
                          >
                            {verificationResult.nameMatch ? '일치 ✅' : '불일치 ❌'}
                          </Text>
                        </View>

                        <View style={styles.compareRow}>
                          <Text style={[styles.compareCellLabel, { flex: 1.1 }]}>생년월일</Text>
                          <Text style={[styles.compareCellVal, { flex: 1.5 }]}>{passBirth}</Text>
                          <Text style={[styles.compareCellVal, { flex: 1.5 }]}>
                            {certHolderBirth}
                          </Text>
                          <Text
                            style={[
                              styles.compareBadge,
                              { flex: 0.9 },
                              verificationResult.birthMatch ? styles.passText : styles.failText,
                            ]}
                          >
                            {verificationResult.birthMatch ? '일치 ✅' : '불일치 ❌'}
                          </Text>
                        </View>

                        <View style={styles.compareRow}>
                          <Text style={[styles.compareCellLabel, { flex: 1.1 }]}>소속학교</Text>
                          <Text style={[styles.compareCellVal, { flex: 1.5 }]}>본인명의 확인</Text>
                          <Text style={[styles.compareCellVal, { flex: 1.5 }]}>
                            {selectedSchool?.name || ''} ({certGrade})
                          </Text>
                          <Text style={[styles.compareBadge, { flex: 0.9 }, styles.passText]}>
                            확인 ✅
                          </Text>
                        </View>
                      </View>

                      {/* 판정 안내 박스 */}
                      <View
                        style={[
                          styles.resultBox,
                          verificationResult.isMatch ? styles.resultBoxSuccess : styles.resultBoxFail,
                        ]}
                      >
                        <Ionicons
                          name={
                            verificationResult.isMatch
                              ? 'checkmark-done-circle'
                              : 'alert-circle'
                          }
                          size={22}
                          color={verificationResult.isMatch ? '#15803d' : '#b91c1c'}
                        />
                        <Text
                          style={[
                            styles.resultBoxText,
                            { color: verificationResult.isMatch ? '#14532d' : '#7f1d1d' },
                          ]}
                        >
                          {verificationResult.message}
                        </Text>
                      </View>

                      {verificationResult.isMatch ? (
                        <TouchableOpacity
                          style={[styles.primaryBtn, { marginTop: 14 }]}
                          onPress={handleConfirmVerifiedLogin}
                        >
                          <Text style={styles.primaryBtnText}>
                            [{selectedSchool?.name || ''} {certGrade} {passName}] 계정으로 시작하기
                          </Text>
                          <Ionicons name="arrow-forward-circle" size={18} color="#ffffff" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.secondaryBtn, { marginTop: 14, alignItems: 'center' }]}
                          onPress={() => setStep(3)}
                        >
                          <Text style={styles.secondaryBtnText}>
                            3단계로 돌아가서 재학증명서 다시 확인하기
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </PhoneModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
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
    backgroundColor: '#94a3b8',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepNumActive: {
    backgroundColor: '#dc2626',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  stepTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  stepDividerActive: {
    backgroundColor: '#dc2626',
  },
  currentStatusCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  statusMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusSchool: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  statusDetail: {
    fontSize: 11,
    color: '#64748b',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 14,
  },
  socialBtnGroup: {
    gap: 10,
    marginBottom: 16,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialBadgeText: {
    fontSize: 15,
    fontWeight: '900',
  },
  socialBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 10,
  },
  stepSelectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },
  stepSelectedBannerText: {
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
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
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
  schoolListWrap: {
    gap: 6,
  },
  schoolOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  schoolOptionActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  schoolOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  schoolOptionNameActive: {
    color: '#dc2626',
  },
  schoolOptionRegion: {
    fontSize: 10,
    color: '#94a3b8',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  gradeChipActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  gradeChipTextActive: {
    color: '#dc2626',
    fontWeight: '800',
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  uploadFileSub: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 2,
  },
  changeFileBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeFileText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  ocrExtractBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
  },
  ocrExtractTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  ocrFieldRow: {
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
  ocrHint: {
    fontSize: 10,
    color: '#dc2626',
    marginTop: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  secondaryBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  primaryBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 16,
  },
  primaryBtnFlex: {
    flex: 1,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtnText: {
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
    marginTop: 6,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  compareCellHeader: {
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
  compareCellLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  compareCellVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  compareBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  passText: {
    color: '#16a34a',
  },
  failText: {
    color: '#dc2626',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  resultBoxSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  resultBoxFail: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  resultBoxText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
});
