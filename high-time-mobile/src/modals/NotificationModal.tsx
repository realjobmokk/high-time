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
        return { name: 'chatbubble-ellipses', color: '#dc2626', bg: '#fee2e2' };
      case 'comment':
        return { name: 'chatbubble-ellipses', color: '#2563eb', bg: '#dbeafe' };
      case 'question':
        return { name: 'heart', color: '#e11d48', bg: '#ffe4e6' };
      case 'like':
        return { name: 'thumbs-up', color: '#059669', bg: '#d1fae5' };
      case 'notice':
      default:
        return { name: 'shield-checkmark', color: '#dc2626', bg: '#fee2e2' };
    }
  };

  return (
    <PhoneModal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={18} color="#dc2626" />
              <Text style={styles.headerTitle}>알림 센터</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={onMarkAllAsRead} style={styles.readAllBtn}>
                <Text style={styles.readAllBtnText}>모두 읽음</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 24,
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  readAllBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemCardUnread: {
    backgroundColor: '#fff5f5',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
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

