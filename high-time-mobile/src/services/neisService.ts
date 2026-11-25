// 교육부 나이스(NEIS) 교육정보 개방 포털 공식 오픈 API 연동 서비스 (모바일 TypeScript 버전)
// 공식 포털: https://open.neis.go.kr
import { MealInfo, MealMenuItem, SingleMealData, DDayItem, School } from '../types';

/**
 * [사용자 발급 나이스(NEIS) 오픈 API 정식 인증키]
 */
export const NEIS_API_KEY: string =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NEIS_API_KEY) ||
  '40ccaac1f9854b3e9718425d74002ef3';

// 런타임 중 나이스(NEIS) 검색 API를 통해 조회된 학교 코드 동적 캐시 (하드코딩 제거)
const runtimeSchoolCache: Record<
  string,
  { name: string; officeCode: string; schoolCode: string }
> = {};

// 고등학교 교시별 표준 수업 시간표 (시작~종료 시각 및 분 단위 변환)
export const PERIOD_TIME_SLOTS: Record<
  number,
  { start: string; end: string; startMin: number; endMin: number }
> = {
  1: { start: '09:00', end: '09:50', startMin: 9 * 60, endMin: 9 * 60 + 50 },
  2: { start: '10:00', end: '10:50', startMin: 10 * 60, endMin: 10 * 60 + 50 },
  3: { start: '11:00', end: '11:50', startMin: 11 * 60, endMin: 11 * 60 + 50 },
  4: { start: '12:00', end: '12:50', startMin: 12 * 60, endMin: 12 * 60 + 50 },
  // 12:50 ~ 13:40 점심시간
  5: { start: '13:40', end: '14:30', startMin: 13 * 60 + 40, endMin: 14 * 60 + 30 },
  6: { start: '14:40', end: '15:30', startMin: 14 * 60 + 40, endMin: 15 * 60 + 30 },
  7: { start: '15:40', end: '16:30', startMin: 15 * 60 + 40, endMin: 16 * 60 + 30 },
  8: { start: '16:40', end: '17:30', startMin: 16 * 60 + 40, endMin: 17 * 60 + 30 },
};

export interface TimetablePeriodItem {
  period: number;
  subject: string;
  startTime: string;
  endTime: string;
}

export interface RealtimeClassStatus {
  currentTimeStr: string;
  statusType: 'in_class' | 'break' | 'lunch' | 'before_school' | 'after_school';
  activePeriod: number | null;
  currentSubject: string | null;
  badgeLabel: string;
  bannerText: string;
}

/**
 * 현재 시각(Date)과 오늘의 교시별 시간표 목록을 비교하여
 * 현재 어떤 과목을 수강 중인지(또는 다음 과목/종료 상태인지) 계산하는 함수
 */
