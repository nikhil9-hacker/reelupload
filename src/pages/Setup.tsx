import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Instagram,
  HardDrive,
  Folder,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FolderCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { getInstagramAccount, saveInstagramAccount, ExtendedInstagramAccount } from '../lib/instagramState';

const getSessionId = (): string => {
  let id = sessionStorage.getItem('reelpilot_session_id');
  if (!id) {
    id = 'sess-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('reelpilot_session_id', id);
  }
  return id;
};

const fetchWithSession = (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers || {});
  headers.set('x-session-id', getSessionId());
  return fetch(url, { ...options, headers });
};

export default function Setup() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [instagramAccount, setInstagramAccount] = useState<ExtendedInstagramAccount | null>(null);
  const instagramConnected = !!instagramAccount;
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  
  const [googleAccount, setGoogleAccount] = useState<{ email: string; isConnected: boolean; folderId?: string; folderName?: string } | null>(null);
  const googleConnected = !!googleAccount;
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const checkInstagramStatus = async (): Promise<boolean> => {
    try {
      const res = await fetchWithSession('/api/v1/auth/instagram/status');
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data || payload;
        if (data.instagramConnected) {
          const accountData = {
            id: 'instagram-linked-user',
            username: data.username || 'connected_account',
            fullName: data.accountName || 'Instagram Professional',
            profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
            followersCount: 1240,
            facebookPage: 'Linked Business Page',
            isConnected: true,
            connectedAt: new Date().toISOString()
          };
          saveInstagramAccount(accountData);
          setInstagramAccount(accountData);
          return true;
        }
      }
    } catch (err) {
      console.warn('Failed querying Instagram connection status:', err);
    }
    return false;
  };

  const checkGoogleStatus = async (): Promise<boolean> => {
    try {
      const res = await fetchWithSession('/api/v1/google/status');
      if (res.ok) {
        const payload = await res.json();
        const data = payload.data || payload;
        if (data.googleConnected) {
          const accountData = {
            email: data.email,
            isConnected: true,
            folderId: data.folderId || undefined,
            folderName: data.folderName || undefined,
          };
          localStorage.setItem('reelpilot_google_account', JSON.stringify(accountData));
          setGoogleAccount(accountData);
          return true;
        } else {
          localStorage.removeItem('reelpilot_google_account');
          setGoogleAccount(null);
        }
      }
    } catch (err) {
      console.warn('Failed querying Google connection status:', err);
    }
    return false;
  };

  // Sync state from local storage and backend connection status on load
  useEffect(() => {
    const handleAccountChange = () => {
      setInstagramAccount(getInstagramAccount());
    };
    window.addEventListener('instagram-account-changed', handleAccountChange);
    
    // Check if redirect returned from OAuth flow directly (Buffer style redirect)
    const hasIgConnected = window.location.hash.includes('instagram=connected') || window.location.search.includes('instagram=connected');
    if (hasIgConnected) {
      checkInstagramStatus().then((isConnected) => {
        if (isConnected) {
          setCurrentStep(2);
        }
      });
    } else {
      checkInstagramStatus();
    }

    checkGoogleStatus();

    // Dynamically inject Google Picker API client script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi?.load('picker', () => {
        console.log('Google Picker API library loaded.');
      });
    };
    document.body.appendChild(script);

    return () => {
      window.removeEventListener('instagram-account-changed', handleAccountChange);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Listen for callback event messages from popup windows (Meta & Google)
  useEffect(() => {
    const handleOAuthResult = (result: { type: string; success: boolean; account?: any; error?: string }) => {
      if (
        (result.type === 'INSTAGRAM_CONNECTED' && result.success) ||
        result.type === 'OAUTH_AUTH_SUCCESS'
      ) {
        checkInstagramStatus().then((isConnected) => {
          setIsConnectingInstagram(false);
          if (isConnected) {
            setTimeout(() => { setCurrentStep(2); }, 1200);
          } else {
            const authorizedAccount = result.account as ExtendedInstagramAccount;
            if (authorizedAccount) {
              saveInstagramAccount(authorizedAccount);
              setInstagramAccount(authorizedAccount);
              setTimeout(() => { setCurrentStep(2); }, 1200);
            }
          }
        });
      } else if (result.type === 'INSTAGRAM_FAILED' || (result.type === 'INSTAGRAM_CONNECTED' && !result.success)) {
        setIsConnectingInstagram(false);
      } else if (result.type === 'GOOGLE_AUTH_SUCCESS') {
        checkGoogleStatus().then((isConnected) => {
          setIsConnectingGoogle(false);
          if (isConnected) {
            setTimeout(() => { setCurrentStep(3); }, 1200);
          } else {
            const email = result.account?.email;
            const newAccount = { email, isConnected: true };
            localStorage.setItem('reelpilot_google_account', JSON.stringify(newAccount));
            setGoogleAccount(newAccount);
            setTimeout(() => { setCurrentStep(3); }, 1200);
          }
        });
      } else if (result.type === 'GOOGLE_AUTH_FAILED') {
        setIsConnectingGoogle(false);
      }
    };

    // Method 1: postMessage (works when window.opener is available)
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Allow Railway, localhost, and aistudio origins
      const isAllowed =
        origin.includes('railway.app') ||
        origin.includes('localhost') ||
        origin.includes('aistudio') ||
        origin.includes('.run.app') ||
        origin.includes('reelupload');
      if (!isAllowed) return;

      if (event.data?.type) {
        handleOAuthResult({
          type: event.data.type,
          success: event.data.success,
          account: event.data.account,
          error: event.data.error,
        });
      }
    };

    // Method 2: localStorage polling (fallback when Instagram clears window.opener)
    const lastProcessedTs = { value: 0 };
    const storageInterval = setInterval(() => {
      try {
        const raw = localStorage.getItem('reelpilot_oauth_result');
        if (!raw) return;
        const result = JSON.parse(raw);
        if (result.ts && result.ts > lastProcessedTs.value) {
          lastProcessedTs.value = result.ts;
          localStorage.removeItem('reelpilot_oauth_result');
          handleOAuthResult(result);
        }
      } catch (e) {}
    }, 500);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(storageInterval);
    };
  }, []);




  const [isFinishing, setIsFinishing] = useState(false);

  const handleConnectInstagram = async () => {
    setIsConnectingInstagram(true);

    const w = 580;
    const h = 680;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    // Open popup synchronously immediately to satisfy browser security policies
    const popup = window.open(
      'about:blank',
      'Meta_OAuth_Handshake',
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      setIsConnectingInstagram(false);
      alert('Popup was blocked! Please allow popups/redirects for this site to link Instagram.');
      return;
    }
    
    try {
      // Query server to generate authorized OAuth URL
      const originUrl = window.location.origin;
      const res = await fetchWithSession(`/api/v1/auth/instagram?origin=${encodeURIComponent(originUrl)}`);
      
      if (!res.ok) {
        throw new Error('Failed generating auth payload from server.');
      }

      const responsePayload = await res.json();
      const data = responsePayload.data || responsePayload;

      if (data.url) {
        popup.location.href = data.url;
      } else {
        throw new Error(data.message || 'No redirect URL returned by server.');
      }
    } catch (err: any) {
      popup.close();
      alert(`Instagram Connection Error: ${err.message || err}`);
      setIsConnectingInstagram(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);

    const w = 600;
    const h = 700;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const popup = window.open(
      'about:blank',
      'Google_OAuth_Login',
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      setIsConnectingGoogle(false);
      alert('Popup was blocked! Please enable popups/redirects for this site to link Google.');
      return;
    }

    try {
      const originUrl = window.location.origin;
      const res = await fetchWithSession(`/api/v1/google/auth?origin=${encodeURIComponent(originUrl)}`);
      
      if (!res.ok) {
        throw new Error('Failed generating Google auth URL.');
      }

      const responsePayload = await res.json();
      const data = responsePayload.data || responsePayload;
      
      if (data.url) {
        popup.location.href = data.url;
      } else {
        throw new Error(data.message || 'No Google auth URL returned by server.');
      }
    } catch (err: any) {
      popup.close();
      alert(`Google Connection Error: ${err.message || err}`);
      setIsConnectingGoogle(false);
    }
  };

  const handleOpenGooglePicker = async () => {
    try {
      const tokenRes = await fetchWithSession('/api/v1/google/token');
      if (!tokenRes.ok) {
        alert('Google Drive account is not connected. Please connect it first.');
        return;
      }
      const tokenPayload = await tokenRes.json();
      const tokenData = tokenPayload.data || tokenPayload;
      const accessToken = tokenData.accessToken;

      if (!accessToken) {
        alert('Unable to retrieve access token. Re-link Google Account.');
        return;
      }

      const gapi = (window as any).gapi;
      if (!gapi || !gapi.picker) {
        alert('Google Picker API library is not loaded. Try again or check network.');
        return;
      }

      const folderView = new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.FOLDERS)
        .setMimeTypes('application/vnd.google-apps.folder')
        .setSelectFolderEnabled(true);

      const picker = new (window as any).google.picker.PickerBuilder()
        .addView(folderView)
        .setOAuthToken(accessToken)
        .setCallback(async (data: any) => {
          if (data[(window as any).google.picker.Response.ACTION] === (window as any).google.picker.Action.PICKED) {
            const doc = data[(window as any).google.picker.Response.DOCUMENTS][0];
            const folderId = doc[(window as any).google.picker.Document.ID];
            const folderName = doc[(window as any).google.picker.Document.NAME];
            
            await handleFolderSelect(folderId, folderName);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.warn('Error opening Google Picker in Setup:', err);
    }
  };

  const handleFolderSelect = async (folderId: string, folderName: string) => {
    setSelectedFolder(folderId);

    try {
      await fetchWithSession('/api/v1/google/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId, folderName }),
      });
    } catch (err) {
      console.warn('Folder selection sync failed:', err);
    }

    const currentAcc = googleAccount || { email: 'connected_account@gmail.com', isConnected: true };
    const updated = { ...currentAcc, folderId, folderName };
    localStorage.setItem('reelpilot_google_account', JSON.stringify(updated));
    setGoogleAccount(updated);
  };

  const handleNextStep = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinishing(true);
      try {
        const finishRes = await fetchWithSession('/api/v1/auth/onboarding/finish', {
          method: 'POST',
        });
        if (!finishRes.ok) {
          const errPayload = await finishRes.json();
          throw new Error(errPayload.message || 'Failed to complete setup on server.');
        }
        navigate('/dashboard');
      } catch (err: any) {
        alert(err.message || err);
      } finally {
        setIsFinishing(false);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: 'Instagram Account' },
    { number: 2, title: 'Google Drive' },
    { number: 3, title: 'Choose Folder' },
    { number: 4, title: 'Finish' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800" id="setup-page-root">
      {/* Header */}
      <header className="h-16 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between px-6 sm:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tight">
            RP
          </div>
          <span className="font-semibold tracking-tight text-sm text-zinc-200">ReelPilot Setup</span>
        </div>
        <span className="text-xs text-zinc-500 font-medium">Onboarding flow</span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl w-full mx-auto relative z-10">
        {/* Progress Tracker */}
        <div className="w-full mb-10">
          <div className="flex items-center justify-between">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center relative flex-1 last:flex-initial">
                {/* Step Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 relative z-10 ${
                    currentStep === s.number
                      ? 'bg-zinc-50 text-zinc-950 border-zinc-50 shadow-md shadow-zinc-50/10'
                      : s.number < currentStep
                      ? 'bg-zinc-900 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-900'
                  }`}
                >
                  {s.number < currentStep ? <Check className="h-4 w-4" /> : s.number}
                </div>
                
                {/* Step Label */}
                <span
                  className={`text-[10px] font-medium mt-2 transition-colors ${
                    currentStep === s.number ? 'text-zinc-200 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  {s.title}
                </span>

                {/* Connecting Line */}
                {s.number < steps.length && (
                  <div
                    className="absolute top-4.5 left-1/2 w-full h-px bg-zinc-900 -z-0"
                    style={{
                      backgroundColor: s.number < currentStep ? '#10b98120' : '',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Card Wrapper */}
        <div className="w-full min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Card className="border-zinc-900 bg-zinc-900/10">
                  <CardHeader>
                    <CardTitle>Connect Instagram Business</CardTitle>
                    <CardDescription>
                      To publish Reels automatically, link your Instagram Professional/Business account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col items-center text-center">
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[#E1306C] mb-4">
                        <Instagram className="h-8 w-8" />
                      </div>
                      
                      {instagramConnected && instagramAccount ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-zinc-100 flex items-center justify-center gap-1.5 animate-pulse">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            Connected as @{instagramAccount.username}
                          </p>
                          <p className="text-xs text-zinc-500">Instagram Business Account active & bull; {instagramAccount.followersCount?.toLocaleString()} followers</p>
                        </div>
                      ) : (
                        <div className="space-y-4 w-full max-w-xs">
                          <p className="text-xs text-zinc-400">Not connected yet</p>
                          <Button
                            onClick={handleConnectInstagram}
                            isLoading={isConnectingInstagram}
                            variant="secondary"
                            className="w-full text-xs"
                            leftIcon={<Instagram className="h-4 w-4" />}
                          >
                            Authorize Instagram via Meta
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Card className="border-zinc-900 bg-zinc-900/10">
                  <CardHeader>
                    <CardTitle>Connect Google Drive</CardTitle>
                    <CardDescription>
                      Grant read-only access to select and monitor your designated Reel folder.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="rounded-xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col items-center text-center">
                      <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-300 mb-4">
                        <HardDrive className="h-8 w-8" />
                      </div>

                      {googleConnected ? (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-zinc-100 flex items-center justify-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            Google Drive Connected
                          </p>
                          <p className="text-xs text-zinc-500">{googleAccount?.email}</p>
                        </div>
                      ) : (
                        <div className="space-y-4 w-full max-w-xs">
                          <p className="text-xs text-zinc-400">Not connected yet</p>
                          <Button
                            onClick={handleConnectGoogle}
                            isLoading={isConnectingGoogle}
                            variant="secondary"
                            className="w-full text-xs"
                            leftIcon={<HardDrive className="h-4 w-4" />}
                          >
                            Authorize Google Account
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Card className="border-zinc-900 bg-zinc-900/10">
                  <CardHeader>
                    <CardTitle>Select Synced Folder</CardTitle>
                    <CardDescription>
                      Choose the Google Drive folder that ReelPilot will monitor for MP4 and TXT files.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="flex flex-col items-center justify-center py-6 border border-dashed border-zinc-800 rounded-xl space-y-4 bg-zinc-950/20">
                      <Button
                        onClick={handleOpenGooglePicker}
                        variant="secondary"
                        size="sm"
                        leftIcon={<Folder className="h-4 w-4" />}
                      >
                        {selectedFolder ? 'Change Sync Folder' : 'Launch Google Picker'}
                      </Button>
                      {selectedFolder && (
                        <div className="text-center">
                          <p className="text-xs text-zinc-300">
                            Selected: <strong className="text-zinc-100">{googleAccount?.folderName || selectedFolder}</strong>
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">ID: {selectedFolder}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Card className="border-zinc-900 bg-zinc-900/10">
                  <CardHeader className="text-center">
                    <div className="mx-auto p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-emerald-400 w-fit mb-4">
                      <FolderCheck className="h-8 w-8" />
                    </div>
                    <CardTitle>Configuration Complete</CardTitle>
                    <CardDescription>
                      You are completely set up and ready to autopilot your Reel publishing pipeline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 text-center space-y-4">
                    <div className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      ReelPilot will now perform its first initial folder scan in the background. Feel free to monitor status, calendar, and uploads directly from your new creator dashboard.
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation controls */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="text-xs"
            >
              Back
            </Button>

            <Button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !instagramConnected) ||
                (currentStep === 2 && !googleConnected) ||
                (currentStep === 3 && !selectedFolder)
              }
              isLoading={isFinishing}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="text-xs"
            >
              {currentStep === 4 ? 'Finish Setup' : 'Next Step'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
