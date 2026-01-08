import { Resend } from "resend";
import { env } from "./env";
import { escapeHtml } from "./sanitize";

const resend = new Resend(env.RESEND_API_KEY);

const EMAIL_DOMAIN = env.EMAIL_DOMAIN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nametag.one';

// Brand colors matching the app
const COLORS = {
  primary: '#2563EB',      // Blue-600 - primary buttons
  primaryHover: '#1D4ED8', // Blue-700
  accent: '#FF4136',       // Red/orange from logo
  text: '#1F2937',         // Gray-800
  textLight: '#6B7280',    // Gray-500
  background: '#F9FAFB',   // Gray-50
  white: '#FFFFFF',
  border: '#E5E7EB',       // Gray-200
  success: '#059669',      // Green-600
  warning: '#D97706',      // Amber-600
};

// Different from addresses for different email types
export const fromAddresses = {
  accounts: `Nametag Accounts <accounts@${EMAIL_DOMAIN}>`,
  reminders: `Nametag Reminders <reminders@${EMAIL_DOMAIN}>`,
  default: `Nametag <hello@${EMAIL_DOMAIN}>`,
};

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: keyof typeof fromAddresses;
};

export async function sendEmail({ to, subject, html, text, from = 'default' }: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: fromAddresses[from],
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Wrap content in a beautiful HTML email template
 */
function wrapInTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nametag</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: ${COLORS.white}; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px; border-bottom: 1px solid ${COLORS.border};">
              <img src="${APP_URL}/logo.png" alt="Nametag" width="120" style="display: block; max-width: 120px; height: auto;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${COLORS.background}; border-top: 1px solid ${COLORS.border}; border-radius: 0 0 12px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${APP_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-size: 14px; font-weight: 500;">Visit Nametag</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; line-height: 1.5;">
                      You're receiving this email because you have an account at Nametag.<br>
                      &copy; ${new Date().getFullYear()} Nametag. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Create a styled button for emails
 */
function emailButton(url: string, text: string, color: string = COLORS.primary): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="background-color: ${color}; border-radius: 8px;">
            <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; color: ${COLORS.white}; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
              ${escapeHtml(text)}
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/**
 * Create a styled heading
 */
function emailHeading(text: string, level: 1 | 2 = 1): string {
  const styles = level === 1
    ? `margin: 0 0 16px; color: ${COLORS.text}; font-size: 24px; font-weight: 700; line-height: 1.3;`
    : `margin: 24px 0 12px; color: ${COLORS.text}; font-size: 18px; font-weight: 600; line-height: 1.4;`;
  return `<h${level} style="${styles}">${text}</h${level}>`;
}

/**
 * Create a styled paragraph
 */
function emailParagraph(text: string): string {
  return `<p style="margin: 0 0 16px; color: ${COLORS.text}; font-size: 16px; line-height: 1.6;">${text}</p>`;
}

/**
 * Create a styled list
 */
function emailList(items: string[]): string {
  const listItems = items.map(item =>
    `<li style="margin-bottom: 8px; color: ${COLORS.text}; font-size: 16px; line-height: 1.6;">${item}</li>`
  ).join('');
  return `<ul style="margin: 0 0 16px; padding-left: 24px;">${listItems}</ul>`;
}

/**
 * Create a highlighted info box
 */
function emailInfoBox(content: string, type: 'info' | 'success' | 'warning' = 'info'): string {
  const colors = {
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: COLORS.primary },
    success: { bg: '#ECFDF5', border: '#A7F3D0', text: COLORS.success },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: COLORS.warning },
  };
  const c = colors[type];
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 16px 0;">
  <tr>
    <td style="padding: 16px 20px; background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 4px;">
      <p style="margin: 0; color: ${c.text}; font-size: 15px; line-height: 1.5;">${content}</p>
    </td>
  </tr>