export function getRealtimeClassStatus(
  periods: TimetablePeriodItem[],
  now: Date = new Date()
): RealtimeClassStatus {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMin = hours * 60 + minutes;
  const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  if (!periods || periods.length === 0) {
    return {
      currentTimeStr,
      statusType: 'after_school',
      activePeriod: null,
      currentSubject: null,
      badgeLabel: '시간표 수신중',
      bannerText: `현재 ${currentTimeStr} · 시간표 정보를 불러오는 중입니다`,
    };
  }

  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];
  const firstSlot = PERIOD_TIME_SLOTS[firstPeriod.period] || PERIOD_TIME_SLOTS[1];
  const lastSlot =
    PERIOD_TIME_SLOTS[lastPeriod.period] || PERIOD_TIME_SLOTS[periods.length] || PERIOD_TIME_SLOTS[7];

  // 1) 등교 및 1교시 시작 전 (~08:40)
  if (currentMin < firstSlot.startMin) {
    return {
      currentTimeStr,
      statusType: 'before_school',
      activePeriod: firstPeriod.period,
      currentSubject: firstPeriod.subject,
      badgeLabel: '1교시 예정',
      bannerText: `현재 ${currentTimeStr} (등교/조례) · 1교시 [${firstPeriod.subject}] 예정`,
    };
  }

  // 2) 정규 수업 종료 후 (마지막 교시 종료 시각 이후)
  if (currentMin > lastSlot.endMin) {
    return {
      currentTimeStr,
      statusType: 'after_school',
      activePeriod: lastPeriod.period,
      currentSubject: lastPeriod.subject,
      badgeLabel: '정규수업 종료',
      bannerText: `현재 ${currentTimeStr} (방과후/자습) · 마지막 ${lastPeriod.period}교시 [${lastPeriod.subject}] 완료`,
    };
  }

  // 3) 점심시간 (12:50 ~ 13:40)
  if (currentMin > 12 * 60 + 50 && currentMin < 13 * 60 + 40) {
    const nextP = periods.find((p) => p.period >= 5) || lastPeriod;
    return {
      currentTimeStr,
      statusType: 'lunch',
      activePeriod: nextP.period,
      currentSubject: nextP.subject,
      badgeLabel: '다음수업',
      bannerText: `현재 ${currentTimeStr} (점심시간 🍱) · 다음 ${nextP.period}교시 [${nextP.subject}]`,
    };
  }

  // 4) 각 교시 수업 시간 중 또는 쉬는 시간 체크
  for (let i = 0; i < periods.length; i++) {
    const pItem = periods[i];
    const slot = PERIOD_TIME_SLOTS[pItem.period];
    if (!slot) continue;

    // 해당 교시 수업 진행 중!
    if (currentMin >= slot.startMin && currentMin <= slot.endMin) {
      return {
        currentTimeStr,
        statusType: 'in_class',
        activePeriod: pItem.period,
        currentSubject: pItem.subject,
        badgeLabel: '수강중',
        bannerText: `현재 ${currentTimeStr} · ${pItem.period}교시 [${pItem.subject}] 수강 중`,
      };
    }

    // 쉬는 시간 (현재 교시 끝 ~ 다음 교시 시작 사이)
    if (i + 1 < periods.length) {
      const nextItem = periods[i + 1];
      const nextSlot = PERIOD_TIME_SLOTS[nextItem.period];
      if (nextSlot && currentMin > slot.endMin && currentMin < nextSlot.startMin) {
        return {
          currentTimeStr,
          statusType: 'break',
          activePeriod: nextItem.period,
          currentSubject: nextItem.subject,
          badgeLabel: '다음수업',
          bannerText: `현재 ${currentTimeStr} (쉬는시간) · 다음 ${nextItem.period}교시 [${nextItem.subject}]`,
        };
      }
    }
  }

  return {
    currentTimeStr,
    statusType: 'after_school',
    activePeriod: lastPeriod.period,
    currentSubject: lastPeriod.subject,
    badgeLabel: '방과후',
    bannerText: `현재 ${currentTimeStr} · 오늘 정규수업 종료`,
  };
}

// 날짜(Date)를 YYYYMMDD 문자열로 변환하는 헬퍼 함수
function formatYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 나이스 DDISH_NM 문자열을 메뉴 배열로 파싱하는 헬퍼 함수
function parseDishText(rawDish: string): MealMenuItem[] {
  return rawDish
    .split('<br/>')
    .map((item: string) => {
      const cleaned = item.replace(/\*+/g, '').trim();
      const match = cleaned.match(/^(.*?)(?:\s*\(([\d\.]+)\)|\s+([\d\.]+))?$/);
      const rawName = match ? match[1].trim() : cleaned;
      const rawAllergy = (match && (match[2] || match[3])) || '';
      return {
        name: rawName,
        allergy: rawAllergy,
      };
    })
    .filter((item: MealMenuItem) => item.name.length > 0);
}

/**
 * 0. 로그인 시 선택된 학교 객체(School) 또는 학교명/ID에서 나이스(NEIS) 행정표준코드를 동적으로 해석합니다.
 *    코드가 없는 경우 나이스 학교검색 API(schoolInfo)를 실시간 호출해 받아옵니다.
 */
