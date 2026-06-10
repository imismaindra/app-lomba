import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import FloatingTabBar from '../components/FloatingTabBar';

// Import screens (hanya yang dipakai di bottom tab)
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import EcoPointScreen from '../screens/EcoPointScreen';
import ScanScreen from '../screens/ScanScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AboutAppScreen from '../screens/profile-settings/AboutAppScreen';
import ChangePasswordScreen from '../screens/profile-settings/ChangePasswordScreen';
import EditProfileScreen from '../screens/profile-settings/EditProfileScreen';
import HelpScreen from '../screens/profile-settings/HelpScreen';
import LanguageSettingsScreen from '../screens/profile-settings/LanguageSettingsScreen';
import NotificationSettingsScreen from '../screens/profile-settings/NotificationSettingsScreen';

interface AppNavigatorProps {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081'],
  config: {
    screens: {
      Onboarding: '',
      Login: 'login',
      Register: 'register',
      MainTabs: {
        path: '',
        screens: {
          Dashboard: 'dashboard',
          Scan: 'scan',
          History: 'history',
          'Eco Poin': 'eco-points',
          Profil: 'profile',
        },
      },
      EditProfile: 'profile/edit',
      ChangePassword: 'profile/password',
      NotificationSettings: 'profile/notifications',
      LanguageSettings: 'profile/language',
      Help: 'profile/help',
      AboutApp: 'profile/about',
    },
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Eco Poin" component={EcoPointScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ showToast }: AppNavigatorProps) {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login">
              {() => <LoginScreen showToast={showToast} />}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {() => <RegisterScreen showToast={showToast} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
