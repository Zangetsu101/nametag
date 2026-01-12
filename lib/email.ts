import { Resend } from "resend";
import { env } from "./env";
import { escapeHtml } from "./sanitize";
import { getTranslationsForLocale, type SupportedLocale } from "./i18n-utils";
import { getUserLocale } from "./locale";

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
async function wrapInTemplate(content: string, locale: SupportedLocale = 'en'): Promise<string> {
  const t = await getTranslationsForLocale(locale, 'emails.common');
  const year = new Date().getFullYear();

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
                    <a href="${APP_URL}" style="color: ${COLORS.primary}; text-decoration: none; font-size: 14px; font-weight: 500;">${t('visitNametag')}</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; line-height: 1.5;">
                      ${t('footer')}<br>
                      ${t('copyright', { year })}
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

/**
 * Create unsubscribe footer for reminder emails
 */
async function emailUnsubscribeFooter(unsubscribeUrl: string, locale: SupportedLocale = 'en'): Promise<string> {
  const t = await getTranslationsForLocale(locale, 'emails.common');
  return `
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; padding-top: 16px; border-top: 1px solid ${COLORS.border};">
  <tr>
    <td align="center">
      <p style="margin: 0; color: ${COLORS.textLight}; font-size: 12px; line-height: 1.5;">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color: ${COLORS.textLight}; text-decoration: underline;">${t('unsubscribe')}</a>
      </p>
    </td>
  </tr>
</table>`;
}

// Email template helpers for common use cases
export const emailTemplates = {
  accountVerification: async (verificationUrl: string, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.verification');
    return {
      subject: t('subject'),
      html: await wrapInTemplate(`
        ${emailHeading(t('heading'))}
        ${emailParagraph(t('body'))}
        ${emailButton(verificationUrl, t('button'))}
        ${emailNote(t('note'))}
      `, locale),
      text: `${t('heading')} ${t('body')} ${verificationUrl}`,
    };
  },

  importantDateReminder: async (personName: string, eventType: string, date: string, unsubscribeUrl: string, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.importantDateReminder');
    return {
      subject: t('subject', { personName, eventType }),
      html: await wrapInTemplate(`
        ${emailHeading(t('heading'))}
        ${emailInfoBox(t('infoBox', { personName: `<strong>${escapeHtml(personName)}</strong>`, eventType: escapeHtml(eventType), date: `<strong>${escapeHtml(date)}</strong>` }), 'info')}
        ${emailParagraph(t('body'))}
        ${emailButton(`${APP_URL}/dashboard`, t('button'))}
        ${await emailUnsubscribeFooter(unsubscribeUrl, locale)}
      `, locale),
      text: `${t('subject', { personName, eventType })} ${t('infoBox', { personName, eventType, date })} ${t('body')}\n\n${t('unsubscribe')}: ${unsubscribeUrl}`,
    };
  },

  contactReminder: async (personName: string, lastContactDate: string | null, interval: string, unsubscribeUrl: string, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.contactReminder');
    const lastContactText = lastContactDate ? ` (${t('lastContact', { date: escapeHtml(lastContactDate) })})` : '';
    return {
      subject: t('subject', { personName }),
      html: await wrapInTemplate(`
        ${emailHeading(t('heading'))}
        ${emailParagraph(t('body', { personName: `<strong>${escapeHtml(personName)}</strong>` }) + lastContactText + '.')}
        ${emailInfoBox(t('infoBox', { interval: escapeHtml(interval) }), 'info')}
        ${emailParagraph(t('suggestion'))}
        ${emailButton(`${APP_URL}/dashboard`, t('button'))}
        ${await emailUnsubscribeFooter(unsubscribeUrl, locale)}
      `, locale),
      text: `${t('subject', { personName })} ${t('body', { personName })}${lastContactDate ? ` ${t('lastContact', { date: lastContactDate })}` : ''}. ${t('infoBox', { interval })} ${t('suggestion')}\n\n${t('unsubscribe')}: ${unsubscribeUrl}`,
    };
  },

  passwordReset: async (resetUrl: string, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.passwordReset');
    return {
      subject: t('subject'),
      html: await wrapInTemplate(`
        ${emailHeading(t('heading'))}
        ${emailParagraph(t('body'))}
        ${emailButton(resetUrl, t('button'))}
        ${emailInfoBox(t('infoBox'), 'warning')}
        ${emailNote(t('note'))}
      `, locale),
      text: `${t('heading')}\n\n${t('body')} ${resetUrl}\n\n${t('infoBox')}\n\n${t('note')}`,
    };
  },

  subscriptionCreated: async (tierName: string, price: string, frequency: string, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.subscriptionCreated');
    return {
      subject: t('subject', { tierName }),
      html: await wrapInTemplate(`
        ${emailHeading(t('heading', { tierName: escapeHtml(tierName) }))}
        ${emailParagraph(t('body'))}
        ${emailHeading(t('detailsHeading'), 2)}
        ${emailList([
          t('plan', { tierName: escapeHtml(tierName) }),
          t('price', { price: escapeHtml(price), frequency: escapeHtml(frequency) }),
        ])}
        ${emailInfoBox(t('infoBox'), 'success')}
        ${emailButton(`${APP_URL}/dashboard`, t('button'))}
        ${emailNote(t('note'))}
      `, locale),
      text: `${t('heading', { tierName })}\n\n${t('body')}\n\n${t('detailsHeading')}:\n- ${t('plan', { tierName })}\n- ${t('price', { price, frequency })}\n\n${t('infoBox')}\n\n${t('note')}`,
    };
  },

  subscriptionChanged: async (oldTierName: string, newTierName: string, price: string, frequency: string, isUpgrade: boolean, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.subscriptionChanged');
    const subject = isUpgrade ? t('subjectUpgrade') : t('subjectChange');
    const heading = isUpgrade ? t('headingUpgrade') : t('headingChange');
    const body = isUpgrade ? t('bodyUpgrade') : t('bodyChange');
    const detailsHeading = isUpgrade ? t('detailsHeading') : t('planDetailsHeading');

    return {
      subject,
      html: await wrapInTemplate(isUpgrade
        ? `
          ${emailHeading(heading)}
          ${emailParagraph(body)}
          ${emailHeading(detailsHeading, 2)}
          ${emailList([
            t('previousPlan', { tierName: escapeHtml(oldTierName) }),
            t('newPlan', { tierName: escapeHtml(newTierName) }),
            t('newPrice', { price: escapeHtml(price), frequency: escapeHtml(frequency) }),
          ])}
          ${emailInfoBox(t('infoBoxUpgrade'), 'success')}
          ${emailButton(`${APP_URL}/dashboard`, t('button'))}
        `
        : `
          ${emailHeading(heading)}
          ${emailParagraph(body)}
          ${emailHeading(detailsHeading, 2)}
          ${emailList([
            t('previousPlan', { tierName: escapeHtml(oldTierName) }),
            t('newPlan', { tierName: escapeHtml(newTierName) }),
            t('newPrice', { price: escapeHtml(price), frequency: escapeHtml(frequency) }),
          ])}
          ${emailParagraph(t('bodyChangeDetail', { tierName: escapeHtml(newTierName) }))}
          ${emailButton(`${APP_URL}/dashboard`, t('button'))}
        `, locale
      ),
      text: isUpgrade
        ? `${heading}\n\n${body}\n\n${detailsHeading}:\n- ${t('previousPlan', { tierName: oldTierName })}\n- ${t('newPlan', { tierName: newTierName })}\n- ${t('newPrice', { price, frequency })}\n\n${t('infoBoxUpgrade')}`
        : `${heading}\n\n${body}\n\n${detailsHeading}:\n- ${t('previousPlan', { tierName: oldTierName })}\n- ${t('newPlan', { tierName: newTierName })}\n- ${t('newPrice', { price, frequency })}\n\n${t('bodyChangeDetail', { tierName: newTierName })}`,
    };
  },

  subscriptionCanceled: async (tierName: string, accessUntil: string | null, immediately: boolean, locale: SupportedLocale = 'en') => {
    const t = await getTranslationsForLocale(locale, 'emails.subscriptionCanceled');

    return {
      subject: t('subject'),
      html: await wrapInTemplate(immediately || !accessUntil
        ? `
          ${emailHeading(t('heading'))}
          ${emailParagraph(t('bodyImmediate', { tierName: escapeHtml(tierName) }))}
          ${emailParagraph(t('bodyImmediateContinue'))}
          ${emailButton(`${APP_URL}/settings/billing`, t('button'))}
          ${emailNote(t('note'))}
        `
        : `
          ${emailHeading(t('heading'))}
          ${emailParagraph(t('bodyScheduled', { tierName: escapeHtml(tierName) }))}
          ${emailInfoBox(t('infoBox', { tierName: escapeHtml(tierName), accessUntil: `<strong>${escapeHtml(accessUntil)}</strong>` }), 'info')}
          ${emailParagraph(t('bodyScheduledDetail'))}
          ${emailButton(`${APP_URL}/settings/billing`, t('button'))}
          ${emailNote(t('note'))}
        `, locale
      ),
      text: immediately || !accessUntil
        ? `${t('heading')}\n\n${t('bodyImmediate', { tierName })}\n\n${t('bodyImmediateContinue')}\n\n${t('note')}`
        : `${t('heading')}\n\n${t('bodyScheduled', { tierName })}\n\n${t('infoBox', { tierName, accessUntil: accessUntil || '' })}\n\n${t('bodyScheduledDetail')}\n\n${t('note')}`,
    };
  },
};

/**
 * Helper function to send localized emails
 * Automatically detects the user's language preference
 */
export async function sendLocalizedEmail(
  userId: string,
  to: string | string[],
  templateName: keyof typeof emailTemplates,
  templateParams: unknown[],
  from?: keyof typeof fromAddresses
) {
  const locale = await getUserLocale(userId);
  // Template functions have varying signatures, so we use a type assertion here
  const template = emailTemplates[templateName] as (...args: unknown[]) => Promise<{ subject: string; html: string; text: string }>;
  const { subject, html, text } = await template(...templateParams, locale);

  return sendEmail({ to, subject, html, text, from });
}
