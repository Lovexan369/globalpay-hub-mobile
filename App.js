import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import { StripeProvider } from '@stripe/stripe-react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import MerchantDashboardScreen from './src/screens/MerchantDashboardScreen';
import { useProactiveTokenRefresh } from './src/hooks/useProactiveTokenRefresh';
import { useDataSync } from './src/hooks/useDataSync';
import { STRIPE_PUBLISHABLE_KEY } from './src/utils/constants';

const Stack = createStackNavigator();

export default function App() {
  useProactiveTokenRefresh();
  useDataSync();

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <PaperProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Регистрация' }} />
            <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: 'Платежи' }} />
            <Stack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} options={{ title: 'Мерчант' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </StripeProvider>
  );
}