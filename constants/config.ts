import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  supabaseUrl: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '') as string,
  supabaseAnonKey: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '') as string,
  stripePublishableKey: (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? extra.stripePublishableKey ?? '') as string,
  stravaClientId: (process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID ?? extra.stravaClientId ?? '') as string,
  platformFeePercent: 0.05,
  reviewTimeoutDays: 14,
  ultrasignupSearchEndpoint: 'https://ultrasignup.com/service/events.svc/json',
  appScheme: 'mule',
};
