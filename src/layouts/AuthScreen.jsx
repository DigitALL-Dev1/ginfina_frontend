import { Alert, Anchor, Button, Center, Checkbox, Group, Image, Paper, PasswordInput, PinInput, Stack, Text, TextInput, Title, Box, LoadingOverlay } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { postJson } from '../services/apiClient';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function AuthScreen({ spec }) {
  const [step, setStep] = useState('signin'); // 'signin', 'forgot', 'new_password', 'mfa', 'success'
  const [email, setEmail] = useState('zain.israr@greendigital.com');
  const [password, setPassword] = useState('DemoOnly!');
  
  // Forgot Password / Reset Password state variables
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');

  // Trigger password-reset view if token parameter exists in URL query
  useEffect(() => {
    if (urlToken) {
      setStep('new_password');
    }
  }, [urlToken]);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await postJson('/auth/forgot-password', {
        email: forgotEmail
      });
      notifications.show({
        title: 'Recovery Link Sent',
        message: response.message || 'Check your inbox for password reset instructions.',
        color: 'green'
      });
      setStep('signin');
    } catch (err) {
      notifications.show({
        title: 'Reset Link Error',
        message: err.message || 'Email address not found in the system.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notifications.show({
        title: 'Password Mismatch',
        message: 'The confirmed password does not match the new password.',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await postJson('/auth/reset-password', {
        token: urlToken,
        new_password: newPassword
      });
      notifications.show({
        title: 'Password Reset Successful',
        message: response.message || 'Your password has been updated. You can now log in.',
        color: 'green'
      });
      // Clear token from URL query params
      navigate('/ginfina/login', { replace: true });
      setStep('signin');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      notifications.show({
        title: 'Password Reset Failed',
        message: err.message || 'Invalid or expired password reset link.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const response = await postJson('/auth/login', { 
        email: email, 
        username: email,
        password: password 
      });

      if (response && response.mfa_required) {
        setTempToken(response.temp_token);
        notifications.show({
          title: 'MFA Required',
          message: response.message || 'A verification code has been sent to your email.',
          color: 'blue'
        });
        setStep('mfa');
      } else {
        setStep('success');
      }
    } catch (err) {
      notifications.show({
        title: 'Authentication Failed',
        message: err.message || 'Invalid username or password.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (codeValue) => {
    const activeCode = codeValue || mfaCode;
    if (!activeCode || activeCode.length < 6) return;

    setLoading(true);
    try {
      const response = await postJson('/auth/verify-mfa', {
        code: activeCode,
        temp_token: tempToken
      });
      if (response && response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('user_name', response.name);
        localStorage.setItem('user_id', response.user_id);
        navigate('/ginfina', { replace: true });
      }
      setStep('success');
    } catch (err) {
      notifications.show({
        title: 'Verification Failed',
        message: err.message || 'Invalid verification code.',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Slanted gradient background on the right half */}
      <div className="auth-diagonal-bg" />

      {/* Top right language & help support */}
      <div className="auth-header-help">
        English | <Anchor href="#" size="sm" c="dimmed" style={{ textDecoration: 'none' }}>Need help?</Anchor>
      </div>

      {/* Left panel: branding / message */}
      <div className="auth-left-panel">
        <Image 
          src="/green-logo.png" 
          alt="GREEN Future: Envisioned" 
          h={68} 
          w="auto" 
          fit="contain" 
          style={{ alignSelf: 'flex-start' }}
        />

        <div style={{ margin: '60px 0' }}>
          <Title order={1} size="34px" fw={700} style={{ color: '#212529', lineHeight: 1.2 }}>
            GINFINA Engineering Workbench
          </Title>
          <Text fw={700} size="md" style={{ color: '#22a648', marginTop: '12px' }}>
            Engineering Governance. Integrity. Intelligence.
          </Text>
          <Text size="sm" style={{ color: '#667085', marginTop: '24px', maxWidth: '420px', lineHeight: 1.6 }}>
            A unified platform for controlled engineering execution, consultant collaboration and evidence-led delivery.
          </Text>
        </div>

        <Group gap="xl" className="auth-left-features">
          <Text size="sm" fw={700} style={{ color: '#007336' }}>Secure</Text>
          <Text size="sm" fw={700} style={{ color: '#007336' }}>Governed</Text>
          <Text size="sm" fw={700} style={{ color: '#007336' }}>Integrated</Text>
        </Group>
      </div>

      {/* Right panel: auth card container */}
      <div className="auth-right-panel">
        <Paper className="auth-brand-card" style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} overlayProps={{ blur: 1 }} />
          <Stack gap="md">
            {/* Common Header inside Card */}
            <div>
              <div className="auth-card-logo-text">GINFINA</div>
              <div className="auth-card-logo-sub">Engineering Workbench</div>
            </div>

            {/* Step 1: Sign In */}
            {step === 'signin' && (
              <form onSubmit={handleSignIn}>
                <Stack gap="md">
                  <div style={{ textAlign: 'center' }}>
                    <Title order={2} size="22px" fw={700} style={{ color: '#212529' }}>Welcome back</Title>
                    <Text size="xs" c="dimmed" style={{ marginTop: '6px' }}>
                      Sign in to continue to your controlled engineering workspace.
                    </Text>
                  </div>

                  <TextInput
                    label="Email or Username"
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="sm"
                  />

                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="sm"
                  />

                  <Group justify="space-between" style={{ fontSize: '13px' }}>
                    <Checkbox label="Keep me signed in" size="xs" defaultChecked />
                    <Anchor 
                      size="xs" 
                      fw={700} 
                      style={{ color: '#22a648' }} 
                      onClick={() => setStep('forgot')}
                    >
                      Forgot password?
                    </Anchor>
                  </Group>

                  <Button 
                    type="submit" 
                    fullWidth 
                    size="md" 
                    style={{ backgroundColor: '#22a648', marginTop: '8px' }}
                  >
                    Sign In
                  </Button>

                  <Button
                    variant="default"
                    fullWidth
                    size="md"
                    onClick={() => {
                      setEmail('zain.israr@greendigital.com');
                      handleSignIn();
                    }}
                    styles={{ inner: { color: '#4F5E54', fontWeight: 600 } }}
                  >
                    <GoogleIcon />
                    Sign in with Google
                  </Button>
                </Stack>
              </form>
            )}

            {/* Step 2: Request Reset Link */}
            {step === 'forgot' && (
              <form onSubmit={handleSendReset}>
                <Stack gap="md">
                  <div style={{ textAlign: 'center' }}>
                    <Title order={2} size="22px" fw={700} style={{ color: '#212529' }}>Reset password</Title>
                    <Text size="xs" c="dimmed" style={{ marginTop: '6px' }}>
                      Enter your registered email to request a controlled reset link.
                    </Text>
                  </div>

                  <TextInput
                    label="Registered Email"
                    placeholder="name@company.com"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    size="sm"
                  />

                  <Button 
                    type="submit" 
                    fullWidth 
                    size="md" 
                    style={{ backgroundColor: '#22a648', marginTop: '8px' }}
                  >
                    Send Reset Link
                  </Button>

                  <Anchor 
                    size="xs" 
                    fw={700} 
                    style={{ color: '#22a648', display: 'block', textAlign: 'center', marginTop: '4px' }}
                    onClick={() => setStep('signin')}
                  >
                    Back to Sign In
                  </Anchor>
                </Stack>
              </form>
            )}

            {/* Step 3: Enter New Password (using link token) */}
            {step === 'new_password' && (
              <form onSubmit={handleResetPasswordSubmit}>
                <Stack gap="md">
                  <div style={{ textAlign: 'center' }}>
                    <Title order={2} size="22px" fw={700} style={{ color: '#212529' }}>Create new password</Title>
                    <Text size="xs" c="dimmed" style={{ marginTop: '6px' }}>
                      Choose a secure new password for your GINFINA account.
                    </Text>
                  </div>

                  <PasswordInput
                    label="New Password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    size="sm"
                  />

                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    size="sm"
                  />

                  <Button 
                    type="submit" 
                    fullWidth 
                    size="md" 
                    style={{ backgroundColor: '#22a648', marginTop: '8px' }}
                  >
                    Reset Password
                  </Button>

                  <Anchor 
                    size="xs" 
                    fw={700} 
                    style={{ color: '#22a648', display: 'block', textAlign: 'center', marginTop: '4px' }}
                    onClick={() => {
                      navigate('/ginfina/login', { replace: true });
                      setStep('signin');
                    }}
                  >
                    Back to Sign In
                  </Anchor>
                </Stack>
              </form>
            )}

            {/* Step 4: MFA verification */}
            {step === 'mfa' && (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyMfa(); }}>
                <Stack gap="md">
                  <div style={{ textAlign: 'center' }}>
                    <Title order={2} size="22px" fw={700} style={{ color: '#212529' }}>Verify your sign-in</Title>
                    <Text size="xs" c="dimmed" style={{ marginTop: '6px' }}>
                      Enter the 6-digit verification code.
                    </Text>
                  </div>

                  <Center style={{ margin: '10px 0' }}>
                    <PinInput 
                      length={6} 
                      size="md" 
                      placeholder="•" 
                      type="number"
                      autoFocus
                      value={mfaCode}
                      onChange={setMfaCode}
                      onComplete={(val) => handleVerifyMfa(val)}
                    />
                  </Center>

                  <Box 
                    p="xs" 
                    style={{ 
                      backgroundColor: '#EAF5EF', 
                      border: '1px solid #D9EDE2', 
                      borderRadius: '6px' 
                    }}
                  >
                    <Text size="xs" fw={600} style={{ color: '#007336', textAlign: 'center', lineHeight: 1.4 }}>
                      MFA required for privileged and external consultant access.
                    </Text>
                  </Box>

                  <Button 
                    type="submit" 
                    fullWidth 
                    size="md" 
                    style={{ backgroundColor: '#22a648', marginTop: '8px' }}
                  >
                    Verify & Continue
                  </Button>
                </Stack>
              </form>
            )}

            {/* Step 5: Access verified */}
            {step === 'success' && (
              <Stack gap="md">
                <div style={{ textAlign: 'center' }}>
                  <Title order={2} size="22px" fw={700} style={{ color: '#212529' }}>Access verified</Title>
                </div>

                <Center style={{ margin: '10px 0' }}>
                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#22A648" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </Center>

                <Box style={{ margin: '8px 0 16px' }}>
                  <Text size="xs" fw={700} style={{ color: '#007336', textAlign: 'center', lineHeight: 1.4 }}>
                    RBAC, ABAC and project scope are applied before routing.
                  </Text>
                </Box>

                <Button 
                  fullWidth 
                  size="md" 
                  style={{ backgroundColor: '#22a648' }}
                  onClick={() => navigate('/ginfina/workbench')}
                >
                  Continue to GINFINA
                </Button>
              </Stack>
            )}
          </Stack>
        </Paper>
      </div>
    </div>
  );
}
