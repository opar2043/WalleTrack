import { Toast } from "react-native-toast-alert";

export function showSuccess(message: string): void {
  Toast.success(message);
}

export function showError(message: string): void {
  Toast.error(message);
}

export function showInfo(message: string): void {
  Toast.info(message);
}

export function showWarning(message: string): void {
  Toast.warning(message);
}

export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
};

export default toast;
