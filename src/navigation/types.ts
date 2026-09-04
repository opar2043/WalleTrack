import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  AccountsTab: undefined;
  AddTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  AccountDetail: { accountId: string };
  CategoryDetail: { categoryId: string };
  Budgets: undefined;
  Insights: undefined;
  Family: undefined;
  Download: undefined;
  AnalyticsDetail: undefined;
  TransactionDetail: { transactionId: string };
  AddTransaction: undefined;
  Filters: undefined;
  Premium: undefined;
  ProfileEdit: undefined;
};

export type SetupStackParamList = {
  Nationality: undefined;
  Currency: undefined;
  Language: undefined;
  Avatar: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Setup: NavigatorScreenParams<SetupStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
