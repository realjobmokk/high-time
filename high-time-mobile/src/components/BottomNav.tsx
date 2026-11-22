// 하단 4개 핵심 탭 내비게이션 바 컴포넌트 (선택된 탭만 동그랗게 위로 올라오며 강조)
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  { id: 'home', label: '홈', activeIcon: 'home', inactiveIcon: 'home-outline' },
  { id: 'board', label: '게시판', activeIcon: 'layers', inactiveIcon: 'layers-outline' },
  {
    id: 'chat',
    label: '1:1채팅',
    activeIcon: 'chatbubble-ellipses',
    inactiveIcon: 'chatbubble-ellipses-outline',
  },
  {
    id: 'profile',
    label: '프로필',
    activeIcon: 'person-circle',
    inactiveIcon: 'person-circle-outline',
  },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount = 1,
}) => {
  return (
    <View style={styles.bottomNav}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navItem, isActive && styles.activeNavItem]}
            onPress={() => onChangeTab(tab.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, isActive && styles.activeIconWrap]}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={isActive ? 20 : 20}
                color={isActive ? '#ffffff' : '#94a3b8'}
              />
              {tab.id === 'chat' && unreadChatCount > 0 && (
                <View style={[styles.chatBadge, isActive && styles.chatBadgeActive]}>
                  <Text style={styles.chatBadgeText}>{unreadChatCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeNavItem: {
    marginTop: -12,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#dc2626',
    fontWeight: '800',
  },
  chatBadge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 6,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  chatBadgeActive: {
    top: -2,
    right: -2,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  chatBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
});
