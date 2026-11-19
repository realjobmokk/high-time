// =============================================================================
// 📅 HighTime (고교타임) - 학사일정 달력 보기 & 개인 일정 추가 모달
// - 나이스(NEIS) SchoolSchedule API에서 선택한 월의 학사일정을 실시간 조회
// - 사용자가 선택한 날짜에 개인 일정을 직접 추가/삭제할 수 있도록 지원
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CurrentUser, School } from '../types';
import { PhoneModal } from '../components/PhoneModal';
import { fetchNeisMonthSchedule, MonthlyScheduleItem } from '../services/neisService';

type EventCategory = '수행평가' | '시험' | '동아리' | '개인';

const CATEGORY_OPTIONS: { label: EventCategory; color: string; bg: string }[] = [
  { label: '개인', color: '#15803d', bg: '#dcfce7' },
  { label: '수행평가', color: '#dc2626', bg: '#fee2e2' },
  { label: '시험', color: '#7c3aed', bg: '#ede9fe' },
  { label: '동아리', color: '#2563eb', bg: '#dbeafe' },
];

interface CustomCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  day: number;
  title: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  category?: EventCategory;
  location?: string;
  memo?: string;
}

interface ScheduleCalendarModalProps {
  visible: boolean;
  currentUser: CurrentUser;
  currentSchool: School;
  onClose: () => void;
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const ScheduleCalendarModal: React.FC<ScheduleCalendarModalProps> = ({
  visible,
  currentUser,
  currentSchool,
  onClose,
}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1~12
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());
  const [items, setItems] = useState<MonthlyScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 개인 추가 일정 상태 & 날짜별 바텀 시트 / 세부 설정 폼 상태
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>([]);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [category, setCategory] = useState<EventCategory>('개인');
  const [location, setLocation] = useState('');
  const [memo, setMemo] = useState('');
  const sheetAnim = useRef(new Animated.Value(360)).current;

  useEffect(() => {
    if (!visible) {
      setIsDaySheetOpen(false);
      setIsEventFormOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    if (isDaySheetOpen) {
      sheetAnim.setValue(360);
      Animated.timing(sheetAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [isDaySheetOpen, selectedDay]);

  const storageKey = `hightime_custom_calendar_events_${encodeURIComponent(
    currentUser.username || `${currentSchool.name}_${currentUser.name}`
  )}`;

  // 저장된 개인 일정 불러오기
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        setCustomEvents(raw ? JSON.parse(raw) : []);
      }
    } catch {
      setCustomEvents([]);
    }
  }, [storageKey, visible]);

  const saveCustomEvents = (next: CustomCalendarEvent[]) => {
    setCustomEvents(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
    } catch {}
  };

  useEffect(() => {
    if (!visible || !currentSchool.name) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const data = await fetchNeisMonthSchedule(currentSchool, viewYear, viewMonth);
      if (!cancelled) {
        setItems(data);
        setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [visible, currentSchool, viewYear, viewMonth]);

  const handlePrevMonth = () => {
    setSelectedDay(1);
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(1);
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedDateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(
    selectedDay
  ).padStart(2, '0')}`;

  // 선택한 날짜에 세부 일정 추가
  const handleAddCustomEvent = () => {
    const trimmed = newEventTitle.trim();
    if (!trimmed) return;

    const newItem: CustomCalendarEvent = {
      id: `ce-${Date.now()}`,
      date: selectedDateStr,
      day: selectedDay,
      title: trimmed,
      isAllDay,
      startTime: isAllDay ? undefined : startTime.trim() || '16:00',
      endTime: isAllDay ? undefined : endTime.trim() || '17:00',
      category,
      location: location.trim() || undefined,
      memo: memo.trim() || undefined,
    };
    saveCustomEvents([...customEvents, newItem]);
    setNewEventTitle('');
    setIsAllDay(true);
    setStartTime('16:00');
    setEndTime('17:00');
    setCategory('개인');
    setLocation('');
    setMemo('');
    setIsEventFormOpen(false);
  };

  const handleOpenDaySheet = (day: number) => {
    setSelectedDay(day);
    setIsEventFormOpen(false);
    setIsDaySheetOpen(true);
  };

  // 개인 일정 삭제
  const handleDeleteCustomEvent = (id: string) => {
    saveCustomEvents(customEvents.filter((ev) => ev.id !== id));
  };

  // 해당 월 1일의 요일(0=일..6=토) 및 총 일수 계산
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}-`;
  const monthCustomEvents = customEvents.filter((ev) => ev.date.startsWith(monthPrefix));

  const selectedNeisItems = items.filter((item) => item.day === selectedDay);
  const selectedCustomItems = monthCustomEvents.filter((ev) => ev.day === selectedDay);

  const isToday = (day: number) =>
    viewYear === now.getFullYear() &&
    viewMonth === now.getMonth() + 1 &&
    day === now.getDate();

  return (
    <PhoneModal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 상단 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="calendar" size={18} color="#dc2626" />
              <Text style={styles.headerTitle} numberOfLines={1}>
                {currentSchool.name} 학사일정 달력
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 연·월 이동 바 */}
            <View style={styles.monthBar}>
              <TouchableOpacity style={styles.monthArrowBtn} onPress={handlePrevMonth}>
                <Ionicons name="chevron-back" size={18} color="#334155" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {viewYear}년 {viewMonth}월
              </Text>
              <TouchableOpacity style={styles.monthArrowBtn} onPress={handleNextMonth}>
                <Ionicons name="chevron-forward" size={18} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* 요일 헤더 */}
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((w, idx) => (
                <Text
                  key={w}
                  style={[
                    styles.weekCell,
                    idx === 0 && { color: '#dc2626' },
                    idx === 6 && { color: '#2563eb' },
                  ]}
                >
                  {w}
                </Text>
              ))}
            </View>

