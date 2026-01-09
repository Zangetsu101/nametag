import { getRequestConfig } from 'next-intl/server';
import { getUserLocale, type SupportedLocale } from './lib/locale';
import { auth } from './lib/auth';

/**
 * next-intl configuration
 * This runs on every request to determine the locale
 */
export default getRequestConfig(async () => {
  // Get user session to determine locale
  const session = await auth();
  const userId = session?.user?.id;

  // Get locale based on user preference, cookie, or browser detection
  const locale: SupportedLocale = await getUserLocale(userId);

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
