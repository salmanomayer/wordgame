# Supabase Email Configuration Guide

## Current Issue
- The app is correctly using `signInWithOtp()` to send 6-digit verification codes
- However, Supabase is currently using the default email template and sender
- Custom sender email (info@wordpuzzlegame.com) needs to be configured

## Steps to Configure Custom Email Sender

### 1. Configure Custom SMTP
Go to your Supabase Dashboard:
- Navigate to: **Project Settings** > **Auth** > **SMTP Settings**
- Enable Custom SMTP
- Configure the following:
  - **Sender email**: info@wordpuzzlegame.com
  - **Sender name**: Word Game
  - **SMTP Host**: (your email provider's SMTP host)
  - **SMTP Port**: 587 (or 465 for SSL)
  - **SMTP Username**: (your SMTP username)
  - **SMTP Password**: (your SMTP password)

### 2. Update Email Template for OTP
Go to: **Project Settings** > **Auth** > **Email Templates** > **Magic Link**

Replace the default template with:

\`\`\`html
<h2>Welcome to Word Game!</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; background: #6366f1; color: white; padding: 20px; border-radius: 8px;">
  {{ .Token }}
</h1>
<p>This code will expire in 60 minutes.</p>
<p>If you didn't request this code, you can safely ignore this email.</p>
<br>
<p>Happy brain training!</p>
<p><strong>Word Game Team</strong></p>
\`\`\`

### 3. Verify Configuration
- Save the SMTP settings
- Test the OTP flow in your app
- Check that emails arrive from info@wordpuzzlegame.com
- Verify the 6-digit code displays properly

## Alternative: Use SendGrid/Postmark/AWS SES
For better email deliverability, consider using a dedicated email service:

### SendGrid Setup:
1. Create a SendGrid account
2. Verify your domain (wordpuzzlegame.com)
3. Get your API key
4. Configure in Supabase SMTP settings:
   - Host: smtp.sendgrid.net
   - Port: 587
   - Username: apikey
   - Password: (your SendGrid API key)

### Postmark Setup:
1. Create a Postmark account
2. Verify your sender signature (info@wordpuzzlegame.com)
3. Get your server API token
4. Configure in Supabase SMTP settings:
   - Host: smtp.postmarkapp.com
   - Port: 587
   - Username: (your Postmark server API token)
   - Password: (your Postmark server API token)

## Current Code Implementation
The app is correctly implemented with OTP flow:
- ✅ Uses `signInWithOtp()` for signup
- ✅ Displays 6-digit OTP input fields
- ✅ Uses `verifyOtp()` to verify the code
- ✅ Sets password after verification

No code changes needed - only Supabase dashboard configuration required.