            {/* 달력 그리드 */}
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#dc2626" />
                <Text style={styles.loadingText}>나이스 학사일정 불러오는 중...</Text>
              </View>
            ) : (
              <View style={styles.gridWrap}>
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }
                  const neisDayEvents = items.filter((it) => it.day === day);
                  const customDayEvents = monthCustomEvents.filter((ev) => ev.day === day);
                  const hasEvents = neisDayEvents.length > 0 || customDayEvents.length > 0;
                  const hasHoliday = neisDayEvents.some((it) => it.isHoliday);
                  const isSelected = selectedDay === day;
                  const todayFlag = isToday(day);
                  const colIdx = idx % 7;
                  const firstTitle =
                    neisDayEvents[0]?.title || customDayEvents[0]?.title || '';

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.dayCell,
                        todayFlag && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => handleOpenDaySheet(day)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.dayNum,
                          colIdx === 0 && { color: '#dc2626' },
                          colIdx === 6 && { color: '#2563eb' },
                          hasHoliday && colIdx !== 6 && { color: '#dc2626' },
                          isSelected && { color: '#ffffff', fontWeight: '900' },
                        ]}
                      >
                        {day}
                      </Text>
                      {hasEvents && (
                        <View style={styles.eventDotRow}>
                          {neisDayEvents.length > 0 && (
                            <View
                              style={[
                                styles.eventDot,
                                {
                                  backgroundColor: isSelected
                                    ? '#ffffff'
                                    : hasHoliday
                                    ? '#dc2626'
                                    : '#4f46e5',
                                },
                              ]}
                            />
                          )}
                          {customDayEvents.length > 0 && (
                            <View
                              style={[
                                styles.eventDot,
                                {
                                  backgroundColor: isSelected ? '#fde047' : '#16a34a',
                                },
                              ]}
                            />
                          )}
                        </View>
                      )}
                      {hasEvents && (
                        <Text
                          style={[
                            styles.dayEventMini,
                            isSelected && { color: '#fee2e2' },
                          ]}
                          numberOfLines={1}
                        >
                          {firstTitle}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 이번 달 전체 학사일정 요약 목록 */}
            <View style={styles.monthListBox}>
              <Text style={styles.detailTitle}>
                🗓️ {viewMonth}월 전체 일정 ({items.length + monthCustomEvents.length}건)
              </Text>
              {items.length === 0 && monthCustomEvents.length === 0 ? (
                <Text style={styles.emptyDetailText}>이번 달 등록된 일정이 없습니다.</Text>
              ) : (
                <>
                  {items.map((ev, i) => (
                    <TouchableOpacity
                      key={`all-${ev.date}-${i}`}
                      style={styles.monthListItem}
                      onPress={() => handleOpenDaySheet(ev.day)}
                    >
                      <Text style={styles.monthListDate}>{ev.date.slice(5)}</Text>
                      <Text style={styles.monthListTitle} numberOfLines={1}>
                        {ev.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {monthCustomEvents.map((ev) => (
                    <TouchableOpacity
                      key={`all-c-${ev.id}`}
                      style={styles.monthListItem}
                      onPress={() => handleOpenDaySheet(ev.day)}
                    >
                      <Text style={[styles.monthListDate, { color: '#16a34a' }]}>
                        {ev.date.slice(5)}
                      </Text>
                      <Text style={styles.monthListTitle} numberOfLines={1}>
                        {ev.title} ({ev.category || '내 일정'})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          </ScrollView>

          {/* 날짜 클릭 시 아래에서 올라오는 일정 나열 & 세부 일정 추가 바텀 시트 */}
          {isDaySheetOpen && (
            <View style={styles.sheetBackdrop}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => {
                  setIsDaySheetOpen(false);
                  setIsEventFormOpen(false);
                }}
              />
              <Animated.View
                style={[styles.bottomSheet, { transform: [{ translateY: sheetAnim }] }]}
              >
                <View style={styles.sheetHandle} />

                {/* 시트 상단 헤더: 날짜 + 오른쪽 위 '+' 및 닫기 버튼 */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>
                    {isEventFormOpen
                      ? `${viewMonth}월 ${selectedDay}일 세부 일정 설정`
                      : `📌 ${selectedDateStr} 일정`}
                  </Text>
                  <View style={styles.sheetHeaderActions}>
                    {!isEventFormOpen && (
                      <TouchableOpacity
                        style={styles.sheetPlusBtn}
                        onPress={() => setIsEventFormOpen(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add" size={20} color="#ffffff" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.sheetCloseBtn}
                      onPress={() => {
                        if (isEventFormOpen) {
                          setIsEventFormOpen(false);
                        } else {
                          setIsDaySheetOpen(false);
                        }
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={isEventFormOpen ? 'arrow-back' : 'close'}
                        size={18}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {isEventFormOpen ? (
                  /* 세부 일정 설정 폼 */
                  <ScrollView
                    style={styles.sheetScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    <Text style={styles.formLabel}>일정 제목 *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={newEventTitle}
                      onChangeText={setNewEventTitle}
                      placeholder="예: 생명과학 수행평가 발표"
                      placeholderTextColor="#94a3b8"
                    />

                    <Text style={styles.formLabel}>카테고리</Text>
                    <View style={styles.catRow}>
                      {CATEGORY_OPTIONS.map((opt) => {
                        const active = category === opt.label;
                        return (
                          <TouchableOpacity
                            key={opt.label}
                            style={[
                              styles.catChip,
                              active && { backgroundColor: opt.bg, borderColor: opt.color },
                            ]}
                            onPress={() => setCategory(opt.label)}
                          >
                            <Text
                              style={[
                                styles.catChipText,
                                active && { color: opt.color, fontWeight: '800' },
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.allDayRow}>
                      <Text style={styles.formLabel}>시간 설정</Text>
                      <TouchableOpacity
                        style={[styles.allDayToggle, isAllDay && styles.allDayToggleActive]}
                        onPress={() => setIsAllDay(!isAllDay)}
                      >
                        <Text
                          style={[
                            styles.allDayToggleText,
                            isAllDay && { color: '#dc2626' },
                          ]}
                        >
                          {isAllDay ? '종일 ✓' : '시간 직접 입력'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {!isAllDay && (
                      <View style={styles.timeRow}>
                        <TextInput
                          style={[styles.formInput, { flex: 1, textAlign: 'center' }]}
                          value={startTime}
                          onChangeText={setStartTime}
                          placeholder="16:00"
                          placeholderTextColor="#94a3b8"
                        />
                        <Text style={styles.timeDash}>~</Text>
                        <TextInput
                          style={[styles.formInput, { flex: 1, textAlign: 'center' }]}
                          value={endTime}
                          onChangeText={setEndTime}
                          placeholder="17:00"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    )}

                    <Text style={styles.formLabel}>장소 (선택)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="예: 3층 과학실, 스터디카페"
                      placeholderTextColor="#94a3b8"
                    />

                    <Text style={styles.formLabel}>메모 (선택)</Text>
                    <TextInput
                      style={[styles.formInput, { minHeight: 62, textAlignVertical: 'top' }]}
                      value={memo}
                      onChangeText={setMemo}
                      placeholder="준비물이나 세부 내용을 적어두세요"
                      placeholderTextColor="#94a3b8"
                      multiline
                    />

                    <View style={styles.formBtnRow}>
                      <TouchableOpacity
                        style={styles.cancelFormBtn}
                        onPress={() => setIsEventFormOpen(false)}
                      >
                        <Text style={styles.cancelFormBtnText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.saveFormBtn,
                          !newEventTitle.trim() && { opacity: 0.45 },
                        ]}
                        onPress={handleAddCustomEvent}
                        disabled={!newEventTitle.trim()}
                      >
                        <Text style={styles.saveFormBtnText}>일정 저장하기</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                ) : (
                  /* 선택한 날짜 일정 나열 */
                  <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
                    {selectedNeisItems.length === 0 && selectedCustomItems.length === 0 ? (
                      <View style={styles.sheetEmptyBox}>
                        <Ionicons name="calendar-clear-outline" size={30} color="#cbd5e1" />
                        <Text style={styles.emptyDetailText}>
                          등록된 일정이 없습니다. 오른쪽 위 +를 눌러 추가해 보세요!
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 8, paddingBottom: 12 }}>
                        {selectedNeisItems.map((ev, i) => (
                          <View key={`${ev.date}-${i}`} style={styles.sheetEventCard}>
                            <View
                              style={[
                                styles.sheetEventBar,
                                { backgroundColor: ev.isHoliday ? '#dc2626' : '#4f46e5' },
                              ]}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.detailItemText}>{ev.title}</Text>
                              <Text style={styles.sheetEventMeta}>학교 공식 학사일정 · 종일</Text>
                            </View>
                            <View style={styles.neisTag}>
                              <Text style={styles.neisTagText}>
                                {ev.isHoliday ? '휴업/공휴' : '학교일정'}
                              </Text>
                            </View>
                          </View>
                        ))}

                        {selectedCustomItems.map((ev) => {
                          const catInfo =
                            CATEGORY_OPTIONS.find((c) => c.label === ev.category) ||
                            CATEGORY_OPTIONS[0];
                          const timeLabel = ev.isAllDay === false && ev.startTime
                            ? `${ev.startTime}${ev.endTime ? ` ~ ${ev.endTime}` : ''}`
                            : '종일';
                          return (
                            <View key={ev.id} style={styles.sheetEventCard}>
                              <View
                                style={[
                                  styles.sheetEventBar,
                                  { backgroundColor: catInfo.color },
                                ]}
                              />
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.detailItemText}>{ev.title}</Text>
                                </View>
                                <Text style={styles.sheetEventMeta}>
                                  {timeLabel}
                                  {ev.location ? ` · 📍 ${ev.location}` : ''}
                                </Text>
                                {ev.memo ? (
                                  <Text style={styles.sheetEventMemo}>{ev.memo}</Text>
                                ) : null}
                              </View>
                              <View style={[styles.customTag, { backgroundColor: catInfo.bg }]}>
                                <Text style={[styles.customTagText, { color: catInfo.color }]}>
                                  {catInfo.label}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleDeleteCustomEvent(ev.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="trash-outline" size={16} color="#dc2626" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </ScrollView>
                )}
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </PhoneModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    paddingBottom: 20,
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    flex: 1,
  },
  body: {
    paddingHorizontal: 14,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  monthArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  weekRow: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  weekCell: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 6,
  },
  dayCell: {
    width: '14.285%',
    minHeight: 50,
    alignItems: 'center',
    paddingTop: 5,
    paddingHorizontal: 2,
    borderRadius: 10,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  dayCellSelected: {
    backgroundColor: '#dc2626',
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  eventDotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayEventMini: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
    textAlign: 'center',
  },
  detailBox: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#dc2626',
    paddingHorizontal: 11,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyDetailText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  detailDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  detailItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  neisTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  neisTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  customTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  monthListBox: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  monthListDate: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    width: 42,
  },
  monthListTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 18,
    maxHeight: '72%',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  sheetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetPlusBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    marginTop: 10,
  },
  sheetEmptyBox: {
    paddingVertical: 26,
    alignItems: 'center',
    gap: 8,
  },
  sheetEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sheetEventBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  sheetEventMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sheetEventMemo: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  catRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  allDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  allDayToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  allDayToggleActive: {
    backgroundColor: '#fee2e2',
  },
  allDayToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timeDash: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 8,
  },
  cancelFormBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelFormBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  saveFormBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  saveFormBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
});
