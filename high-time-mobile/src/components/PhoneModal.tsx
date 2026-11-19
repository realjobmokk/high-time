// =============================================================================
// 📱 HighTime (고교타임) - 웹 폰 프레임 호환 공용 모달 래퍼
// - 실제 iOS/Android 앱에서는 기본 React Native <Modal> 그대로 동작
// - PC 웹 브라우저(8081) 미리보기에서는 스마트폰 프레임(430px) 내부 전체를 100% 채우도록 정렬
// =============================================================================

import React from 'react';
import { Modal, ModalProps, Platform, Text, View } from 'react-native';

export const PhoneModal: React.FC<ModalProps> = ({ children, ...props }) => {
  if (Platform.OS !== 'web') {
    return <Modal {...props}>{children}</Modal>;
  }

  return (
    <Modal {...props} transparent>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 16,
          paddingHorizontal: 12,
        }}
      >
        {/* App.tsx의 webTopHint와 동일한 높이를 차지해 폰 프레임 위치를 픽셀 단위로 일치 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8,
            opacity: 0,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600' }}>
            HighTime 앱스토어 출시용 모바일 앱 (8081)
          </Text>
        </View>

        <View
          style={{
            width: '100%',
            maxWidth: 430,
            height: '90vh' as any,
            maxHeight: 860,
            borderRadius: 36,
            borderWidth: 6,
            borderColor: 'transparent',
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
};
