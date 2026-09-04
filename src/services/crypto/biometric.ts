import * as LocalAuthentication from "expo-local-authentication";
import { CACHE_KEYS, getBoolean, setBoolean } from "@services/storage";

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function getBiometricType(): Promise<
  LocalAuthentication.AuthenticationType[] | null
> {
  const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return supported;
}

export async function authenticate(
  promptMessage: string = "Unlock WalleTrack"
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error("Biometric auth error:", error);
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  return getBoolean(CACHE_KEYS.BIOMETRIC_ENABLED);
}

export function setBiometricEnabled(enabled: boolean): void {
  setBoolean(CACHE_KEYS.BIOMETRIC_ENABLED, enabled);
}
