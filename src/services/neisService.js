// 교육부 나이스(NEIS) 교육정보 개방 포털 공식 오픈 API 연동 서비스
// 공식 포털: https://open.neis.go.kr

export const NEIS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_NEIS_API_KEY) ||
  '40ccaac1f9854b3e9718425d74002ef3';

// 런타임 중 나이스(NEIS) 검색 API를 통해 조회된 학교 코드 동적 캐시 (하드코딩 제거)
const runtimeSchoolCache = {};

export async function searchNeisHighSchools(keyword) {
  const trimmed = (keyword || '').trim();
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
      return data.schoolInfo[1].row.map((r) => {
        const officeCode = String(r.ATPT_OFCDC_SC_CODE || '');
        const schoolCode = String(r.SD_SCHUL_CODE || '');
        const name = String(r.SCHUL_NM || '');
        const region = String(r.LCTN_SC_NM || r.ATPT_OFCDC_SC_NM || '');
        const id = schoolCode ? `neis_${officeCode}_${schoolCode}` : name;

        runtimeSchoolCache[id] = { name, officeCode, schoolCode };
        return { id, name, region, officeCode, schoolCode };
      });
    }
  } catch (e) {
    console.warn('나이스 전국 고등학교 검색 오류:', e);
  }
  return [];
}

export async function resolveSchoolNeisCodeAsync(schoolOrId) {
  if (typeof schoolOrId === 'object' && schoolOrId !== null) {
    if (schoolOrId.officeCode && schoolOrId.schoolCode) {
      runtimeSchoolCache[schoolOrId.id] = {
        name: schoolOrId.name,
        officeCode: schoolOrId.officeCode,
        schoolCode: schoolOrId.schoolCode
      };
      return runtimeSchoolCache[schoolOrId.id];
    }
    if (runtimeSchoolCache[schoolOrId.id]) return runtimeSchoolCache[schoolOrId.id];
    if (schoolOrId.name) {
      const searched = await searchNeisHighSchools(schoolOrId.name);
      if (searched.length > 0) return searched[0];
    }
    return null;
  }
  if (runtimeSchoolCache[schoolOrId]) return runtimeSchoolCache[schoolOrId];
  const searched = await searchNeisHighSchools(schoolOrId);
  return searched.length > 0 ? searched[0] : null;
}

export const PERIOD_TIME_SLOTS = {
  1: { start: '08:40', end: '09:30', startMin: 8 * 60 + 40, endMin: 9 * 60 + 30 },
  2: { start: '09:40', end: '10:30', startMin: 9 * 60 + 40, endMin: 10 * 60 + 30 },
  3: { start: '10:40', end: '11:30', startMin: 10 * 60 + 40, endMin: 11 * 60 + 30 },
  4: { start: '11:40', end: '12:30', startMin: 11 * 60 + 40, endMin: 12 * 60 + 30 },
  5: { start: '13:30', end: '14:20', startMin: 13 * 60 + 30, endMin: 14 * 60 + 20 },
  6: { start: '14:30', end: '15:20', startMin: 14 * 60 + 30, endMin: 15 * 60 + 20 },
  7: { start: '15:30', end: '16:20', startMin: 15 * 60 + 30, endMin: 16 * 60 + 20 },
  8: { start: '16:30', end: '17:20', startMin: 16 * 60 + 30, endMin: 17 * 60 + 20 }
};

