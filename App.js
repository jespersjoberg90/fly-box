import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlyBoxProvider } from './context/FlyBoxContext';
import CatalogNavigator from './navigation/CatalogNavigator';
import BoxScreen from './screens/BoxScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <FlyBoxProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#007aff',
              tabBarInactiveTintColor: '#8e8e93',
              tabBarStyle: {
                backgroundColor: '#f9f9f9',
                borderTopColor: '#c6c6c8',
              },
            }}
          >
            <Tab.Screen
              name="Catalog"
              component={CatalogNavigator}
              options={{
                title: 'Katalog',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="book-outline" size={size} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Box"
              component={BoxScreen}
              options={{
                title: 'Min ask',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="cube-outline" size={size} color={color} />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </FlyBoxProvider>
    </SafeAreaProvider>
  );
}