export async function resolveSchoolNeisCodeAsync(schoolOrId: string | School): Promise<{
  name: string;
  officeCode: string;
  schoolCode: string;
} | null> {
  if (typeof schoolOrId === 'object' && schoolOrId !== null) {
    if (schoolOrId.officeCode && schoolOrId.schoolCode) {
      runtimeSchoolCache[schoolOrId.id] = {
        name: schoolOrId.name,
        officeCode: schoolOrId.officeCode,
        schoolCode: schoolOrId.schoolCode,
      };
      return runtimeSchoolCache[schoolOrId.id];
    }
    if (runtimeSchoolCache[schoolOrId.id]) {
      return runtimeSchoolCache[schoolOrId.id];
    }
    if (schoolOrId.name) {
      const searched = await searchNeisHighSchools(schoolOrId.name);
      if (searched.length > 0 && searched[0].officeCode && searched[0].schoolCode) {
        return {
          name: searched[0].name,
          officeCode: searched[0].officeCode,
          schoolCode: searched[0].schoolCode,
        };
      }
    }
    return null;
  }

  if (runtimeSchoolCache[schoolOrId]) {
    return runtimeSchoolCache[schoolOrId];
  }

  const searched = await searchNeisHighSchools(schoolOrId);
  if (searched.length > 0 && searched[0].officeCode && searched[0].schoolCode) {
    return {
      name: searched[0].name,
      officeCode: searched[0].officeCode,
      schoolCode: searched[0].schoolCode,
    };
  }
  return null;
}

/**
 * 0-1. 나이스(NEIS) 학교기본정보 API(schoolInfo)를 통해 전국 모든 고등학교를 실시간 검색합니다.
 */
