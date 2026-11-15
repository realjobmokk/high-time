// 교육부 나이스(NEIS) 공공 오픈 API 연동 서비스
// 전국 고등학교의 실제 급식 식단표, 알레르기 정보, 칼로리를 무료로 실시간 조회합니다.

// 전국 고등학교 나이스 표준 코드 매핑 테이블
export const NEIS_SCHOOL_CODES = {
  hana: { name: '하나고등학교', officeCode: 'B10', schoolCode: '7010572' },
  hanmin: { name: '한민고등학교', officeCode: 'J10', schoolCode: '7531128' },
  dan_dae: { name: '단대부속고등학교', officeCode: 'B10', schoolCode: '7010115' },
  sangsan: { name: '상산고등학교', officeCode: 'P10', schoolCode: '8320083' },
  min_sa: { name: '민족사관고등학교', officeCode: 'K10', schoolCode: '7800063' },
  daewon: { name: '대원외국어고등학교', officeCode: 'B10', schoolCode: '7010118' },
  sunrin: { name: '선린인터넷고등학교', officeCode: 'B10', schoolCode: '7010178' },
  general_a: { name: '세종과학예술영재교', officeCode: 'I10', schoolCode: '9300155' }
};

/**
 * 나이스 API로부터 특정 날짜의 학교 급식 식단표를 실시간 조회하는 함수
 * @param {string} schoolId - 학교 ID (예: 'hana')
 * @param {string} ymd - 조회일자 (YYYYMMDD 형식, 생략 시 오늘 날짜)
 */
export async function fetchNeisMealInfo(schoolId, ymd) {
  const school = NEIS_SCHOOL_CODES[schoolId] || NEIS_SCHOOL_CODES.hana;
  
  // 날짜 파라미터가 없으면 오늘 날짜 계산 (YYYYMMDD)
  const targetDate = ymd || getFormattedToday();

  const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=5&ATPT_OFCDC_SC_CODE=${school.officeCode}&SD_SCHUL_CODE=${school.schoolCode}&MLSV_YMD=${targetDate}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`NEIS API Network Error: ${response.status}`);
    }

    const data = await response.json();

    // 나이스 응답 구조 파싱
    if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]?.row) {
      const mealRow = data.mealServiceDietInfo[1].row[0];
      
      // 급식 메뉴 텍스트 정제 (<br/> 태그 및 알레르기 번호 분리)
      const rawDish = mealRow.DDISH_NM || '';
      const menuItems = rawDish.split('<br/>').map((item) => {
        // 메뉴명과 알레르기 번호 분리 (예: "차조밥 (5.6.)")
        const match = item.match(/^(.*?)(?:\s*\(([\d\.]+)\))?$/);
        return {
          name: match ? match[1].trim() : item.trim(),
          allergy: match && match[2] ? match[2] : ''
        };
      }).filter(item => item.name.length > 0);

      return {
        isSuccess: true,
        schoolName: school.name,
        date: mealRow.MLSV_YMD,
        calorie: mealRow.CAL_INFO || '정보 없음',
        origin: mealRow.ORPLC_INFO || '',
        menu: menuItems
      };
    } else {
      // 주말이나 방학, 시험일 등 급식이 없는 날
      return {
        isSuccess: false,
        message: '해당 일자에는 급식 정보가 없거나 휴업일입니다.'
      };
    }
  } catch (error) {
    console.error('나이스 급식 API 호출 실패:', error);
    return {
      isSuccess: false,
      message: '급식 서버와의 통신이 원활하지 않습니다.'
    };
  }
}

// 오늘 날짜를 YYYYMMDD 형태로 포맷하는 헬퍼 함수
function getFormattedToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
