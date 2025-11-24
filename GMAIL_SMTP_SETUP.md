# Gmail SMTP Setup Guide for Word Puzzle Game

This guide will help you configure Gmail SMTP to send authentication emails from your custom domain (info@wordpuzzlegame.com) or a Gmail account.

## Prerequisites

- A Gmail account (or Google Workspace account)
- Access to your Supabase project dashboard
- 2-Factor Authentication enabled on your Google account (required for App Passwords)

---

## Option 1: Using Gmail with App Password

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on **2-Step Verification**
3. Follow the prompts to enable 2FA if not already enabled

### Step 2: Generate App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Sign in with your Gmail account
3. Select app: **Mail**
4. Select device: **Other (Custom name)** - enter "Word Puzzle Game"
5. Click **Generate**
6. **Copy the 16-character password** (you won't see it again)
   - Example: `abcd efgh ijkl mnop` (no spaces when entering)

### Step 3: Configure Supabase SMTP Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** (left sidebar) → **Authentication**
4. Scroll down to **SMTP Settings** section
5. Enable **Enable Custom SMTP**
6. Fill in the following details:

\`\`\`
Sender email: your-email@gmail.com
Sender name: Word Puzzle Game

Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: [paste the 16-character app password without spaces]

Minimum interval between emails: 60 (seconds)
\`\`\`

7. Click **Save**

### Step 4: Update Email Templates

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Magic Link** template
3. Update the template to show OTP code instead of magic link

**Recommended OTP Email Template:**

\`\`\`html
<h2>Your Verification Code</h2>
<p>Hello!</p>
<p>Your verification code for Word Puzzle Game is:</p>
<h1 style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #10b981;">{{ .Token }}</h1>
<p>This code will expire in 60 minutes.</p>
<p>If you didn't request this code, please ignore this email.</p>
<p>Happy puzzling!<br>Word Puzzle Game Team</p>
\`\`\`

4. Click **Save**

---

## Option 2: Using Google Workspace (Custom Domain)

If you have Google Workspace and want to send from info@wordpuzzlegame.com:

### Step 1: Create App Password for Workspace Account

1. Sign in to your Google Workspace admin account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Enable 2-Step Verification
4. Generate an App Password (same process as above)

### Step 2: Configure Supabase SMTP

Use the same settings as Option 1, but with your custom domain email:

\`\`\`
Sender email: info@wordpuzzlegame.com
Sender name: Word Puzzle Game

Host: smtp.gmail.com
Port: 587
Username: info@wordpuzzlegame.com
Password: [16-character app password]
\`\`\`

---

## Gmail SMTP Configuration Reference

| Setting | Value |
|---------|-------|
| **SMTP Server** | smtp.gmail.com |
| **Port (TLS)** | 587 |
| **Port (SSL)** | 465 |
| **Username** | Your full Gmail address |
| **Password** | App Password (16 characters) |
| **Authentication** | Required |
| **Security** | TLS/STARTTLS |

---

## Testing the Configuration

### Test 1: Send Test Email from Supabase

1. In Supabase Dashboard → **Authentication** → **SMTP Settings**
2. Click **Send test email** button
3. Check your inbox for the test email
4. Verify the sender shows as "Word Puzzle Game <your-email@gmail.com>"

### Test 2: Sign Up Flow

1. Open your Word Puzzle Game app
2. Try signing up with a new email address
3. Check that you receive an email with a 6-digit OTP code
4. Verify the code works in the verification screen

---

## Switching Between Supabase and Gmail

### Current Setup (Supabase Default)

- Emails sent from: `noreply@mail.app.supabase.io`
- No configuration needed
- Limited customization

### Gmail SMTP Setup

- Emails sent from: `your-email@gmail.com` or `info@wordpuzzlegame.com`
- Full control over sender details
- Custom email templates
- Better deliverability

### How to Switch Back to Supabase Default

1. Go to Supabase Dashboard → **Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Toggle **Enable Custom SMTP** to OFF
4. Click **Save**

---

## Environment Variables (Optional)

If you want to manage SMTP settings via environment variables instead of Supabase dashboard:

\`\`\`env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=info@wordpuzzlegame.com
SMTP_FROM_NAME=Word Puzzle Game
\`\`\`

**Note:** Supabase manages SMTP internally, so these environment variables are for reference if you build a custom email service later.

---

## Troubleshooting

### Issue: "Username and Password not accepted"

**Solution:**
- Ensure you're using an **App Password**, not your regular Gmail password
- Remove all spaces from the app password when entering
- Verify 2FA is enabled on your Google account

### Issue: "Connection timeout" or "Could not connect to SMTP host"

**Solution:**
- Check that port 587 is not blocked by your firewall
- Try using port 465 (SSL) instead of 587 (TLS)
- Verify your internet connection allows SMTP traffic

### Issue: Emails going to spam

**Solution:**
- Add SPF record to your domain DNS:
  \`\`\`
  v=spf1 include:_spf.google.com ~all
  \`\`\`
- Configure DKIM signing in Google Workspace
- Warm up your sending reputation by starting with low volume

### Issue: "Daily sending limit exceeded"

**Solution:**
- Gmail has a daily sending limit:
  - **Free Gmail:** 500 emails per day
  - **Google Workspace:** 2,000 emails per day
- Consider upgrading to Google Workspace for higher limits
- Implement rate limiting in your application

---

## Gmail Sending Limits

| Account Type | Daily Limit | Per Hour |
|--------------|-------------|----------|
| Free Gmail | 500 emails | ~20 emails |
| Google Workspace | 2,000 emails | ~83 emails |

**Best Practices:**
- Implement rate limiting in your application
- Monitor daily usage
- Consider using a dedicated email service (SendGrid, Mailgun, AWS SES) for production at scale

---

## Security Best Practices

1. **Never commit App Passwords to version control**
   - Store in Supabase dashboard or environment variables
   - Use `.env.local` for local development

2. **Rotate App Passwords periodically**
   - Regenerate every 3-6 months
   - Revoke unused app passwords

3. **Monitor suspicious activity**
   - Check Google account activity regularly
   - Set up alerts for unusual login attempts

4. **Use Google Workspace for production**
   - Better security controls
   - Higher sending limits
   - Professional sender domain

---

## Alternative Email Services

If you need higher volume or better deliverability, consider these alternatives:

### SendGrid
- Free tier: 100 emails/day
- Paid plans start at $19.95/month (100k emails)
- Excellent deliverability

### Mailgun
- Free tier: 5,000 emails/month (3 months)
- Pay-as-you-go pricing
- Developer-friendly API

### AWS SES (Simple Email Service)
- Very low cost: $0.10 per 1,000 emails
- Requires AWS account
- Excellent for high volume

### Resend (Recommended for Next.js)
- Free tier: 100 emails/day, 3,000/month
- Modern API, great for developers
- Built for Next.js applications

---

## Migration Checklist

When switching from Supabase to Gmail SMTP:

- [ ] Enable 2FA on Google account
- [ ] Generate Gmail App Password
- [ ] Configure Supabase SMTP settings
- [ ] Update email templates for OTP display
- [ ] Send test email from Supabase dashboard
- [ ] Test signup flow with real email
- [ ] Verify OTP codes are received and valid
- [ ] Check email deliverability (not in spam)
- [ ] Monitor sending limits
- [ ] Update documentation for your team

---

## Quick Reference Commands

### Revoke an App Password
\`\`\`
1. Go to: https://myaccount.google.com/apppasswords
2. Find "Word Puzzle Game" in the list
3. Click "Revoke"
\`\`\`

### Generate New App Password
\`\`\`
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: Mail
3. Select device: Other → "Word Puzzle Game"
4. Copy the generated password
5. Update in Supabase SMTP settings
\`\`\`

---

## Support

If you encounter issues:

1. Check [Supabase Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
2. Review [Gmail SMTP Documentation](https://support.google.com/mail/answer/7126229)
3. Search [Supabase Discord](https://discord.supabase.com)
4. Contact Google Workspace Support (for custom domain issues)

---

## Conclusion

You now have a complete guide to configure Gmail SMTP for your Word Puzzle Game authentication emails. You can easily switch between Supabase's default email service and Gmail SMTP by toggling the Custom SMTP setting in your Supabase dashboard.

For production use with custom domain (info@wordpuzzlegame.com), Google Workspace is recommended for better deliverability and professional appearance.
