import NetInfo from "@react-native-community/netinfo";

type Listener = (isConnected: boolean) => void;

const listeners = new Set<Listener>();
let currentStatus = true;

export function initNetworkListener(): void {
  NetInfo.addEventListener((state) => {
    currentStatus = !!state.isConnected;
    listeners.forEach((listener) => listener(currentStatus));
  });
}

export function isOnline(): boolean {
  return currentStatus;
}

export function subscribeToNetwork(callback: Listener): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function checkConnection(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected;
}
