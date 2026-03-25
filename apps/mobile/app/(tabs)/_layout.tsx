import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useLaneDetection } from '@/lib/personal/use-lane-detection';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { lane } = useLaneDetection();
  const isPersonalLane = lane === 'personal';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: isPersonalLane ? 'Hôm nay' : 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'sun.max', android: 'wb_sunny', web: 'wb_sunny' }} tintColor={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Thuốc',
          href: isPersonalLane ? undefined : null,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'pills',
                android: 'medical_services',
                web: 'medication',
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: isPersonalLane ? 'Lịch sử' : 'History',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'clock.arrow.circlepath', android: 'history', web: 'history' }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: 'Prescriptions',
          headerShown: false,
          href: isPersonalLane ? null : undefined,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'pills',
                android: 'medical_services',
                web: 'medication',
              }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          href: isPersonalLane ? null : undefined,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              tintColor={color}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isPersonalLane ? 'Tôi' : 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person', android: 'person', web: 'person' }} tintColor={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
