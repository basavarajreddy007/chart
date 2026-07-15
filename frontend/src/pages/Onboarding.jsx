import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, User, Palette } from 'lucide-react';
import api from '../services/api';
import { updateUser } from '../features/authSlice';
import { setTheme } from '../features/uiSlice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

export const Onboarding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const { success: triggerToastSuccess, error: triggerToastError } = useToast();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    if (step === 1 && !displayName.trim()) {
      triggerToastError('Please enter a display name to continue.', 'Field Required');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.put('/users/profile', {
        displayName: displayName.trim(),
        bio: bio.trim(),
        socialLinks: { twitter: '', github: '', website: '' },
      });
      
      dispatch(updateUser(response.data));
      triggerToastSuccess('Your workspace profile has been successfully initialized.', 'Onboarding Completed');
      navigate('/');
    } catch (err) {
      triggerToastError('Could not save onboarding profile settings.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 font-sans">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md border border-theme-border bg-theme-card/30 p-8 shadow-popover relative z-10">
        <CardContent className="p-0 space-y-6">
          {/* Header indicator */}
          <div className="flex items-center justify-between border-b border-theme-border pb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-theme-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-theme-text">Profile Setup</span>
            </div>
            <span className="text-xs text-theme-muted font-semibold">Step {step} of 2</span>
          </div>

          {step === 1 ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-left space-y-2">
                <CardTitle className="text-xl">Initialize Pilot Credentials</CardTitle>
                <CardDescription>Configure how you appear inside workspaces, chats, and directory lists.</CardDescription>
              </div>

              <div className="space-y-4">
                <Input
                  label="Display Name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Major Tom"
                  icon={<User className="w-4 h-4" />}
                  helperText="This is what other team members will see inside direct messages."
                />

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Profile Bio / Status</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Describe your role or department..."
                    className="w-full bg-theme-bg border border-theme-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-text placeholder:text-theme-muted/50 h-24 resize-none"
                  />
                </div>
              </div>

              <Button onClick={handleNextStep} className="w-full py-2.5">
                Configure Layout Theme <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-left space-y-2">
                <CardTitle className="text-xl">Interface Personalization</CardTitle>
                <CardDescription>Select a layout style that suits your working environment.</CardDescription>
              </div>

              <div className="space-y-4 text-left">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Design Palette
                </label>
                
                <div className="grid grid-cols-2 gap-3.5">
                  {[
                    { id: 'glassmorphism', name: 'Nebula Default' },
                    { id: 'amoled', name: 'AMOLED Black' },
                    { id: 'material', name: 'Material Slate' },
                    { id: 'cyberpunk', name: 'Cyberpunk Green' },
                  ].map((t) => {
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => dispatch(setTheme(t.id))}
                        className={`p-4 border rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                          isActive
                            ? 'bg-theme-accent/15 border-theme-accent text-white font-bold ring-2 ring-theme-accent/25'
                            : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-2.5">
                  Back
                </Button>
                <Button onClick={handleFinishOnboarding} isLoading={isSubmitting} className="flex-1 py-2.5">
                  Finish Configuration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