export function getRealtimeClassStatus(periods, now = new Date()) {
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
      bannerText: `현재 ${currentTimeStr} · 시간표 정보를 불러오는 중입니다`
    };
  }

  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];
  const firstSlot = PERIOD_TIME_SLOTS[firstPeriod.period] || PERIOD_TIME_SLOTS[1];
  const lastSlot =
    PERIOD_TIME_SLOTS[lastPeriod.period] || PERIOD_TIME_SLOTS[periods.length] || PERIOD_TIME_SLOTS[7];

  if (currentMin < firstSlot.startMin) {
    return {
      currentTimeStr,
      statusType: 'before_school',
      activePeriod: firstPeriod.period,
      currentSubject: firstPeriod.subject,
      badgeLabel: '1교시 예정',
      bannerText: `현재 ${currentTimeStr} (등교/조례) · 1교시 [${firstPeriod.subject}] 예정`
    };
  }

  if (currentMin > lastSlot.endMin) {
    return {
      currentTimeStr,
      statusType: 'after_school',
      activePeriod: lastPeriod.period,
      currentSubject: lastPeriod.subject,
      badgeLabel: '정규수업 종료',
      bannerText: `현재 ${currentTimeStr} (방과후/자습) · 마지막 ${lastPeriod.period}교시 [${lastPeriod.subject}] 완료`
    };
  }

  if (currentMin > 12 * 60 + 30 && currentMin < 13 * 60 + 30) {
    const nextP = periods.find((p) => p.period >= 5) || lastPeriod;
    return {
      currentTimeStr,
      statusType: 'lunch',
      activePeriod: nextP.period,
      currentSubject: nextP.subject,
      badgeLabel: '다음수업',
      bannerText: `현재 ${currentTimeStr} (점심시간 🍱) · 다음 ${nextP.period}교시 [${nextP.subject}]`
    };
  }

  for (let i = 0; i < periods.length; i++) {
    const pItem = periods[i];
    const slot = PERIOD_TIME_SLOTS[pItem.period];
    if (!slot) continue;

    if (currentMin >= slot.startMin && currentMin <= slot.endMin) {
      return {
        currentTimeStr,
        statusType: 'in_class',
        activePeriod: pItem.period,
        currentSubject: pItem.subject,
        badgeLabel: '수강중',
        bannerText: `현재 ${currentTimeStr} · ${pItem.period}교시 [${pItem.subject}] 수강 중`
      };
    }

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
          bannerText: `현재 ${currentTimeStr} (쉬는시간) · 다음 ${nextItem.period}교시 [${nextItem.subject}]`
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
    bannerText: `현재 ${currentTimeStr} · 오늘 정규수업 종료`
  };
}

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function parseDishText(rawDish) {
  return (rawDish || '')
    .split('<br/>')
    .map((item) => {
      const cleaned = item.replace(/\*+/g, '').trim();
      const match = cleaned.match(/^(.*?)(?:\s*\(([\d.]+)\)|\s+([\d.]+))?$/);
      return {
        name: match ? match[1].trim() : cleaned,
        allergy: (match && (match[2] || match[3])) || ''
      };
    })
    .filter((item) => item.name.length > 0);
}

