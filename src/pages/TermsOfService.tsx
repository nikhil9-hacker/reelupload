import { useEffect } from 'react';

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service — ReelPilot';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a0f 100%)',
      color: '#e2e8f0',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, color: '#fff',
        }}>RP</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>ReelPilot</span>
        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 14 }}>
          Last updated: July 29, 2026
        </span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '60px 40px 100px' }}>
        <h1 style={{
          fontSize: 42, fontWeight: 800, marginBottom: 12,
          background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #ec4899 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Terms of Service</h1>
        <p style={{ color: '#94a3b8', marginBottom: 48, fontSize: 16, lineHeight: 1.7 }}>
          These Terms of Service ("Terms") govern your use of ReelPilot ("Service"). By accessing or
          using ReelPilot, you agree to be bound by these Terms.
        </p>

        {[
          {
            title: '1. Acceptance of Terms',
            content: `By creating an account or using ReelPilot, you confirm that you:
• Are at least 18 years of age.
• Have the legal authority to enter into these Terms.
• Agree to comply with Instagram's Terms of Use and Meta's Platform Policies.
• Agree to comply with Google's Terms of Service when using Google Drive integration.

If you do not agree to these Terms, do not use ReelPilot.`
          },
          {
            title: '2. Description of Service',
            content: `ReelPilot is an automation tool that:
• Connects to your Instagram Business account via Meta's official API.
• Monitors your connected Google Drive folder for video files.
• Publishes Instagram Reels on your behalf based on a schedule you configure.
• Provides a dashboard to track publish history and scheduled posts.

ReelPilot is an independent service and is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc. or Google LLC.`
          },
          {
            title: '3. Eligibility and Account Requirements',
            content: `To use ReelPilot, you must:
• Have an active Instagram Professional (Business or Creator) account.
• Have a Google account with Google Drive access.
• Authorize ReelPilot to access your accounts using the official OAuth 2.0 flows.

You are responsible for maintaining the security of your account and for all activities that occur under your account.`
          },
          {
            title: '4. Acceptable Use',
            content: `You agree NOT to use ReelPilot to:
• Publish content that violates Instagram's Community Guidelines or Meta's Platform Policies.
• Publish content that is illegal, defamatory, harassing, or infringes on third-party intellectual property rights.
• Attempt to reverse-engineer, modify, or circumvent any security features of the Service.
• Use the Service in any manner that could damage, disable, overburden, or impair our servers or networks.
• Resell or redistribute the Service without our express written permission.`
          },
          {
            title: '5. Content Ownership',
            content: `• You retain full ownership of all content (videos, captions) that you publish through ReelPilot.
• By using the Service, you grant ReelPilot a limited, non-exclusive license to access, process, and transmit your content solely for the purpose of providing the Service.
• We do not claim ownership of your content and will not use it for any purpose other than operating the Service.`
          },
          {
            title: '6. Third-Party APIs and Compliance',
            content: `ReelPilot integrates with:
• **Meta (Instagram) APIs** — governed by Meta's Platform Terms and Developer Policies.
• **Google APIs** — governed by Google's API Terms of Service and OAuth Policies.

You are responsible for ensuring your use of ReelPilot complies with the terms of these third-party platforms. We reserve the right to suspend your account if your use violates those third-party terms in a manner that threatens our access to those APIs.`
          },
          {
            title: '7. Service Availability',
            content: `We strive to maintain high availability but do not guarantee uninterrupted service. ReelPilot may be temporarily unavailable due to:
• Scheduled maintenance.
• Third-party API outages (Instagram, Google).
• Force majeure events.

We are not liable for any losses resulting from service interruptions.`
          },
          {
            title: '8. Limitation of Liability',
            content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, REELPILOT AND ITS OPERATORS SHALL NOT BE LIABLE FOR:
• Any indirect, incidental, special, or consequential damages.
• Loss of revenue, data, goodwill, or business opportunities.
• Any failure or delay in publishing content to Instagram.
• Actions taken by Instagram or Google related to your account or content.

Our total liability to you for any claims arising under these Terms shall not exceed the amount paid by you for the Service in the 12 months preceding the claim.`
          },
          {
            title: '9. Termination',
            content: `Either party may terminate access to ReelPilot at any time:
• You may disconnect your accounts and stop using the Service at any time from the Settings page.
• We may suspend or terminate your access if you violate these Terms or applicable platform policies.

Upon termination, we will delete your account data within 30 days, except where retention is required by law.`
          },
          {
            title: '10. Changes to Terms',
            content: `We may modify these Terms at any time. We will notify you of material changes by updating the "Last updated" date. Your continued use of ReelPilot after changes constitutes acceptance of the updated Terms.`
          },
          {
            title: '11. Governing Law',
            content: `These Terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through good-faith negotiation before pursuing legal remedies.`
          },
          {
            title: '12. Contact',
            content: `For questions about these Terms, contact us at:

Email: support@reelpilot.app
Website: https://reelupload-production.up.railway.app`
          },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 20, fontWeight: 700, color: '#e2e8f0',
              marginBottom: 16, paddingBottom: 8,
              borderBottom: '1px solid rgba(99, 102, 241, 0.3)',
            }}>{section.title}</h2>
            <div style={{ color: '#94a3b8', lineHeight: 1.85, fontSize: 15 }}>
              {section.content.split('\n').map((line, i) => (
                <p key={i} style={{ marginBottom: line === '' ? 8 : 4 }}>
                  {line.startsWith('• ') ? (
                    <span>
                      <span style={{ color: '#6366f1', marginRight: 8 }}>•</span>
                      {line.slice(2)}
                    </span>
                  ) : (
                    line
                  )}
                </p>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '24px 40px',
        textAlign: 'center',
        color: '#475569',
        fontSize: 14,
      }}>
        © 2026 ReelPilot. All rights reserved. &nbsp;|&nbsp;
        <a href="/#/terms" style={{ color: '#6366f1', textDecoration: 'none' }}>Terms of Service</a>
        &nbsp;|&nbsp;
        <a href="/#/privacy" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</a>
      </footer>
    </div>
  );
}
