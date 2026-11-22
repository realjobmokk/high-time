// 알림 센터 모달 컴포넌트
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem } from '../types';
import { PhoneModal } from '../components/PhoneModal';
import { COLORS } from '../theme/colors';

interface NotificationModalProps {
  visible: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  notifications,
  onClose,
  onMarkAllAsRead,
  onSelectNotification,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'chat':
        return { name: 'chatbubble-ellipses', color: COLORS.accent, bg: COLORS.accentSoft };
      case 'comment':
        return { name: 'chatbubble-ellipses', color: COLORS.ink, bg: COLORS.sageSurface };
      case 'question':
        return { name: 'heart', color: COLORS.accent, bg: COLORS.accentSoft };
      case 'like':
        return { name: 'thumbs-up', color: COLORS.success, bg: COLORS.sageSurface };
      case 'notice':
      default:
        return { name: 'shield-checkmark', color: COLORS.ink, bg: COLORS.sageCard };
    }
  };

  return (
    <PhoneModal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.ink} />
              <Text style={styles.headerTitle}>알림 센터</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={onMarkAllAsRead} style={styles.readAllBtn}>
                <Text style={styles.readAllBtnText}>모두 읽음</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 알림 목록 */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>도착한 알림이 없습니다.</Text>
              </View>
            ) : (
              notifications.map((item) => {
                const iconInfo = getIcon(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
                    onPress={() => onSelectNotification(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: iconInfo.bg }]}>
                      <Ionicons name={iconInfo.name as any} size={16} color={iconInfo.color} />
                    </View>
                    <View style={styles.itemContent}>
                      <View style={styles.itemTop}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemTime}>{item.time}</Text>
                      </View>
                      <Text style={styles.itemMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
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
    backgroundColor: 'rgba(34, 39, 34, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readAllBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: COLORS.sageButton,
  },
  readAllBtnText: {
    fontSize: 11,
    color: COLORS.ink,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemCardUnread: {
    backgroundColor: COLORS.accentSoft,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  itemMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
});

