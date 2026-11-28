// 하단 4개 핵심 탭 내비게이션 바 컴포넌트 (Figma v2.0 에디토리얼 디자인 적용)
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export type TabType = 'home' | 'board' | 'chat' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unreadChatCount?: number;
}

const TABS: {
  id: TabType;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}[] = [
    {
      id: 'home',
      label: '홈',
      activeIcon: 'home',
      inactiveIcon: 'home-outline',
    },
    {
      id: 'board',
      label: '게시판',
      activeIcon: 'reader',
      inactiveIcon: 'reader-outline',
    },
    {
      id: 'chat',
      label: '채팅',
      activeIcon: 'chatbubble-ellipses',
      inactiveIcon: 'chatbubble-ellipses-outline',
    },
    {
      id: 'profile',
      label: '내 정보',
      activeIcon: 'person',
      inactiveIcon: 'person-outline',
    },
  ];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount = 0,
}) => {
  return (
    <View style={styles.bottomNav}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.navItem}
            onPress={() => onChangeTab(tab.id)}
            activeOpacity={0.75}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={23}
                color={isActive ? COLORS.accent : COLORS.navMuted}
              />
              {tab.id === 'chat' && unreadChatCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    width: 52,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconPillActive: {
    backgroundColor: COLORS.accentNavPill,
  },
  chatBadge: {
    position: 'absolute',
    top: -3,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  chatBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});
