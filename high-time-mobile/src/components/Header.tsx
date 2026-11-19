// 상단 모바일 헤더 컴포넌트
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CurrentUser, School } from '../types';

interface HeaderProps {
  currentUser: CurrentUser;
  currentSchool: School;
  unreadNotiCount: number;
  onPressSchoolBadge: () => void;
  onPressNotification: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentSchool,
  unreadNotiCount,
  onPressSchoolBadge,
  onPressNotification,
}) => {
  return (
    <View style={styles.header}>
      {/* 로고 영역 */}
      <View style={styles.headerLeft}>
        <View style={styles.logoBadge}>
          <Ionicons name="school" size={13} color="#ffffff" />
          <Text style={styles.logoBadgeText}>HT</Text>
        </View>
        <View>
          <View style={styles.logoRow}>
            <Text style={styles.logoTitle}>HighTime</Text>
            <View style={styles.highSchoolBadge}>
              <Text style={styles.highSchoolBadgeText}>고교타임</Text>
            </View>
          </View>
          <Text style={styles.logoSub}>전국 고교 커뮤니티 & 학교생활</Text>
        </View>
      </View>

      {/* 우측 알림 버튼 */}
      <View style={styles.headerRight}>
        {/* 알림 버튼 */}
        <TouchableOpacity
          style={styles.notiButton}
          onPress={onPressNotification}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="#334155" />
          {unreadNotiCount > 0 && (
            <View style={styles.notiBadge}>
              <Text style={styles.notiBadgeText}>{unreadNotiCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  logoBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 10,
    lineHeight: 11,
    letterSpacing: -0.3,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  highSchoolBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  highSchoolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  logoSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    maxWidth: 120,
  },
  schoolBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991b1b',
  },
  notiButton: {
    position: 'relative',
    padding: 6,
    borderRadius: 16,
  },
  notiBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notiBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
});
