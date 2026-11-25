// =============================================================================
// 📅 HighTime (고교타임) - 사용자 직접 작성 주간 시간표 모달 (에브리타임 다크 그리드 스타일)
// - 상단: 학기 표시 + [+] 수업 직접 추가 버튼
// - 본문: 월~금 요일 × 9시~17시(5시) 시간표 그리드 & 컬러 블록 렌더링
// - 빈 칸 탭 또는 [+] 버튼 클릭 시: 요일 · 시작~종료 시간 · 과목명 · 강의실 · 색상 선택하여 추가
// - 기존 수업 블록 탭 시: 수정 또는 삭제 지원
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhoneModal } from '../components/PhoneModal';
import { CustomTimetableBlock, WeekdayKey } from '../types';
import { COLORS } from '../theme/colors';

interface TimetableModalProps {
  visible: boolean;
  blocks: CustomTimetableBlock[];
  onClose: () => void;
  onAddOrUpdateBlock: (block: CustomTimetableBlock) => void;
  onDeleteBlock: (blockId: string) => void;
}

const DAYS: WeekdayKey[] = ['월', '화', '수', '목', '금'];

// 1교시 ~ 7교시 일과표 (1~4교시 09:00~12:50, 점심 12:50~13:40, 5~7교시 13:40~16:30)
export interface PeriodScheduleItem {
  hourKey: number;
  period: number;
  label: string;
  timeRange: string;
  startMin: number;
  endMin: number;
}

export const HIGH_SCHOOL_PERIODS: PeriodScheduleItem[] = [
  { hourKey: 9, period: 1, label: '1교시', timeRange: '09:00 ~ 09:50', startMin: 9 * 60, endMin: 9 * 60 + 50 },
  { hourKey: 10, period: 2, label: '2교시', timeRange: '10:00 ~ 10:50', startMin: 10 * 60, endMin: 10 * 60 + 50 },
  { hourKey: 11, period: 3, label: '3교시', timeRange: '11:00 ~ 11:50', startMin: 11 * 60, endMin: 11 * 60 + 50 },
  { hourKey: 12, period: 4, label: '4교시', timeRange: '12:00 ~ 12:50', startMin: 12 * 60, endMin: 12 * 60 + 50 },
  { hourKey: 13, period: 5, label: '5교시', timeRange: '13:40 ~ 14:30', startMin: 13 * 60 + 40, endMin: 14 * 60 + 30 },
  { hourKey: 14, period: 6, label: '6교시', timeRange: '14:40 ~ 15:30', startMin: 14 * 60 + 40, endMin: 15 * 60 + 30 },
  { hourKey: 15, period: 7, label: '7교시', timeRange: '15:40 ~ 16:30', startMin: 15 * 60 + 40, endMin: 16 * 60 + 30 },
];

export function getPeriodSchedule(hourKey: number): PeriodScheduleItem {
  return (
    HIGH_SCHOOL_PERIODS.find((p) => p.hourKey === hourKey) || {
      hourKey,
      period: Math.max(1, hourKey - 8),
      label: `${Math.max(1, hourKey - 8)}교시`,
      timeRange: `${String(hourKey).padStart(2, '0')}:00 ~ ${String(hourKey).padStart(2, '0')}:50`,
      startMin: hourKey * 60,
      endMin: hourKey * 60 + 50,
    }
  );
}

const HOURS: number[] = HIGH_SCHOOL_PERIODS.map((p) => p.hourKey);

// 에브리타임 감성 파스텔/비비드 블록 컬러 팔레트
const BLOCK_COLORS: string[] = [
  '#a3c96c', // 연두 (인본적사고 스타일)
  '#8b78cd', // 보라 (미적분학II 스타일)
  '#63b0a3', // 민트 (기초확률 스타일)
  '#d27365', // 코랄레드 (인간발달 스타일)
  '#6c8cc7', // 스카이블루 (영어프레젠테이션 스타일)
  '#61a877', // 그린 (기초프로그래밍 스타일)
  '#cca958', // 머스타드 옐로우 (ICT융합개론 스타일)
  '#d88c51', // 오렌지 브라운 (정보이론 스타일)
];

const ROW_HEIGHT = 54; // 1시간당 그리드 높이(px)

export function formatHourLabel(hour24: number): string {
  return getPeriodSchedule(hour24).label;
}

// 교시 및 실제 수업 시간 포맷 (예: 1교시 · 08:40 ~ 09:30)
export function formatTimeRange(startHour: number, _endHour: number): string {
  const sched = getPeriodSchedule(startHour);
  return `${sched.label} · ${sched.timeRange}`;
}

