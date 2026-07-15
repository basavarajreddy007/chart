import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { KeyRound, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { loginStart, loginSuccess, loginFailure } from '../features/authSlice';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

export const Login = () => {
  const [needs2FA, setNeeds2FA] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { error: authError, loading } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { error: triggerToastError, success: triggerToastSuccess } = useToast();

  const onSubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
        code2fa: data.code2fa || undefined,
      });

      if (response.data.requires2FA) {
        setNeeds2FA(true);
        setTempCredentials({ email: data.email, password: data.password });
        dispatch(loginFailure('2FA Code Required'));
        triggerToastSuccess('Enter your 2FA authentication code to continue.', '2FA Verification Required');
        return;
      }

      const { accessToken, user } = response.data;
      dispatch(loginSuccess({ user, token: accessToken }));
      connectSocket(accessToken);
      
      triggerToastSuccess(`Welcome back, ${user.displayName || user.username}!`, 'Connection Established');
      
      if (!user.displayName || !user.bio) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      dispatch(loginFailure(errMsg));
      triggerToastError(errMsg, 'Authentication Failed');
    }
  };

  const on2FASubmit = async (data) => {
    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', {
        email: tempCredentials.email,
        password: tempCredentials.password,
        code2fa: data.code2fa,
      });

      const { accessToken, user } = response.data;
      dispatch(loginSuccess({ user, token: accessToken }));
      connectSocket(accessToken);
      triggerToastSuccess(`Security verified. Welcome back, ${user.displayName || user.username}!`, 'Connection Authorized');
      
      if (!user.displayName || !user.bio) {
        navigate('/onboarding');
      } else {
        navigate('/');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || '2FA Verification failed';
      dispatch(loginFailure(errMsg));
      triggerToastError(errMsg, 'Verification Failed');
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
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <Card className="w-full max-w-md border border-theme-border bg-theme-card/40 p-8 shadow-popover">
        <CardContent className="p-0 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-md bg-theme-accent flex items-center justify-center text-white font-bold text-lg shadow-subtle mx-auto">
              N
            </div>
            <h2 className="text-xl font-bold text-theme-text tracking-tight">Access Account</h2>
            <p className="text-xs text-theme-muted">Sign in with email and password</p>
          </div>

          {authError && authError !== '2FA Code Required' && (
            <div className="p-3 bg-theme-error/10 border border-theme-error/20 rounded-md text-xs text-theme-error text-center font-medium">
              {authError}
            </div>
          )}

          {!needs2FA ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email', { required: 'Email address is required' })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password', { required: 'Password is required' })}
              />

              <Button
                type="submit"
                isLoading={loading}
                className="w-full py-2.5"
              >
                Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-theme-muted hover:text-theme-accent transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit(on2FASubmit)} className="space-y-5 text-left">
              <div className="text-center py-2 space-y-2">
                <KeyRound className="w-10 h-10 text-theme-accent mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider">Two-Factor Authentication</h3>
                <p className="text-xs text-theme-muted">Enter the authenticator code.</p>
              </div>

              <Input
                type="text"
                placeholder="123456"
                className="text-center text-lg font-mono tracking-[0.25em]"
                error={errors.code2fa?.message}
                {...register('code2fa', { required: '2FA code is required' })}
              />

              <Button
                type="submit"
                isLoading={loading}
                className="w-full py-2.5"
              >
                Verify Code
              </Button>

              <button
                type="button"
                onClick={() => setNeeds2FA(false)}
                className="w-full text-xs text-theme-muted hover:text-theme-text transition-colors mt-2 text-center"
              >
                Back to credentials
              </button>
            </form>
          )}

          {/* Google Sign-In */}
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

          <div className="border-t border-theme-border pt-4 text-center">
            <p className="text-xs text-theme-muted">
              Don't have an account?{' '}
              <Link to="/register" className="text-theme-accent hover:text-theme-accent-hover font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
