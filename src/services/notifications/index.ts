import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureNotifications(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6C5CE7",
      });
    }

    return true;
  } catch (error) {
    console.error("Notification config error:", error);
    return false;
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  date: Date,
  data?: Record<string, unknown>
): Promise<string> {
  const granted = await configureNotifications();
  if (!granted) return "";

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });

  return identifier;
}

export async function scheduleRecurringReminder(
  title: string,
  body: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly",
  data?: Record<string, unknown>
): Promise<string> {
  const granted = await configureNotifications();
  if (!granted) return "";

  const channelId = Platform.OS === "android" ? "reminders" : undefined;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 9,
      minute: 0,
      repeats: true,
      weekday: frequency === "daily" ? 1 : undefined,
    },
    ...(channelId ? { channelId } : {}),
  });

  return identifier;
}

export async function sendBudgetAlert(
  categoryName: string,
  spentAmount: string,
  budgetAmount: string
): Promise<void> {
  await scheduleNotification(
    "Budget Alert",
    `You've spent ${spentAmount} of ${budgetAmount} on ${categoryName}`,
    new Date(Date.now() + 1000),
    { type: "budget_alert", category: categoryName }
  );
}

export async function sendOverBudgetAlert(
  categoryName: string
): Promise<void> {
  await scheduleNotification(
    "Over Budget!",
    `You've exceeded your budget for ${categoryName}`,
    new Date(Date.now() + 1000),
    { type: "over_budget", category: categoryName }
  );
}

export async function cancelNotification(identifier: string): Promise<void> {
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
