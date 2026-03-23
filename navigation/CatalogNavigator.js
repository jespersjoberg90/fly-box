import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CatalogCategoriesScreen from '../screens/CatalogCategoriesScreen';
import CatalogFlyListScreen from '../screens/CatalogFlyListScreen';
import { catalogTheme as t } from '../constants/catalogTheme';

const Stack = createNativeStackNavigator();

export default function CatalogNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: { backgroundColor: t.bg },
      }}
    >
      <Stack.Screen
        name="CatalogCategories"
        component={CatalogCategoriesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CatalogFlyList"
        component={CatalogFlyListScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params.flyType,
          headerBackTitle: 'Katalog',
          headerStyle: {
            backgroundColor: t.bg,
            shadowOpacity: 0,
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: t.cardBorder,
          },
          headerTintColor: t.primary,
          headerTitleStyle: {
            fontWeight: '700',
            color: t.text,
            fontSize: 17,
          },
          headerShadowVisible: false,
        })}
      />
    </Stack.Navigator>
  );
}
