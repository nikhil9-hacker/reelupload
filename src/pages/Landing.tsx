import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  Shield,
  CheckCircle2,
  ChevronDown,
  Instagram,
  HardDrive,
  Clock,
  Play,
  Check,
  Cpu,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export default function Landing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    {
      icon: HardDrive,
      title: 'Google Drive Active Sync',
      description: 'Simply upload MP4 videos and TXT captions in pairs. ReelPilot detects and processes them immediately.',
    },
    {
      icon: Instagram,
      title: 'Official Meta Graph API',
      description: 'Your account is secure. We use official Meta OAuth and API protocols to publish safely without flags.',
    },
    {
      icon: Clock,
      title: 'Precision Scheduling',
      description: 'Specify publication times using flexible rules or direct calendar scheduling. We handle the rest.',
    },
    {
      icon: Cpu,
      title: 'Smart Caption Parser',
      description: 'Extract description, hashtags, and settings dynamically from companion TXT files next to your videos.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect Instagram & Google Drive',
      description: 'Grant secure permissions via official Meta and Google integrations in less than 60 seconds.',
    },
    {
      number: '02',
      title: 'Designate Your Reel Folder',
      description: 'Select the Google Drive folder where you store your video exports and text files.',
    },
    {
      number: '03',
      title: 'Drop Files & Set Caption Pairs',
      description: 'Upload a `my_video.mp4` paired with `my_video.txt`. The companion TXT acts as the automated caption.',
    },
    {
      number: '04',
      title: 'Autopilot Publishing',
      description: 'ReelPilot monitors changes, schedules publications, and publishes directly to Instagram Reels.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: isAnnual ? '19' : '29',
      description: 'Perfect for solo creators starting their automation journey.',
      features: [
        '1 Instagram Business Account',
        '1 Synced Google Drive Folder',
        'Up to 30 Reels / month',
        'Companion TXT captions support',
        'Standard processing queue',
      ],
      cta: 'Start piloting',
      popular: false,
    },
    {
      name: 'Pro',
      price: isAnnual ? '49' : '59',
      description: 'Ideal for professional creators and growing brands.',
      features: [
        '3 Instagram Business Accounts',
        'Unlimited Google Drive Folders',
        'Unlimited automated Reels',
        'Priority high-speed upload queue',
        'Logs and performance metrics',
        'Priority support',
      ],
      cta: 'Go Pro',
      popular: true,
    },
    {
      name: 'Agency',
      price: isAnnual ? '129' : '149',
      description: 'Built for agencies and multi-account managers.',
      features: [
        '10 Instagram Business Accounts',
        'Unlimited Google Drive Folders',
        'Unlimited automated Reels',
        'Dedicated high-speed upload queue',
        'Comprehensive log histories',
        'Dedicated account representative',
        'Early access to new features',
      ],
      cta: 'Contact Agency sales',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'How does the auto-publishing process work?',
      answer: 'ReelPilot runs a background worker that monitors your selected Google Drive folder. Whenever you add an `.mp4` video file paired with a `.txt` text file of the same name (e.g. `reel_1.mp4` and `reel_1.txt`), we parse the TXT file for captions/hashtags and schedule the MP4 for automated publishing to Instagram Reels using the official Meta API.',
    },
    {
      question: 'Is my Instagram account safe from bans or flags?',
      answer: 'Yes! ReelPilot uses the official, direct Meta Graph API. We never request your password, use unofficial scrapers, or emulate mobile apps. Your integration is 100% compliant with Meta terms of service, which keeps your account safe.',
    },
    {
      question: 'Do I need to leave my computer on?',
      answer: 'No. Everything is cloud-hosted on our fast and secure server. Once you connect your Google Drive and Instagram, you can close your tab, shut down your computer, or publish from your phone. Our background worker works 24/7.',
    },
    {
      question: 'How do I specify scheduling times?',
      answer: 'You can write timestamps directly inside your companion `.txt` files (e.g. `publish_at: 2026-07-25 15:30`), or schedule them visually using our interactive dashboard calendar inside ReelPilot.',
    },
    {
      question: 'What video file formats are supported?',
      answer: 'Currently we support standard H.264 MP4 videos up to 100MB, which is the official limit specified by the Meta API for Instagram Reels publishing.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-50 overflow-x-hidden">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#070709]/80 backdrop-blur-md border-b border-zinc-900/40 px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tight shadow-md">
            RP
          </div>
          <span className="font-semibold tracking-tight text-sm text-zinc-100">ReelPilot</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" size="sm">Log In</Button>
          </Link>
          <Link to="/login">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 lg:px-12 flex flex-col items-center text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400 mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
          <span>Automate Your Reel Workflow Instantly</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-50 leading-[1.1] max-w-3xl"
        >
          Auto publish Instagram Reels directly from <span className="text-zinc-400 font-medium">Google Drive</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed"
        >
          No manual upload fatigue. Drop video files and captions into your Drive folder. ReelPilot handles the scheduling and automated publishing using official API pathways.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto font-medium" rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
              Start for free
            </Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto font-medium" leftIcon={<Play className="h-4 w-4 fill-current" />}>
              See how it works
            </Button>
          </a>
        </motion.div>
      </section>

      {/* Product Preview */}
      <section className="px-6 lg:px-12 pb-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-2 shadow-2xl shadow-black/80"
        >
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 overflow-hidden aspect-[16/10] flex flex-col">
            {/* Window control decoration */}
            <div className="h-10 border-b border-zinc-900 bg-zinc-950/80 px-4 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-800" />
                <span className="w-3 h-3 rounded-full bg-zinc-800" />
                <span className="w-3 h-3 rounded-full bg-zinc-800" />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">reelpilot.app/dashboard</span>
              <span className="w-12" />
            </div>
            
            {/* Product UI layout */}
            <div className="flex-1 bg-zinc-950 p-6 flex flex-col justify-center items-center">
              <div className="max-w-md text-center">
                <div className="inline-flex gap-4 items-center justify-center mb-6">
                  <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-md">
                    <HardDrive className="h-8 w-8 text-zinc-300" />
                  </div>
                  <div className="h-0.5 w-12 bg-zinc-800 border-dashed border-t" />
                  <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-md">
                    <Instagram className="h-8 w-8 text-zinc-300" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-200">Sync Active & Scheduled</h3>
                <p className="text-xs text-zinc-500 mt-2">
                  ReelPilot acts as a secure container bridge linking your Google Drive video vaults with official Instagram publishing terminals.
                </p>
                <div className="mt-6 flex flex-col gap-2 max-w-sm mx-auto text-left">
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-zinc-300">📁 Google Folder: `Reels_Autopilot`</span>
                    <span className="text-emerald-400 font-medium">Linked</span>
                  </div>
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-zinc-300">📸 Instagram: `@theme_page_reels`</span>
                    <span className="text-emerald-400 font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 lg:px-12 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Engineered for serious creator workflows</h2>
            <p className="text-sm text-zinc-500 mt-4 leading-relaxed">
              No workarounds, cell-phone mirroring hacks, or risky unofficial scrapers. Build your organic presence safely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Card key={i} className="hover:bg-zinc-900/30">
                  <CardContent className="p-8">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-300 w-fit mb-6">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Simple 4-Step Setup</h2>
          <p className="text-sm text-zinc-500 mt-4 leading-relaxed">
            Configure once. Publish forever. Save dozens of hours of manual upload fatigue every week.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col p-6 rounded-xl border border-zinc-900 bg-zinc-950/40">
              <span className="text-3xl font-extrabold text-zinc-800/80 mb-4 font-mono">{step.number}</span>
              <h3 className="text-sm font-bold text-zinc-200 tracking-tight">{step.title}</h3>
              <p className="text-xs text-zinc-500 mt-2.5 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-6 lg:px-12 border-t border-zinc-900 bg-zinc-900/10">
        <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/20 p-8 sm:p-12 flex flex-col sm:flex-row gap-8 items-center">
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-300 flex-shrink-0">
            <Shield className="h-10 w-10 text-zinc-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Enterprise-grade security is our default</h2>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
              We operate exclusively through official Meta and Google partner OAuth connections. Your account credentials never touch our database. All data tokens are encrypted with military-grade AES-256 protocols, ensuring your intellectual property and social accounts remain fully protected.
            </p>
            <div className="flex gap-4 mt-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                Meta Approved API
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                Google OAuth Secured
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                Encrypted Storage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">Simple, transparent pricing</h2>
          <p className="text-sm text-zinc-500 mt-4 leading-relaxed">
            Choose the plan that suits your content frequency. Cancel or upgrade anytime.
          </p>

          {/* Toggle Billing */}
          <div className="mt-8 inline-flex items-center gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${!isAnnual ? 'bg-zinc-50 text-zinc-950 font-semibold' : 'text-zinc-400'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer ${isAnnual ? 'bg-zinc-50 text-zinc-950 font-semibold' : 'text-zinc-400'}`}
            >
              Annual
              <span className="text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800 px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {pricingPlans.map((plan, i) => (
            <Card
              key={i}
              className={`flex flex-col relative ${plan.popular ? 'border-zinc-100 shadow-xl shadow-black/40' : 'border-zinc-900'}`}
            >
              {plan.popular && (
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-zinc-100 text-zinc-950 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">
                  Most Popular
                </span>
              )}
              <CardContent className="p-8 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-zinc-100">{plan.name}</h3>
                <p className="text-xs text-zinc-500 mt-1.5 min-h-[32px]">{plan.description}</p>
                
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-zinc-50">${plan.price}</span>
                  <span className="text-xs text-zinc-500">/ month</span>
                </div>

                <div className="h-px bg-zinc-900/60 my-6" />

                <ul className="space-y-3.5 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400 leading-normal">
                      <Check className="h-4 w-4 text-zinc-300 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/login" className="w-full mt-auto">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full font-semibold"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 lg:px-12 border-t border-zinc-900 bg-[#070709] max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 text-center mb-12">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden transition-all">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-zinc-200 hover:text-zinc-50 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/40">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-12 max-w-5xl mx-auto text-center">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-12 sm:p-16 flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight max-w-xl leading-snug">
            Ready to put your Instagram Reel publishing on autopilot?
          </h2>
          <p className="mt-4 text-sm text-zinc-400 max-w-lg leading-relaxed">
            Setup takes less than two minutes. Connect your drives and start automating now.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-medium" rightIcon={<ArrowRight className="h-4.5 w-4.5" />}>
                Get started for free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                Talk to an integration expert
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900/60 py-12 px-6 lg:px-12 bg-[#070709] text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-xs tracking-tight shadow-md">
              RP
            </div>
            <span className="font-semibold text-zinc-400">ReelPilot</span>
          </div>
          <p>© 2026 ReelPilot. All rights reserved. Built safely on the official Meta Graph API.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