export async function fetchNeisMealInfo(schoolOrId, ymd, customApiKey) {
  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) {
    return { isSuccess: false, message: '선택된 고등학교가 없습니다.' };
  }
  const activeKey = (customApiKey ?? NEIS_API_KEY).trim();
  const keyParam = activeKey ? `&KEY=${encodeURIComponent(activeKey)}` : '';

  const baseDate = new Date();
  const todayYmd = formatYmd(baseDate);
  const todayDisplay = `${todayYmd.slice(0, 4)}. ${todayYmd.slice(4, 6)}. ${todayYmd.slice(6, 8)} 중식`;

  // 지정 날짜 또는 오늘 날짜만 정확히 조회 (다른 날 급식 대체 조회 안 함)
  const candidateDates = ymd ? [ymd] : [todayYmd];

  try {
    for (const targetDate of candidateDates) {
      // MMEAL_SC_CODE=2 (중식 전용 조회)
      const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&MMEAL_SC_CODE=2&MLSV_YMD=${targetDate}`;

      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();

      if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]?.row) {
        const rows = data.mealServiceDietInfo[1].row;
        const lunchRow = rows.find((r) => String(r.MMEAL_SC_CODE) === '2') || rows[0];
        const parsedMenu = parseDishText(lunchRow.DDISH_NM);

        return {
          isSuccess: true,
          schoolName: school.name,
          date: todayDisplay,
          calorie: lunchRow.CAL_INFO || '정보 없음',
          origin: lunchRow.ORPLC_INFO || '',
          menu: parsedMenu,
          meals: {
            '2': {
              mealCode: '2',
              mealName: '중식',
              calorie: lunchRow.CAL_INFO || '정보 없음',
              origin: lunchRow.ORPLC_INFO || '',
              menu: parsedMenu
            }
          }
        };
      }
    }

    return {
      isSuccess: false,
      date: todayDisplay,
      menu: [],
      message: '오늘 등록된 급식 정보가 없습니다.'
    };
  } catch (error) {
    console.error('나이스 급식 API 호출 실패:', error);
    return {
      isSuccess: false,
      message: '급식 서버와의 통신이 원활하지 않습니다.'
    };
  }
}

export async function fetchNeisTimetable(schoolOrId, gradeStr = '고2') {
  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) return { dateLabel: '학교 미선택', periods: [] };
  const gradeNum = gradeStr.replace(/[^0-9]/g, '') || '2';
  const keyParam = NEIS_API_KEY ? `&KEY=${encodeURIComponent(NEIS_API_KEY)}` : '';

  const baseDate = new Date();
  const candidateDates = [
    formatYmd(baseDate),
    formatYmd(new Date(baseDate.getTime() + 86400000)),
    formatYmd(new Date(baseDate.getTime() + 2 * 86400000)),
    formatYmd(new Date(baseDate.getTime() - 86400000)),
    formatYmd(new Date(baseDate.getTime() - 2 * 86400000))
  ];

  try {
    for (const targetDate of candidateDates) {
      const year = targetDate.slice(0, 4);
      const urls = [
        `https://open.neis.go.kr/hub/hisTimetable?Type=json&pIndex=1&pSize=50${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AY=${year}&GRADE=${gradeNum}&CLASS_NM=1&ALL_TI_YMD=${targetDate}`,
        `https://open.neis.go.kr/hub/hisTimetable?Type=json&pIndex=1&pSize=150${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AY=${year}&GRADE=${gradeNum}&ALL_TI_YMD=${targetDate}`
      ];

      for (const url of urls) {
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        if (data.hisTimetable && data.hisTimetable[1]?.row) {
          const rows = data.hisTimetable[1].row;
          const periodMap = new Map();

          for (const r of rows) {
            const p = parseInt(r.PERIO, 10);
            const subj = (r.ITRT_CNTNT || '').trim();
            if (!isNaN(p) && subj && !periodMap.has(p)) {
              periodMap.set(p, subj);
            }
          }

          const periods = Array.from(periodMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([period, subject]) => {
              const slot = PERIOD_TIME_SLOTS[period] || { start: '08:40', end: '09:30' };
              return {
                period,
                subject,
                startTime: slot.start,
                endTime: slot.end
              };
            });

          if (periods.length > 0) {
            return {
              dateLabel: `${targetDate.slice(4, 6)}.${targetDate.slice(6, 8)} 기준`,
              periods
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
    periods: []
  };
}

export async function fetchNeisSchedule(schoolOrId) {
  const school = await resolveSchoolNeisCodeAsync(schoolOrId);
  if (!school) return [];
  const keyParam = NEIS_API_KEY ? `&KEY=${encodeURIComponent(NEIS_API_KEY)}` : '';

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fromYmd = formatYmd(todayMidnight);
  const toDate = new Date(todayMidnight.getTime() + 150 * 86400000);
  const toYmd = formatYmd(toDate);

  const badgeColors = ['bg-red-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];

  try {
    const url = `https://open.neis.go.kr/hub/SchoolSchedule?Type=json&pIndex=1&pSize=200${keyParam}&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&AA_FROM_YMD=${fromYmd}&AA_TO_YMD=${toYmd}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.SchoolSchedule && data.SchoolSchedule[1]?.row) {
        const rows = data.SchoolSchedule[1].row;
        const seenEvents = new Set();
        const result = [];

        for (const r of rows) {
          const eventName = (r.EVENT_NM || '').trim();
          const ymd = String(r.AA_YMD || '');
          if (!eventName || eventName === '토요휴업일' || seenEvents.has(eventName) || ymd.length !== 8) {
            continue;
          }

          seenEvents.add(eventName);
          const eventDate = new Date(
            parseInt(ymd.slice(0, 4), 10),
            parseInt(ymd.slice(4, 6), 10) - 1,
            parseInt(ymd.slice(6, 8), 10)
          );
          const diffDays = Math.round((eventDate.getTime() - todayMidnight.getTime()) / 86400000);
          const dDayStr =
            diffDays === 0 ? 'D-Day' : diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`;

          result.push({
            title: eventName,
            targetDate: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
            dDay: dDayStr,
            badgeColor: badgeColors[result.length % badgeColors.length]
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

/**
 * 4. 달력 보기용: 특정 연·월의 나이스(NEIS) 학사일정을 날짜별로 모두 조회합니다.
 */
export async function fetchNeisMonthSchedule(schoolOrId, year, month) {
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
      const items = [];
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
