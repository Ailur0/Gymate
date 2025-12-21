import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import BaseScreen from '../components/BaseScreen';
import { colors, spacing, typography } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { requestOtp, setCountryCode, setPhone, verifyOtp } from '../store/slices/authSlice';

const AuthScreen = () => {
  const dispatch = useAppDispatch();
  const { phone, countryCode, requestStatus, verifyStatus, error, otpExpiresAt } = useAppSelector(
    (state) => state.auth,
  );
  const [otp, setOtp] = useState('');

  const hasOtpStep = useMemo(() => requestStatus === 'succeeded' || Boolean(otpExpiresAt), [
    requestStatus,
    otpExpiresAt,
  ]);

  const isRequesting = requestStatus === 'loading';
  const isVerifying = verifyStatus === 'loading';

  const handleRequestOtp = () => {
    if (!phone) return;
    dispatch(requestOtp({ phone, countryCode }));
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length < 4) return;
    dispatch(verifyOtp({ phone, otp }));
  };

  const handleEditPhone = () => {
    setOtp('');
  };

  return (
    <BaseScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Verify your phone</Text>
        <Text style={styles.subtitle}>
          We use your phone number to keep your account secure and connect you with nearby partners.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Country code</Text>
          <TextInput
            style={styles.input}
            value={countryCode}
            onChangeText={(value) => dispatch(setCountryCode(value))}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(value) => dispatch(setPhone(value))}
            keyboardType="phone-pad"
            placeholder="5551234567"
            autoCorrect={false}
          />
        </View>

        {!hasOtpStep && (
          <PrimaryButton
            label={isRequesting ? 'Sending OTP...' : 'Send OTP'}
            disabled={!phone || isRequesting}
            onPress={handleRequestOtp}
          />
        )}

        {hasOtpStep && (
          <View style={styles.otpSection}>
            <View style={styles.otpHeader}>
              <Text style={styles.label}>Enter verification code</Text>
              <TouchableOpacity onPress={handleEditPhone}>
                <Text style={styles.editLink}>Edit phone</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={otp}
              maxLength={6}
              keyboardType="number-pad"
              placeholder="123456"
              autoCorrect={false}
              onChangeText={setOtp}
            />

            <PrimaryButton
              label={isVerifying ? 'Verifying...' : 'Verify & Continue'}
              disabled={!otp || isVerifying}
              onPress={handleVerifyOtp}
            />

            <TouchableOpacity
              style={styles.resendButton}
              disabled={isRequesting}
              onPress={handleRequestOtp}
            >
              {isRequesting ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <Text style={styles.resendText}>Resend code</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body,
    backgroundColor: colors.card,
  },
  otpSection: {
    gap: spacing.sm,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLink: {
    color: colors.accent,
    fontWeight: '600',
  },
  resendButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resendText: {
    color: colors.accent,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
  },
});

export default AuthScreen;
