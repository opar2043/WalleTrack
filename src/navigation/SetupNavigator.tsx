import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { SetupStackParamList } from "./types";

const Stack = createNativeStackNavigator<SetupStackParamList>();

import ProfileSetupScreen from "@screens/setup/ProfileSetupScreen";

export default function SetupNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Nationality" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
