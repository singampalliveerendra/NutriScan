import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../src/context/AppContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="scanner"
          options={{
            title: 'Scan Barcode',
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search Food',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: 'Product Details',
            presentation: 'card',
            headerBackTitle: 'Back',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </ThemeProvider>
  );
}
