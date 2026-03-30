import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { BORDER_RADIUS, SPACING, SHADOWS } from '../../src/constants';

function TabIcon({ icon, label, focused, color }: { icon: string; label: string; focused: boolean; color: string }) {
  return (
    <View style={styles.tabItem}>
      <View style={[
        styles.iconContainer, 
        focused && { backgroundColor: color + '20' }
      ]}>
        <Text style={[styles.tabIcon, focused && { opacity: 1 }]}>{icon}</Text>
        {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
      </View>
      <Text style={[
        styles.tabLabel, 
        focused && { color: color, fontWeight: '700' }
      ]}>
        {label}
      </Text>
    </View>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();
  
  return (
    <Pressable 
      onPress={toggleTheme} 
      style={[styles.themeButton, { backgroundColor: colors.surfaceAlt }]}
    >
      <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(18, 18, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          height: 85,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
          ...SHADOWS.medium,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 22,
          color: colors.text,
        },
        headerShadowVisible: false,
        headerRight: () => <ThemeToggle />,
        headerLeftContainerStyle: { paddingLeft: SPACING.md },
        headerRightContainerStyle: { paddingRight: SPACING.md },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'NutriScan',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} color={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerTitle: 'Scan Food',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📷" label="Scan" focused={focused} color={colors.primary} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Scan History',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label="History" focused={focused} color={colors.primary} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xs,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 32,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
});
