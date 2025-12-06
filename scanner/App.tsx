import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { ScanScreen } from "./src/screens/ScanScreen";
import { ConfirmScreen } from "./src/screens/ConfirmScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Scan"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0d9488",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Confirm"
          component={ConfirmScreen}
          options={{
            title: "Scan Result",
            presentation: "modal",
            headerStyle: {
              backgroundColor: "#fff",
            },
            headerTintColor: "#0d9488",
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: "Scan History",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
