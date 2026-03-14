import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/constants';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Text style={styles.tabIcon}>{icon}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 80,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
          ...SHADOWS.medium,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZE.xs,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: FONT_SIZE.xl,
          color: COLORS.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" focused={focused} />
          ),
          headerTitle: 'NutriScan',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  tabIconFocused: {
    backgroundColor: COLORS.primaryLight,
  },
  tabIcon: {
    fontSize: 22,
  },
});
