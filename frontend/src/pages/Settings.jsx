import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Palette, Save, QrCode, KeyRound, Check } from 'lucide-react';
import api from '../services/api';
import { updateUser } from '../features/authSlice';
import { setTheme, setWallpaper } from '../features/uiSlice';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';

export const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, wallpaper } = useSelector((state) => state.ui);
  const { success: triggerToastSuccess, error: triggerToastError } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || '');
  const [github, setGithub] = useState(user?.socialLinks?.github || '');
  const [website, setWebsite] = useState(user?.socialLinks?.website || '');
  const [instagram, setInstagram] = useState(user?.socialLinks?.instagram || '');

  
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.is2FAEnabled || false);
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isGenerating2FA, setIsGenerating2FA] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setTwitter(user.socialLinks?.twitter || '');
      setGithub(user.socialLinks?.github || '');
      setWebsite(user.socialLinks?.website || '');
      setInstagram(user.socialLinks?.instagram || '');
      setIs2FAEnabled(user.is2FAEnabled || false);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await api.put('/users/profile', {
        displayName,
        bio,
        socialLinks: { twitter, github, website, instagram },
      });
      dispatch(updateUser(response.data));
      triggerToastSuccess('Your profile settings have been updated successfully.', 'Profile Saved');
    } catch (err) {
      triggerToastError(err.response?.data?.message || 'Failed to update profile.', 'Error Saving Profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetup2FA = async () => {
    setIsGenerating2FA(true);
    try {
      const response = await api.post('/auth/setup-2fa', { userId: user?.id });
      setTotpSecret(response.data.secret);
      setQrCodeUrl(response.data.qrCodePlaceholder);
    } catch (err) {
      triggerToastError('Could not initialize 2FA configuration.', 'Error');
    } finally {
      setIsGenerating2FA(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!verificationCode) return;
    try {
      const response = await api.post('/auth/toggle-2fa', {
        enable: true,
        code: verificationCode,
      });
      if (user) {
        dispatch(updateUser({ ...user, is2FAEnabled: true }));
      }
      setIs2FAEnabled(true);
      setTotpSecret('');
      setQrCodeUrl('');
      setVerificationCode('');
      triggerToastSuccess(response.data.message || '2FA successfully enabled!', 'Security Enabled');
    } catch (err) {
      triggerToastError(err.response?.data?.message || 'Invalid verification code.', 'Verification Failed');
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await api.post('/auth/toggle-2fa', {
        enable: false,
      });
      if (user) {
        dispatch(updateUser({ ...user, is2FAEnabled: false }));
      }
      setIs2FAEnabled(false);
      triggerToastSuccess(response.data.message || '2FA disabled successfully.', 'Security Deactivated');
    } catch (err) {
      triggerToastError('Failed to disable 2FA.', 'Error');
    }
  };

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security & 2FA', icon: <Shield className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-theme-bg p-8 text-theme-text font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {}
        <div className="flex items-center gap-3 justify-between border-b border-theme-border pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-theme-card-hover border border-theme-border rounded-md text-theme-accent transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
              <p className="text-xs text-theme-muted mt-0.5">Manage your credentials, personalization preferences, and security Relays</p>
            </div>
          </div>
        </div>

        {}
        <Tabs items={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {}
        <div className="mt-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Personalize how your profile is represented across collaborative channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Display Name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Major Tom"
                  />
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-semibold uppercase tracking-wider text-theme-muted">Biography / Status</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Relay commander on Nebula station..."
                      className="w-full bg-theme-bg border border-theme-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent text-theme-text placeholder:text-theme-muted/50 h-24 resize-none"
                    />
                  </div>

                  <div className="border-t border-theme-border pt-4 mt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-4">Social Accounts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        label="Twitter Profile"
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://twitter.com/username"
                      />
                      <Input
                        label="GitHub Profile"
                        type="text"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/username"
                      />
                      <Input
                        label="Website"
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                      />
                      <Input
                        label="Instagram Handle"
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@username"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" isLoading={isSaving}>
                    <Save className="w-4 h-4 mr-2" /> Save Profile Details
                  </Button>
                </CardFooter>
              </Card>
            </form>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                <CardDescription>Secure your relay connection tunnel using an Authenticator app (like Google Authenticator or Authy).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-theme-bg/40 border border-theme-border rounded-lg">
                  <div className="text-left">
                    <p className="text-sm font-semibold">2FA Security Status</p>
                    <p className="text-xs text-theme-muted mt-1">
                      {is2FAEnabled
                        ? '2FA is currently active on this channel. Access tokens require code validation.'
                        : '2FA is deactivated. It is highly recommended to activate this for administrators.'}
                    </p>
                  </div>
                  <div>
                    {is2FAEnabled ? (
                      <Button variant="danger" onClick={handleDisable2FA}>
                        Disable 2FA Security
                      </Button>
                    ) : (
                      !totpSecret && (
                        <Button variant="primary" onClick={handleSetup2FA} isLoading={isGenerating2FA}>
                          Setup Authenticator
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {totpSecret && (
                  <div className="p-6 bg-theme-bg/60 border border-theme-border rounded-lg space-y-6 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-theme-accent flex items-center gap-2">
                      <QrCode className="w-5 h-5" /> Scan QR Authenticator
                    </h4>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="p-4 bg-white rounded-lg border border-slate-200 shrink-0">
                        <img src={qrCodeUrl} alt="2FA Scan Code" className="w-36 h-36" />
                      </div>
                      
                      <div className="space-y-4 text-left">
                        <p className="text-xs leading-relaxed text-theme-text/90">
                          1. Scan the QR code or enter the manual key inside your authenticator app:<br />
                          <code className="bg-theme-bg border border-theme-border px-2 py-1 rounded text-xs select-all text-theme-accent font-mono block mt-1.5 max-w-xs truncate">
                            {totpSecret}
                          </code>
                        </p>
                        <p className="text-xs leading-relaxed text-theme-text/90">
                          2. Input the 6-digit confirmation code generated by your app below:
                        </p>
                        
                        <div className="flex gap-3 max-w-xs">
                          <Input
                            placeholder="123456"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="text-center font-mono text-base py-1.5"
                          />
                          <Button onClick={handleConfirm2FA}>
                            Verify <Check className="w-4 h-4 ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle>Interface & Theme Customization</CardTitle>
                <CardDescription>Adjust how Nebula elements are represented dynamically inside your browser viewport.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-left">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-theme-muted">Application Styling Presets</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { id: 'glassmorphism', name: 'Nebula Default' },
                      { id: 'amoled', name: 'AMOLED Black' },
                      { id: 'material', name: 'Material Slate' },
                      { id: 'cyberpunk', name: 'Cyberpunk Green' },
                      { id: 'neon', name: 'Cosmic Pink' },
                    ].map((t) => {
                      const isActive = theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => dispatch(setTheme(t.id))}
                          className={`p-4 border rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                            isActive
                              ? 'bg-theme-accent/15 border-theme-accent text-white font-bold ring-2 ring-theme-accent/25'
                              : 'bg-theme-card border-theme-border text-theme-muted hover:text-theme-text hover:border-theme-border-hover'
                          }`}
                        >
                          <span>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-theme-border pt-6 space-y-3">
                  <Input
                    label="Background Wallpaper Image Link"
                    type="text"
                    value={wallpaper}
                    onChange={(e) => dispatch(setWallpaper(e.target.value))}
                    placeholder="https://example.com/background.jpg"
                    helperText="Leave empty to display default design token system gradients."
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
