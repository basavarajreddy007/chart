import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent } from '../components/ui/Card';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setIsSubmitting(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Check the address and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 font-sans">
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border border-theme-border bg-theme-card/40 p-8 shadow-popover">
        <CardContent className="p-0 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-md bg-theme-accent flex items-center justify-center text-white font-bold text-lg shadow-subtle mx-auto">
              N
            </div>
            <h2 className="text-xl font-bold text-theme-text tracking-tight">Reset Password</h2>
            <p className="text-xs text-theme-muted">Enter your email and we'll send a reset link</p>
          </div>

          {error && (
            <div className="p-3 bg-theme-error/10 border border-theme-error/20 rounded-md text-xs text-theme-error text-center font-medium">
              {error}
            </div>
          )}

          {!sent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
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
                    message: 'Invalid email address',
                  },
                })}
              />

              <Button type="submit" isLoading={isSubmitting} className="w-full py-2.5">
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-sm text-theme-text font-semibold">Reset link sent!</p>
              <p className="text-xs text-theme-muted">Check your inbox and follow the instructions.</p>
            </div>
          )}

          <div className="border-t border-theme-border pt-6 text-center">
            <Link
              to="/login"
              className="text-xs text-theme-muted hover:text-theme-text transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
