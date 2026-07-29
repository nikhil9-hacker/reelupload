import { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy — ReelPilot';
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
        }}>Privacy Policy</h1>
        <p style={{ color: '#94a3b8', marginBottom: 48, fontSize: 16, lineHeight: 1.7 }}>
          This Privacy Policy explains how ReelPilot ("we", "us", or "our") collects, uses, and
          protects your information when you use our service.
        </p>

        {[
          {
            title: '1. Information We Collect',
            content: `We collect the following types of information when you use ReelPilot:

• **Instagram Account Data:** Username, user ID, account name, and account type — collected via the official Instagram Business API (Meta) when you authorize our app.
• **Access Tokens:** Short-lived and long-lived OAuth tokens required to publish content on your behalf via the Instagram API. These are encrypted and stored securely.
• **Google Drive Data:** Your Google account email, user ID, and OAuth refresh tokens — collected when you connect your Google Drive to enable file synchronization.
• **Drive File Metadata:** File names, IDs, MIME types, and folder information from your chosen Google Drive folder.
• **Usage Data:** Server logs including IP addresses, request timestamps, and HTTP status codes for operational purposes.`
          },
          {
            title: '2. How We Use Your Information',
            content: `We use collected information solely to provide the ReelPilot service:

• Authenticating your Instagram Business account via Meta's official OAuth 2.0 flow.
• Publishing Reels to your Instagram account based on your configured schedule.
• Synchronizing video and caption files from your connected Google Drive folder.
• Displaying your connection status and publishing history in the dashboard.
• Sending you notifications about upload successes or failures.

We do NOT use your information for advertising, profiling, or any purpose beyond what is listed above.`
          },
          {
            title: '3. Data Sharing and Disclosure',
            content: `We do not sell, rent, or trade your personal information to any third parties.

We share data only with:
• **Meta Platforms (Instagram):** Your content and tokens are sent to Instagram's official API endpoints for publishing. Meta's own Privacy Policy applies to that data.
• **Google APIs:** Drive file access is handled through Google's official APIs. Google's Privacy Policy applies.
• **Railway (Hosting):** Our server infrastructure is hosted on Railway.app. Server-level logs may be retained per Railway's data retention policy.

We may disclose information if required by law or to protect our rights.`
          },
          {
            title: '4. Data Storage and Security',
            content: `• Access tokens are encrypted in our database using industry-standard encryption.
• We use HTTPS (TLS) for all data transmission.
• We do not store your Instagram passwords or Google passwords — only the OAuth tokens issued by those platforms.
• You may revoke access at any time from your Instagram Settings or Google Account permissions page, which will invalidate all tokens we hold.
• We retain account data for as long as your account is active or as needed to provide services.`
          },
          {
            title: '5. Instagram API Usage',
            content: `ReelPilot uses the Instagram Business Login API and the following permissions:
• **instagram_business_basic** — to read your account profile information.
• **instagram_business_content_publish** — to publish Reels on your behalf.

We do not access your personal messages, followers list, or any data beyond what is required for publishing. Our use of Instagram APIs complies with Meta's Platform Policy and Developer Terms.`
          },
          {
            title: '6. Your Rights',
            content: `You have the right to:
• **Access:** Request a copy of all data we hold about you.
• **Deletion:** Request deletion of your account and all associated data.
• **Revocation:** Disconnect your Instagram or Google account at any time from the Settings page inside ReelPilot.
• **Portability:** Request your data in a machine-readable format.

To exercise any of these rights, contact us at the email below.`
          },
          {
            title: '7. Cookies',
            content: `ReelPilot uses only session cookies necessary for authentication and security (CSRF protection). We do not use tracking cookies, advertising cookies, or third-party analytics cookies.`
          },
          {
            title: '8. Changes to This Policy',
            content: `We may update this Privacy Policy periodically. We will notify you of significant changes by updating the "Last updated" date at the top of this page. Continued use of ReelPilot after changes constitutes your acceptance of the updated policy.`
          },
          {
            title: '9. Contact Us',
            content: `If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:

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
                      {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}
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