export const TimetableModal: React.FC<TimetableModalProps> = ({
  visible,
  blocks,
  onClose,
  onAddOrUpdateBlock,
  onDeleteBlock,
}) => {
  // 수업 추가/수정 폼 모달 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<WeekdayKey>('월');
  const [startHour, setStartHour] = useState<number>(9);
  const [endHour, setEndHour] = useState<number>(10);
  const [subject, setSubject] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [color, setColor] = useState<string>(BLOCK_COLORS[0]);

  // 빈 셀이나 [+] 버튼을 눌러 새 수업 추가 창 열기
  const handleOpenNewForm = (defaultDay: WeekdayKey = '월', defaultStart = 9) => {
    setEditingId(null);
    setSelectedDay(defaultDay);
    setStartHour(defaultStart);
    setEndHour(Math.min(defaultStart + 1, 20));
    setSubject('');
    setRoom('');
    setColor(BLOCK_COLORS[blocks.length % BLOCK_COLORS.length]);
    setIsFormOpen(true);
  };

  // 기존 수업 블록을 눌러 수정/삭제 창 열기
  const handlePressBlock = (block: CustomTimetableBlock) => {
    setEditingId(block.id);
    setSelectedDay(block.day);
    setStartHour(block.startHour);
    setEndHour(block.endHour);
    setSubject(block.subject);
    setRoom(block.room);
    setColor(block.color);
    setIsFormOpen(true);
  };

  // 저장 핸들러 (시간 겹침 체크 포함)
  const handleSaveClass = () => {
    if (!subject.trim()) {
      Alert.alert('과목명 입력', '추가할 수업(과목) 이름을 입력해주세요.');
      return;
    }
    if (endHour <= startHour) {
      Alert.alert('시간 확인', '종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }

    // 같은 요일에 시간이 겹치는 다른 과목이 있는지 확인
    const conflict = blocks.find(
      (b) =>
        b.id !== editingId &&
        b.day === selectedDay &&
        !(endHour <= b.startHour || startHour >= b.endHour)
    );
    if (conflict) {
      Alert.alert(
        '시간 중복',
        `${selectedDay}요일 해당 시간대에 이미 [${conflict.subject}] 수업이 있습니다.`
      );
      return;
    }

    onAddOrUpdateBlock({
      id: editingId || `tt-${Date.now()}`,
      day: selectedDay,
      subject: subject.trim(),
      room: room.trim(),
      startHour,
      endHour,
      color,
    });

    setIsFormOpen(false);
  };

  // 삭제 핸들러
  const handleDeleteCurrent = () => {
    if (!editingId) return;
    onDeleteBlock(editingId);
    setIsFormOpen(false);
  };

  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(380);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        slideAnim.setValue(0);
      });
    } else {
      slideAnim.setValue(380);
    }
  }, [visible]);

  return (
    <PhoneModal visible={visible} animationType="none" transparent>
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
      <SafeAreaView style={styles.safeArea}>
        {/* 상단 화이트 헤더 */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.semesterText}>2026년 2학기</Text>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>시간표</Text>
              <Ionicons name="chevron-down" size={18} color="#0f172a" />
            </View>
          </View>

          <View style={styles.headerIcons}>
            {/* [+] 수업 추가 버튼 */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => handleOpenNewForm('월', 9)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={26} color="#0f172a" />
            </TouchableOpacity>

            {/* 닫기 버튼 */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.helperSubText}>
          💡 우측 상단 [+] 버튼을 누르거나 시간표의 빈 칸을 직접 터치해서 수업을 추가하세요.
        </Text>

        {/* 주간 시간표 그리드 (월~금 × 9시~7시) */}
        <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.gridWrapper}>
            {/* 요일 헤더 행 */}
            <View style={styles.dayHeaderRow}>
              <View style={styles.timeAxisHeaderCell} />
              {DAYS.map((day) => (
                <View key={day} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* 시간 그리드 본문 */}
            <View style={styles.gridBody}>
              {/* 좌측 시간 축 (9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7) */}
              <View style={styles.timeAxisColumn}>
                {HOURS.map((h) => (
                  <View key={h} style={[styles.timeAxisCell, { height: ROW_HEIGHT }]}>
                    <Text style={styles.timeAxisText}>{formatHourLabel(h)}</Text>
                  </View>
                ))}
              </View>

              {/* 요일별 컬럼 5개 */}
              {DAYS.map((day) => {
                const dayBlocks = blocks.filter((b) => b.day === day);

                return (
                  <View key={day} style={styles.dayColumn}>
                    {/* 배경 빈 슬롯 (터치하면 해당 요일·시간으로 추가 모달 오픈) */}
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.emptyGridCell, { height: ROW_HEIGHT }]}
                        activeOpacity={0.5}
                        onPress={() => handleOpenNewForm(day, h)}
                      />
                    ))}

                    {/* 등록된 과목 컬러 블록 오버레이 */}
                    {dayBlocks.map((block) => {
                      const topOffset = (block.startHour - 9) * ROW_HEIGHT;
                      const blockHeight = (block.endHour - block.startHour) * ROW_HEIGHT;

                      return (
                        <TouchableOpacity
                          key={block.id}
                          activeOpacity={0.85}
                          onPress={() => handlePressBlock(block)}
                          style={[
                            styles.classBlock,
                            {
                              top: topOffset,
                              height: blockHeight,
                              backgroundColor: block.color,
                            },
                          ]}
                        >
                          <Text style={styles.classBlockTitle} numberOfLines={3}>
                            {block.subject}
                          </Text>
                          {Boolean(block.room) && (
                            <Text style={styles.classBlockRoom} numberOfLines={1}>
                              {block.room}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* 수업 추가 / 수정 바텀시트 모달 */}
        <PhoneModal visible={isFormOpen} animationType="fade" transparent>
          <View style={styles.formOverlay}>
            <View style={styles.formSheet}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {editingId ? '수업 수정 / 삭제' : '새 수업 직접 추가'}
                </Text>
                <TouchableOpacity onPress={() => setIsFormOpen(false)}>
                  <Ionicons name="close" size={22} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              {/* 1. 과목명 입력 */}
              <Text style={styles.inputLabel}>과목명 (수업 이름)</Text>
              <TextInput
                style={styles.textInput}
                value={subject}
                onChangeText={setSubject}
                placeholder="예: 미적분학, 물리학, 화법과 작문"
                placeholderTextColor="#71717a"
              />

              {/* 2. 교실 위치 입력 */}
              <Text style={styles.inputLabel}>교실 위치 (선택)</Text>
              <TextInput
                style={styles.textInput}
                value={room}
                onChangeText={setRoom}
                placeholder="예: 2반, 3반"
                placeholderTextColor="#71717a"
              />

              {/* 3. 요일 선택 */}
              <Text style={styles.inputLabel}>요일 선택</Text>
              <View style={styles.daySelectRow}>
                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.daySelectChip,
                      selectedDay === d && styles.daySelectChipActive,
                    ]}
                    onPress={() => setSelectedDay(d)}
                  >
                    <Text
                      style={[
                        styles.daySelectChipText,
                        selectedDay === d && styles.daySelectChipTextActive,
                      ]}
                    >
                      {d}요일
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 4. 교시 선택 */}
              <Text style={styles.inputLabel}>
                교시 선택 ({formatTimeRange(startHour, endHour)})
              </Text>
              <View style={styles.timeSelectContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timeSubLabel}>
                    수업 교시를 선택하세요 (1교시 ~ 7교시)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.hourChipScroll}
                  >
                    {HOURS.map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[
                          styles.hourChip,
                          startHour === h && styles.hourChipActive,
                        ]}
                        onPress={() => {
                          setStartHour(h);
                          setEndHour(h + 1);
                        }}
                      >
                        <Text
                          style={[
                            styles.hourChipText,
                            startHour === h && styles.hourChipTextActive,
                          ]}
                        >
                          {h - 8}교시
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* 5. 블록 색상 선택 */}
              <Text style={styles.inputLabel}>시간표 블록 색상</Text>
              <View style={styles.colorRow}>
                {BLOCK_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: c },
                      color === c && styles.colorCircleSelected,
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {color === c && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* 하단 저장 / 삭제 버튼 */}
              <View style={styles.formActionRow}>
                {editingId && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteCurrent}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.deleteBtnText}>삭제</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveClass}>
                  <Text style={styles.saveBtnText}>
                    {editingId ? '수업 변경사항 저장' : '시간표에 추가하기'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </PhoneModal>
      </SafeAreaView>
      </Animated.View>
    </PhoneModal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: COLORS.bg,
  },
  semesterText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.44,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  helperSubText: {
    fontSize: 11,
    color: COLORS.muted,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  gridScroll: {
    flex: 1,
    paddingHorizontal: 14,
  },
  gridWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 28,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.sageCard,
    height: 34,
    alignItems: 'center',
  },
  timeAxisHeaderCell: {
    width: 44,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    height: '100%',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  gridBody: {
    flexDirection: 'row',
  },
  timeAxisColumn: {
    width: 44,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.sageCard,
  },
  timeAxisCell: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 4,
    paddingRight: 5,
    alignItems: 'flex-end',
  },
  timeAxisText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: '600',
  },
  dayColumn: {
    flex: 1,
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  emptyGridCell: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  classBlock: {
    position: 'absolute',
    left: 1,
    right: 1,
    padding: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  classBlockTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 14,
  },
  classBlockRoom: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 39, 34, 0.45)',
    justifyContent: 'flex-end',
  },
  formSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 28,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13.5,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daySelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  daySelectChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.sageCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daySelectChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  daySelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  daySelectChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  timeSelectContainer: {
    flexDirection: 'row',
  },
  timeSubLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 6,
  },
  hourChipScroll: {
    flexDirection: 'row',
  },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.sageCard,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hourChipActive: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink,
  },
  hourChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  hourChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2.5,
    borderColor: COLORS.ink,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.ink,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