</table>`;
}

/**
 * Create a subtle note/disclaimer
 */
function emailNote(text: string): string {
  return `<p style="margin: 16px 0 0; color: ${COLORS.textLight}; font-size: 14px; line-height: 1.5;">${text}</p>`;
}

// Email template helpers for common use cases
export const emailTemplates = {
  accountVerification: (verificationUrl: string) => ({
    subject: "Verify your Nametag account",
    html: wrapInTemplate(`
      ${emailHeading("Welcome to Nametag!")}
      ${emailParagraph("Thanks for signing up! Please verify your email address to get started with managing your relationships.")}
      ${emailButton(verificationUrl, "Verify Email Address")}
      ${emailNote("If you didn't create an account, you can safely ignore this email.")}
    `),
    text: `Welcome to Nametag! Please verify your email by visiting: ${verificationUrl}`,
  }),

  importantDateReminder: (personName: string, eventType: string, date: string) => ({
    subject: `Reminder: ${personName}'s ${eventType} is coming up`,
    html: wrapInTemplate(`
      ${emailHeading("Upcoming Event Reminder")}
      ${emailInfoBox(`<strong>${escapeHtml(personName)}</strong>'s ${escapeHtml(eventType)} is on <strong>${escapeHtml(date)}</strong>.`, 'info')}
      ${emailParagraph("Don't forget to reach out and make their day special!")}
      ${emailButton(`${APP_URL}/dashboard`, "Open Nametag")}
    `),
    text: `Reminder: ${personName}'s ${eventType} is on ${date}. Don't forget to reach out!`,
  }),

  contactReminder: (personName: string, lastContactDate: string | null, interval: string) => ({
    subject: `Time to catch up with ${personName}`,
    html: wrapInTemplate(`
      ${emailHeading("Stay in Touch")}
      ${emailParagraph(`It's been a while since you last contacted <strong>${escapeHtml(personName)}</strong>${lastContactDate ? ` (last contact: ${escapeHtml(lastContactDate)})` : ''}.`)}
      ${emailInfoBox(`You asked to be reminded to catch up after ${escapeHtml(interval)} of your last contact.`, 'info')}
      ${emailParagraph("Why not reach out today? A simple message can brighten someone's day.")}
      ${emailButton(`${APP_URL}/dashboard`, "Open Nametag")}
    `),
    text: `Time to catch up with ${personName}!${lastContactDate ? ` Last contact: ${lastContactDate}.` : ''} You asked to be reminded to catch up after ${interval} of your last contact. Why not reach out today?`,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "Reset your Nametag password",
    html: wrapInTemplate(`
      ${emailHeading("Password Reset Request")}
      ${emailParagraph("We received a request to reset your password. Click the button below to set a new password:")}
      ${emailButton(resetUrl, "Reset Password")}
      ${emailInfoBox("This link will expire in 1 hour.", 'warning')}
      ${emailNote("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.")}
    `),
    text: `Password Reset Request\n\nWe received a request to reset your password. Visit this link to set a new password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
  }),

  subscriptionCreated: (tierName: string, price: string, frequency: string) => ({
    subject: `Welcome to Nametag ${tierName}!`,
    html: wrapInTemplate(`
      ${emailHeading(`Welcome to Nametag ${escapeHtml(tierName)}!`)}
      ${emailParagraph("Thank you for subscribing to Nametag. Your subscription is now active and you have access to all the features included in your plan.")}
      ${emailHeading("Subscription Details", 2)}
      ${emailList([
        `<strong>Plan:</strong> ${escapeHtml(tierName)}`,
        `<strong>Price:</strong> ${escapeHtml(price)} (${escapeHtml(frequency)})`,
      ])}
      ${emailInfoBox("Start managing your relationships more effectively today!", 'success')}
      ${emailButton(`${APP_URL}/dashboard`, "Go to Dashboard")}
      ${emailNote("If you have any questions, feel free to reach out to our support team.")}
    `),
    text: `Welcome to Nametag ${tierName}!\n\nThank you for subscribing to Nametag. Your subscription is now active.\n\nSubscription Details:\n- Plan: ${tierName}\n- Price: ${price} (${frequency})\n\nYou now have access to all the features included in your plan. Start managing your relationships more effectively today!\n\nIf you have any questions, feel free to reach out to our support team.`,
  }),

  subscriptionChanged: (oldTierName: string, newTierName: string, price: string, frequency: string, isUpgrade: boolean) => ({
    subject: isUpgrade
      ? "Your Nametag subscription has been upgraded"
      : "Your Nametag subscription has been changed",
    html: wrapInTemplate(isUpgrade
      ? `
        ${emailHeading("Subscription Upgraded")}
        ${emailParagraph("Your Nametag subscription has been successfully upgraded.")}
        ${emailHeading("Upgrade Details", 2)}
        ${emailList([
          `<strong>Previous plan:</strong> ${escapeHtml(oldTierName)}`,
          `<strong>New plan:</strong> ${escapeHtml(newTierName)}`,
          `<strong>New price:</strong> ${escapeHtml(price)} (${escapeHtml(frequency)})`,
        ])}
        ${emailInfoBox("Your new plan features are now available. Enjoy the expanded limits and capabilities!", 'success')}
        ${emailButton(`${APP_URL}/dashboard`, "Go to Dashboard")}
      `
      : `
        ${emailHeading("Subscription Changed")}
        ${emailParagraph("Your Nametag subscription has been changed.")}
        ${emailHeading("Plan Details", 2)}
        ${emailList([
          `<strong>Previous plan:</strong> ${escapeHtml(oldTierName)}`,
          `<strong>New plan:</strong> ${escapeHtml(newTierName)}`,
          `<strong>New price:</strong> ${escapeHtml(price)} (${escapeHtml(frequency)})`,
        ])}
        ${emailParagraph(`Your plan has been updated. You now have access to all ${escapeHtml(newTierName)} features.`)}
        ${emailButton(`${APP_URL}/dashboard`, "Go to Dashboard")}
      `
    ),
    text: isUpgrade
      ? `Subscription Upgraded\n\nYour Nametag subscription has been successfully upgraded.\n\nUpgrade Details:\n- Previous plan: ${oldTierName}\n- New plan: ${newTierName}\n- New price: ${price} (${frequency})\n\nYour new plan features are now available. Enjoy the expanded limits and capabilities!`
      : `Subscription Changed\n\nYour Nametag subscription has been changed.\n\nPlan Details:\n- Previous plan: ${oldTierName}\n- New plan: ${newTierName}\n- New price: ${price} (${frequency})\n\nYour plan has been updated. You now have access to all ${newTierName} features.`,
  }),

  subscriptionCanceled: (tierName: string, accessUntil: string | null, immediately: boolean) => ({
    subject: "Your Nametag subscription has been canceled",
    html: wrapInTemplate(immediately || !accessUntil
      ? `
        ${emailHeading("Subscription Canceled")}
        ${emailParagraph(`Your Nametag ${escapeHtml(tierName)} subscription has been canceled and your account has been downgraded to the Free plan.`)}
        ${emailParagraph("You can continue using Nametag with the Free plan features. If you'd like to resubscribe at any time, visit your billing settings.")}
        ${emailButton(`${APP_URL}/settings/billing`, "View Billing Settings")}
        ${emailNote("We're sorry to see you go. If you have any feedback about your experience, we'd love to hear from you.")}
      `
      : `
        ${emailHeading("Subscription Canceled")}
        ${emailParagraph(`Your Nametag ${escapeHtml(tierName)} subscription has been canceled.`)}
        ${emailInfoBox(`<strong>Good news:</strong> You'll continue to have access to all ${escapeHtml(tierName)} features until <strong>${escapeHtml(accessUntil)}</strong>.`, 'info')}
        ${emailParagraph("After this date, your account will be downgraded to the Free plan. You can resubscribe at any time from your billing settings.")}
        ${emailButton(`${APP_URL}/settings/billing`, "View Billing Settings")}
        ${emailNote("We're sorry to see you go. If you have any feedback about your experience, we'd love to hear from you.")}
      `
    ),
    text: immediately || !accessUntil
      ? `Subscription Canceled\n\nYour Nametag ${tierName} subscription has been canceled and your account has been downgraded to the Free plan.\n\nYou can continue using Nametag with the Free plan features. If you'd like to resubscribe at any time, visit your billing settings.\n\nWe're sorry to see you go. If you have any feedback about your experience, we'd love to hear from you.`
      : `Subscription Canceled\n\nYour Nametag ${tierName} subscription has been canceled.\n\nGood news: You'll continue to have access to all ${tierName} features until ${accessUntil}.\n\nAfter this date, your account will be downgraded to the Free plan. You can resubscribe at any time from your billing settings.\n\nWe're sorry to see you go. If you have any feedback about your experience, we'd love to hear from you.`,
  }),
};
