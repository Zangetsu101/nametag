import { NextResponse } from 'next/server';
import { isSaasMode } from '@/lib/features';
import { env } from '@/lib/env';

/**
 * Returns available authentication providers
 * Used by client-side components to show/hide OAuth buttons
 */
export async function GET() {
  const providers = {
    credentials: true,
    google: isSaasMode() && !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
  };

  return NextResponse.json({ providers });
}
