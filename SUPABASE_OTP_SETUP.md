# Supabase OTP Setup Guide

## Current Issue

Your signup flow is sending **Magic Link confirmation emails** instead of **6-digit OTP codes**. This is because Supabase defaults to Magic Links when `signInWithOtp()` is called.

## Solution

You need to change the auth configuration in your Supabase Dashboard to use OTP codes instead of magic links.

### Steps to Enable OTP Codes

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Open Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Select "Auth Providers" or "Email Templates"

3. **Configure OTP Settings**
   - Look for "Email OTP" or "Passwordless Sign-In" options
   - Enable "Email OTP" instead of "Magic Link"
   - This will make `signInWithOtp()` send a 6-digit code instead of a magic link

4. **Update Email Template (Optional)**
   - Go to "Authentication" → "Email Templates"
   - Find the "Magic Link" or "Confirm Signup" template
   - Customize it to display the `{{ .Token }}` variable which contains the 6-digit OTP code
   - Example template:

\`\`\`html
<h2>Your Verification Code</h2>
<p>Enter this code to verify your email:</p>
<h1 style="font-size: 32px; letter-spacing: 5px;">{{ .Token }}</h1>
<p>This code will expire in 60 minutes.</p>
\`\`\`

5. **Configure Custom SMTP (For Custom Sender)**
   - Go to "Project Settings" → "Auth" → "SMTP Settings"
   - Click "Enable Custom SMTP"
   - Enter your SMTP details:
     - **Sender Email**: info@wordpuzzlegame.com
     - **Sender Name**: Word Puzzle Game
     - **Host**: (your SMTP host, e.g., smtp.gmail.com or smtp.sendgrid.net)
     - **Port**: Usually 587 for TLS or 465 for SSL
     - **Username**: Your SMTP username
     - **Password**: Your SMTP password
   - Save and test the connection

### Alternative: Update Dashboard Configuration

Some Supabase projects have a simpler toggle:

1. Go to "Authentication" → "Providers"
2. Find "Email" provider
3. Look for "Enable Email OTP" checkbox
4. Enable it and save

### Verify Configuration

After making changes:

1. Try signing up with a test email
2. Check if you receive a 6-digit code instead of a magic link
3. The email should come from info@wordpuzzlegame.com (if SMTP is configured)

## Code Implementation (Already Correct)

Your current code is already set up correctly to work with OTP:

\`\`\`typescript
// Signup - sends OTP
await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
  },
})

// Verify - validates the 6-digit OTP
await supabase.auth.verifyOtp({
  email,
  token: otp,
  type: "email",
})
\`\`\`

The issue is purely on the Supabase dashboard configuration side, not in the code.

## Important Notes

- **Magic Link**: Sends a clickable URL for instant login (current behavior)
- **Email OTP**: Sends a 6-digit code that users must enter manually (desired behavior)
- Both use the same `signInWithOtp()` method - the behavior depends on your Supabase project settings
- Custom SMTP is required to send emails from info@wordpuzzlegame.com instead of the default Supabase sender

## Need Help?

If you can't find these settings in your Supabase dashboard, they might be named differently depending on your Supabase version. Look for:
- "Passwordless Sign-In"
- "Email OTP"
- "Magic Link vs OTP"
- "Authentication Method"