export async function searchNeisHighSchools(keyword: string): Promise<School[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const keyParam = NEIS_API_KEY ? `&KEY=${encodeURIComponent(NEIS_API_KEY)}` : '';
  const url = `https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=25${keyParam}&SCHUL_KND_SC_NM=${encodeURIComponent(
    '고등학교'
  )}&SCHUL_NM=${encodeURIComponent(trimmed)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (data.schoolInfo && data.schoolInfo[1]?.row) {
      return data.schoolInfo[1].row.map((r: any) => {
        const officeCode = String(r.ATPT_OFCDC_SC_CODE || '');
        const schoolCode = String(r.SD_SCHUL_CODE || '');
        const name = String(r.SCHUL_NM || '');
        const region = String(r.LCTN_SC_NM || r.ATPT_OFCDC_SC_NM || '');
        const id = schoolCode ? `neis_${officeCode}_${schoolCode}` : name;

        // 검색된 학교를 런타임 캐시에 저장
        runtimeSchoolCache[id] = { name, officeCode, schoolCode };

        return {
          id,
          name,
          region,
          officeCode,
          schoolCode,
        };
      });
    }
  } catch (e) {
    console.warn('나이스 전국 고등학교 검색 오류:', e);
  }
  return [];
}

/**
 * 1. 나이스 API로부터 로그인 시 선택한 고등학교의 오늘의 급식(중식, MMEAL_SC_CODE=2)을 실시간 조회합니다.
 */
export async function fetchNeisMealInfo(
  schoolOrId: string | School,
  ymd?: string,
  customApiKey?: string
): Promise<MealInfo> {
  const baseDate = new Date();
  const todayDisplay = `${baseDate.getFullYear()}. ${String(baseDate.getMonth() + 1).padStart(
    2,
    '0'
  )}. ${String(baseDate.getDate()).padStart(2, '0')} 중식`;

  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) {
    return {
      isSuccess: false,
      schoolName: '학교 미선택',
      date: todayDisplay,
      calorie: '-',
      menu: [],
      message: '고등학교가 선택되지 않았습니다.',
    };
  }
  const activeKey = (customApiKey ?? NEIS_API_KEY).trim();
  const keyParam = activeKey ? `&KEY=${encodeURIComponent(activeKey)}` : '';

  // 지정 날짜 또는 오늘 날짜만 정확히 조회 (다른 날 급식 대체 조회 안 함)
  const candidateDates: string[] = ymd ? [ymd] : [formatYmd(baseDate)];

  try {
    for (const targetDate of candidateDates) {
      // MMEAL_SC_CODE=2 (중식) 전용 조회
      const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=5${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&MMEAL_SC_CODE=2&MLSV_YMD=${targetDate}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();

      if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]?.row) {
        const mealRow = data.mealServiceDietInfo[1].row[0];
        return {
          isSuccess: true,
          schoolName: school.name,
          date: todayDisplay,
          calorie: mealRow.CAL_INFO || '정보 없음',
          origin: mealRow.ORPLC_INFO || '',
          menu: parseDishText(mealRow.DDISH_NM || ''),
        };
      }
    }

    return {
      isSuccess: false,
      schoolName: school.name,
      date: todayDisplay,
      calorie: '-',
      menu: [],
      message: '오늘 등록된 급식 정보가 없습니다.',
    };
  } catch (error) {
    console.warn('나이스 급식 API 호출 오류:', error);
    return {
      isSuccess: false,
      schoolName: school.name,
      date: todayDisplay,
      calorie: '-',
      menu: [],
      message: '나이스(NEIS) 서버와 통신할 수 없습니다.',
    };
  }
}

/**
 * 2. 나이스 API(hisTimetable)로부터 선택한 학교·학년의 교시별 시간표를 실시간 조회합니다.
 */
export async function fetchNeisTimetable(
  schoolOrId: string | School,
  gradeStr: string = '고2'
): Promise<{ dateLabel: string; periods: TimetablePeriodItem[] }> {
  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) {
    return { dateLabel: '학교 미선택', periods: [] };
  }
  const gradeNum = gradeStr.replace(/[^0-9]/g, '') || '2';
  const keyParam = NEIS_API_KEY ? `&KEY=${encodeURIComponent(NEIS_API_KEY)}` : '';

  const baseDate = new Date();
  const candidateDates = [
    formatYmd(baseDate),
    formatYmd(new Date(baseDate.getTime() + 86400000)),
    formatYmd(new Date(baseDate.getTime() + 2 * 86400000)),
    formatYmd(new Date(baseDate.getTime() - 86400000)),
    formatYmd(new Date(baseDate.getTime() - 2 * 86400000)),
  ];

  try {
    for (const targetDate of candidateDates) {
      const year = targetDate.slice(0, 4);
      // 1반(CLASS_NM=1) 우선 조회 후 없으면 학년 전체 조회
      const urls = [
        `https://open.neis.go.kr/hub/hisTimetable?Type=json&pIndex=1&pSize=50${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AY=${year}&GRADE=${gradeNum}&CLASS_NM=1&ALL_TI_YMD=${targetDate}`,
        `https://open.neis.go.kr/hub/hisTimetable?Type=json&pIndex=1&pSize=150${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AY=${year}&GRADE=${gradeNum}&ALL_TI_YMD=${targetDate}`,
      ];

      for (const url of urls) {
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        if (data.hisTimetable && data.hisTimetable[1]?.row) {
          const rows = data.hisTimetable[1].row;
          const periodMap = new Map<number, string>();

          for (const r of rows) {
            const p = parseInt(r.PERIO, 10);
            const subj = (r.ITRT_CNTNT || '').trim();
            if (!isNaN(p) && subj && !periodMap.has(p)) {
              periodMap.set(p, subj);
            }
          }

          const periods: TimetablePeriodItem[] = Array.from(periodMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([period, subject]) => {
              const slot = PERIOD_TIME_SLOTS[period] || { start: '09:00', end: '09:50' };
              return {
                period,
                subject,
                startTime: slot.start,
                endTime: slot.end,
              };
            });

          if (periods.length > 0) {
            return {
              dateLabel: `${targetDate.slice(4, 6)}.${targetDate.slice(6, 8)} 기준`,
              periods,
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn('나이스 시간표 API 호출 오류:', error);
  }

  return {
    dateLabel: '나이스 시간표 미등록',
    periods: [],
  };
}

/**
 * 3. 나이스 API(SchoolSchedule)로부터 선택한 학교의 학사일정을 가져와
 *    오늘부터 며칠 남았는지(D-Day) 실시간 계산하여 반환합니다.
 */
export async function fetchNeisSchedule(schoolOrId: string | School): Promise<DDayItem[]> {
  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) return [];
  const keyParam = NEIS_API_KEY ? `&KEY=${encodeURIComponent(NEIS_API_KEY)}` : '';

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fromYmd = formatYmd(todayMidnight);
  const toDate = new Date(todayMidnight.getTime() + 150 * 86400000);
  const toYmd = formatYmd(toDate);

  const colors = ['#ef4444', '#6366f1', '#10b981', '#a855f7', '#f59e0b'];

  try {
    const url = `https://open.neis.go.kr/hub/SchoolSchedule?Type=json&pIndex=1&pSize=200${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AA_FROM_YMD=${fromYmd}&AA_TO_YMD=${toYmd}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.SchoolSchedule && data.SchoolSchedule[1]?.row) {
        const rows = data.SchoolSchedule[1].row;
        const seenEvents = new Set<string>();
        const result: DDayItem[] = [];

        for (const r of rows) {
          const eventName = (r.EVENT_NM || '').trim();
          const ymd = String(r.AA_YMD || '');
          // 토요휴업일만 제외하고 실제 학사일정(임시휴업, 재량휴업, 기말고사, 방학, 공휴일 등) 모두 포함
          if (
            !eventName ||
            eventName === '토요휴업일' ||
            seenEvents.has(eventName) ||
            ymd.length !== 8
          ) {
            continue;
          }

          seenEvents.add(eventName);
          const eventDate = new Date(
            parseInt(ymd.slice(0, 4), 10),
            parseInt(ymd.slice(4, 6), 10) - 1,
            parseInt(ymd.slice(6, 8), 10)
          );
          const diffDays = Math.round(
            (eventDate.getTime() - todayMidnight.getTime()) / 86400000
          );
          const dDayStr =
            diffDays === 0 ? 'D-Day' : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;

          result.push({
            title: eventName,
            targetDate: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
            dDay: dDayStr,
            badgeColor: colors[result.length % colors.length],
          });

          if (result.length >= 6) break;
        }

        if (result.length > 0) return result;
      }
    }
  } catch (error) {
    console.warn('나이스 학사일정 API 호출 오류:', error);
  }

  return [];
}

export interface MonthlyScheduleItem {
  date: string; // YYYY-MM-DD
  day: number;
  title: string;
  isHoliday: boolean;
}

/**
 * 4. 달력 보기용: 특정 연·월의 나이스(NEIS) 학사일정을 날짜별로 모두 조회합니다.
 */
export async function fetchNeisMonthSchedule(
  schoolOrId: string | School,
  year: number,
  month: number
): Promise<MonthlyScheduleItem[]> {
  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) return [];
  const keyParam = NEIS_API_KEY ? `&KEY=${encodeURIComponent(NEIS_API_KEY)}` : '';

  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  const fromYmd = `${year}${mm}01`;
  const toYmd = `${year}${mm}${String(lastDay).padStart(2, '0')}`;

  try {
    const url = `https://open.neis.go.kr/hub/SchoolSchedule?Type=json&pIndex=1&pSize=200${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AA_FROM_YMD=${fromYmd}&AA_TO_YMD=${toYmd}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (data.SchoolSchedule && data.SchoolSchedule[1]?.row) {
      const rows = data.SchoolSchedule[1].row;
      const items: MonthlyScheduleItem[] = [];
      for (const r of rows) {
        const eventName = (r.EVENT_NM || '').trim();
        const ymd = String(r.AA_YMD || '');
        if (!eventName || eventName === '토요휴업일' || ymd.length !== 8) continue;

        const dayNum = parseInt(ymd.slice(6, 8), 10);
        const sbtrName = String(r.SBTR_DD_SC_NM || '');
        items.push({
          date: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
          day: dayNum,
          title: eventName,
          isHoliday:
            sbtrName.includes('휴업') ||
            sbtrName.includes('공휴') ||
            eventName.includes('휴업') ||
            eventName.includes('방학'),
        });
      }
      return items;
    }
  } catch (error) {
    console.warn('나이스 월간 학사일정 API 호출 오류:', error);
  }
  return [];
}
