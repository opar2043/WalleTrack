import { CACHE_KEYS, getItem, setItem } from "@services/storage";
import type { OfflineOperation } from "@t/index";

const QUEUE_KEY = CACHE_KEYS.OFFLINE_QUEUE;

export function enqueueOperation(
  collection: string,
  action: OfflineOperation["action"],
  data: Record<string, unknown>,
  documentId?: string
): void {
  const queue = getItem<OfflineOperation[]>(QUEUE_KEY) ?? [];
  const operation: OfflineOperation = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    collection,
    action,
    data,
    documentId,
    timestamp: Date.now(),
  };
  queue.push(operation);
  setItem(QUEUE_KEY, queue);
}

export function getQueue(): OfflineOperation[] {
  return getItem<OfflineOperation[]>(QUEUE_KEY) ?? [];
}

export function clearQueue(): void {
  setItem(QUEUE_KEY, []);
}

export function removeOperation(id: string): void {
  const queue = getQueue().filter((op) => op.id !== id);
  setItem(QUEUE_KEY, queue);
}

export function hasPendingOperations(): boolean {
  return getQueue().length > 0;
}

export async function syncOfflineQueue(
  syncFn: (operations: OfflineOperation[]) => Promise<void>
): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;

  try {
    await syncFn(queue);
    clearQueue();
  } catch (error) {
    console.error("Sync queue error:", error);
  }
}
