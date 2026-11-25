// 상단 모바일 헤더 컴포넌트 (Figma v2.0 에디토리얼 디자인 적용)
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CurrentUser, School } from '../types';
import { TabType } from './BottomNav';
import { COLORS } from '../theme/colors';

interface HeaderProps {
  activeTab?: TabType;
  currentUser: CurrentUser;
  currentSchool: School;
  unreadNotiCount: number;
  onPressSchoolBadge: () => void;
  onPressNotification: () => void;
  onPressSettings?: () => void;
}

const TAB_TITLES: Record<TabType, string> = {
  home: 'HighTime',
  board: '게시판',
  chat: '채팅',
  profile: '내 정보',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'home',
  currentSchool,
  unreadNotiCount,
  onPressSchoolBadge,
  onPressNotification,
  onPressSettings,
}) => {
  const isHome = activeTab === 'home';
  const isProfile = activeTab === 'profile';

  return (
    <View style={styles.header}>
      {/* 좌측 화면 제목 */}
      {isHome ? (
        <View style={styles.brandRow}>
          <View style={styles.brandIconBadge}>
            <Ionicons name="school" size={16} color="#ffffff" />
          </View>
          <Text style={[styles.title, styles.homeTitle]}>
            <Text style={styles.brandAccent}>H</Text>igh
            <Text style={styles.brandAccent}>T</Text>ime
          </Text>
        </View>
      ) : (
        <Text style={styles.title}>{TAB_TITLES[activeTab]}</Text>
      )}

      {/* 우측 학교 선택(홈 전용) 및 알림/설정 아이콘 */}
      <View style={styles.headerRight}>
        {isHome && (
          <TouchableOpacity
            style={styles.schoolButton}
            onPress={onPressSchoolBadge}
            activeOpacity={0.7}
          >
            <Text style={styles.schoolName} numberOfLines={1}>
              {currentSchool.name}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.ink} />
          </TouchableOpacity>
        )}

        {isProfile ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressSettings || onPressSchoolBadge}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.ink} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressNotification}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.ink} />
            {unreadNotiCount > 0 && (
              <View style={styles.notiBadge}>
                <Text style={styles.notiBadgeText}>
                  {unreadNotiCount > 99 ? '99+' : unreadNotiCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 22,
    backgroundColor: COLORS.bg,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  homeTitle: {
    fontSize: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandAccent: {
    color: COLORS.accent,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schoolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notiBadge: {
    position: 'absolute',
    top: 4,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notiBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
});
