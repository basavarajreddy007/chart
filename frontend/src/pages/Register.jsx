import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { MailOpen, Lock, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

export const Register = () => {
  const [otpSent, setOtpSent] = useState(false);
  const [emailForOtp, setEmailForOtp] = useState('');
  const [signupData, setSignupData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { error: triggerToastError, success: triggerToastSuccess } = useToast();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ mode: 'onChange' });
  const { register: registerOtp, handleSubmit: handleSubmitOtp, formState: { errors: errorsOtp } } = useForm();

  const passwordValue = watch('password');

  useEffect(() => {
    let interval = null;
    if (otpSent && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, countdown]);

  useEffect(() => {
    if (otpSent && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent]);

  const onSubmitSignup = async (data) => {
    setIsSubmitting(true);
    const emailNormalized = data.email.toLowerCase().trim();
    // Deriving username and display name from email prefix to meet backend validations
    const emailPrefix = emailNormalized.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const username = `${emailPrefix}_${randomSuffix}`.substring(0, 20);

    const payload = {
      email: emailNormalized,
      password: data.password,
      username: username,
      displayName: emailPrefix,
    };

    try {
      const response = await api.post('/auth/register', payload);
      setSignupData(payload);
      setEmailForOtp(payload.email);
      if (response.data.otpCode) {
        triggerToastSuccess(`[Dev Mode] Verification OTP is ${response.data.otpCode}`, 'Dev Auto-fill code');
      } else {
        triggerToastSuccess(response.data.message || 'OTP Code Sent successfully.', 'Transmission Emitted');
      }
      setOtpSent(true);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      triggerToastError(errMsg, 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    if (!signupData) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', signupData);
      if (response.data.otpCode) {
        triggerToastSuccess(`[Dev Mode] Verification OTP is ${response.data.otpCode}`, 'Dev Auto-fill code');
      } else {
        triggerToastSuccess(response.data.message || 'Verification code resent successfully.', 'Relay Resent');
      }
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to resend code';
      triggerToastError(errMsg, 'Emission Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitOtp = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email: emailForOtp,
        otp: data.otp.trim(),
      });

      triggerToastSuccess(response.data.message || 'Verification successful! Redirecting...', 'Relay Authorized');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'OTP verification failed';
      triggerToastError(errMsg, 'Verification Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      triggerToastSuccess(`Welcome, ${user.displayName || user.username}!`, 'Signed in with Google');
      if (!user.displayName || !user.bio) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Google sign-in failed';
      triggerToastError(errMsg, 'Google Sign-In Failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 font-sans">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md border border-theme-border bg-theme-card/40 p-8 shadow-popover">
        <CardContent className="p-0 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-md bg-theme-accent flex items-center justify-center text-white font-bold text-lg shadow-subtle mx-auto">
              N
            </div>
            <h2 className="text-xl font-bold text-theme-text tracking-tight">Create Account</h2>
            <p className="text-xs text-theme-muted">Get started with email and password</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmitSignup)} className="space-y-4 text-left">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Invalid email address format'
                  }
                })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === passwordValue || 'Passwords do not match'
                })}
              />

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full py-2.5 mt-2"
              >
                Sign Up <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-6 text-left">
              <div className="text-center py-2 space-y-2">
                <MailOpen className="w-10 h-10 text-theme-accent mx-auto animate-bounce" />
                <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">Verify Email</h3>
                <p className="text-xs text-theme-muted">
                  Verification code sent to <span className="text-theme-text font-semibold">{emailForOtp}</span>.
                </p>
              </div>

              <Input
                type="text"
                placeholder="123456"
                className="text-center text-lg font-mono tracking-[0.25em]"
                maxLength={6}
                error={errorsOtp.otp?.message}
                {...registerOtp('otp', {
                  required: 'Verification code is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'OTP must be exactly 6 digits'
                  }
                })}
              />

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full py-2.5"
              >
                Verify Code
              </Button>

              <div className="flex flex-col items-center gap-2 pt-4 border-t border-theme-border text-center">
                <button
                  type="button"
                  onClick={onResendOtp}
                  disabled={!canResend || isSubmitting}
                  className="text-xs text-theme-accent hover:text-theme-accent-hover font-semibold disabled:text-theme-muted transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Resend Code
                </button>
                
                {!canResend && (
                  <span className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">
                    Resend in: {countdown}s
                  </span>
                )}
              </div>
            </form>
          )}

          {/* Google Sign-Up — only show on registration form, not OTP step */}
          {!otpSent && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-theme-border" />
                <span className="text-[10px] text-theme-muted uppercase tracking-widest font-semibold">or</span>
                <div className="flex-1 h-px bg-theme-border" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-theme-border rounded-md bg-theme-card hover:bg-theme-card/80 text-theme-text text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-theme-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>
            </div>
          )}

          <div className="border-t border-theme-border pt-4 text-center">
            <p className="text-xs text-theme-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-theme-accent hover:text-theme-accent-hover font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
