# OAuth Stabilization Implementation Plan

## Root Cause Analysis

### 1. Google OAuth — Missing Credentials (BLOCKED)
**Error:** "Failed generating Google auth URL"  
**Root cause:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are completely absent from the `.env` file. The backend returns HTTP 400 immediately since there are no credentials to build the URL with.

> [!IMPORTANT]
> Google OAuth **cannot work** without credentials. You must create these in Google Cloud Console first.

### 2. Instagram OAuth — Invalid platform app (BLOCKED)
**Error:** "Invalid Request: Request parameters are invalid: Invalid platform app"  
**Root cause:** The Meta App (ID: `1806740770691990`) is missing required platform configuration:
- **No "Website" platform** added in App Settings → Basic → Add Platform → Website
- **Redirect URI not registered** in the Instagram product's Valid OAuth Redirect URIs
- In Development mode, the Instagram account being tested must be added as an **Instagram Tester** under App Roles

> [!IMPORTANT]  
> Neither of these errors is fixable by code changes alone. Both require configuration steps in external developer consoles.

---

## Open Questions (Action Required by You)

> [!CAUTION]
> I cannot fix Google OAuth without the Google credentials. Do you have a Google Cloud project set up with OAuth client credentials for this app?

> [!CAUTION]
> For Instagram: Have you added a Website platform in your Meta App Basic Settings? Have you registered the redirect URI `http://localhost:3000/api/v1/auth/instagram/callback` in the Instagram product settings?

---

## Proposed Changes

### Part 1 — Meta App Configuration (You must do this in browser)

1. Go to https://developers.facebook.com/apps/1806740770691990/settings/basic/
2. Scroll to bottom → **+ Add Platform** → **Website**
3. Set **Site URL** = `http://localhost:3000` → Save Changes
4. Go to Instagram product → **Business Login Settings**
5. Add to **Valid OAuth Redirect URIs**: `http://localhost:3000/api/v1/auth/instagram/callback`
6. Go to **App Roles → Roles → Instagram Testers**
7. Add the Instagram Business account you want to test with as a Tester
8. That Instagram account must accept the tester invite via https://www.instagram.com/accounts/manage_access/

### Part 2 — Google Cloud Setup (You must do this in browser)

1. Go to https://console.cloud.google.com/
2. Create a project (or select existing)
3. APIs & Services → **OAuth consent screen** → External → Fill in App name, email
4. APIs & Services → **Credentials** → + Create Credentials → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/v1/google/callback`
7. Copy the **Client ID** and **Client Secret**
8. Enable APIs: Google Drive API, Google Picker API

### Part 3 — .env File Update (Code)

Add the Google credentials to `.env`:
```
GOOGLE_CLIENT_ID=<paste_your_client_id>
GOOGLE_CLIENT_SECRET=<paste_your_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/google/callback
```

### Part 4 — Code Fixes

#### [MODIFY] meta.service.ts
- No code changes required — the `api.instagram.com/oauth/authorize` endpoint is correct for Instagram Business Login for Business

#### [MODIFY] google.service.ts  
- Add `GOOGLE_PICKER_API_KEY` support for Google Picker API key (needed for Folder Picker)

#### [MODIFY] auth.controller.ts
- Log the full generated Instagram URL in development mode for debugging

---

## Verification Plan

### After Meta configuration:
1. Navigate to `/setup` in browser
2. Click "Authorize Instagram via Meta"
3. ✅ Should see `https://api.instagram.com/oauth/authorize?...` open in popup
4. ✅ Should see Instagram consent page (not error)
5. ✅ Login → Callback → Connected state

### After Google credentials:
1. Click "Authorize Google Account"
2. ✅ Should see `https://accounts.google.com/o/oauth2/...` open in popup
3. ✅ Google consent page → Allow → Callback → Connected state
