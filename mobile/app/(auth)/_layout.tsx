import { Stack } from 'expo-router';

/** Pile de navigation de la branche (auth). */
export default function AuthLayout() {
  return <Stack initialRouteName="login" screenOptions={{ headerShown: false }} />;
}
