import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Instagram, ArrowLeft, ShieldCheck, Sparkles, HardDrive } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Login() {
  const navigate = useNavigate();

  const handleInstagramLogin = () => {
    // Navigate to setup for onboarding or dashboard directly
    navigate('/setup');
  };

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex font-sans antialiased selection:bg-zinc-800" id="login-root">
      {/* Back to landing */}
      <div className="absolute top-6 left-6 z-35">
        <Link to="/" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 grid lg:grid-cols-12 overflow-hidden h-screen">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-zinc-950 border-r border-zinc-900/40 relative">
          <div className="max-w-md w-full mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tight shadow-md">
                  RP
                </div>
                <span className="font-semibold tracking-tight text-sm text-zinc-200">ReelPilot</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50 mt-4">Welcome to ReelPilot</h1>
              <p className="text-sm text-zinc-400">
                Log in or register your account to begin auto-publishing Reels.
              </p>
            </div>

            {/* Social Auth Action */}
            <Card className="border-zinc-900 bg-zinc-900/10">
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={handleInstagramLogin}
                  className="w-full font-semibold bg-[#E1306C] hover:bg-[#C13584] text-white border-none py-2.5 shadow-md shadow-pink-500/10"
                  leftIcon={<Instagram className="h-4.5 w-4.5" />}
                >
                  Continue with Instagram
                </Button>
                
                <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                  Authentication is managed securely via official Meta partner OAuth protocols. We never see or store your Instagram password.
                </p>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="flex items-start gap-3 bg-zinc-900/30 border border-zinc-850 p-4 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-zinc-300">Secure API Authentication</p>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  ReelPilot complies strictly with Google Drive Security Guidelines and Meta App Review rules. You can revoke access at any time directly through your Google or Instagram settings panel.
                </p>
              </div>
            </div>

            {/* Terms Footer */}
            <p className="text-[11px] text-zinc-600 text-center">
              By continuing, you agree to ReelPilot's{' '}
              <a href="#" className="underline hover:text-zinc-500 transition-colors">Terms of Service</a> and{' '}
              <a href="#" className="underline hover:text-zinc-500 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* Right Illustration Panel */}
        <div className="hidden lg:col-span-7 bg-[#0b0b0e] lg:flex flex-col justify-between p-12 relative overflow-hidden">
          {/* Gradients decorations */}
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-900/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-zinc-900/10 blur-[100px] pointer-events-none" />

          {/* Top Info */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Sparkles className="h-4 w-4 text-zinc-400" />
            <span>Active Creator Accounts publish 4.5x more content</span>
          </div>

          {/* Graphical Representation */}
          <div className="my-auto max-w-xl mx-auto w-full">
            <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 shadow-2xl">
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-950 p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-300">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Google Drive: Reels_Folder</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Auto-checks active every 15m</p>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-[#E1306C]/10 text-[#E1306C] rounded text-[10px] font-bold">MP4</span>
                      <span className="text-zinc-400 font-mono">travel_vlog_paris.mp4</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">18.4 MB</span>
                  </div>
                  <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold">TXT</span>
                      <span className="text-zinc-400 font-mono">travel_vlog_paris.txt</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">Caption Linked</span>
                  </div>
                </div>

                <div className="h-px bg-zinc-900" />

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-zinc-500">Scheduled for Today, 18:00 UTC</span>
                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-medium">
                    Ready to Publish
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Testimonial */}
          <div className="max-w-md">
            <p className="text-sm font-medium text-zinc-300 leading-relaxed italic">
              "ReelPilot allowed us to organize our video pipeline in Google Drive and schedule 30 days of Reels in 10 minutes. The direct API publish is super smooth."
            </p>
            <p className="text-xs text-zinc-500 mt-2 font-semibold">
              — Content Director, Apex Media Agency
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
