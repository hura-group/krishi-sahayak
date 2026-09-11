import { usePostHog } from 'posthog-react-native';

// OTP Event Names
export const OTP_EVENTS = {
  SENT: 'otp_sent',
  VERIFIED: 'otp_verified',
  FAILED: 'otp_failed',
};

// Hook to use analytics in components
export const useOTPAnalytics = () => {
  const posthog = usePostHog();

  const logOTPSent = (_phone: string) => {
    posthog?.capture(OTP_EVENTS.SENT, { auth_method: 'sms' });
  };

  const logOTPVerified = (_phone: string) => {
    posthog?.capture(OTP_EVENTS.VERIFIED, { auth_method: 'sms' });
  };

  const logOTPFailed = (_phone: string, _reason: string) => {
    posthog?.capture(OTP_EVENTS.FAILED, {
      auth_method: 'sms',
      stage: 'verification',
    });
  };

  return { logOTPSent, logOTPVerified, logOTPFailed };
};