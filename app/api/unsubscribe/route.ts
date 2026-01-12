import { NextResponse } from 'next/server';
import { consumeUnsubscribeToken } from '@/lib/unsubscribe-tokens';
import { handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'MISSING_TOKEN' },
        { status: 400 }
      );
    }

    const result = await consumeUnsubscribeToken(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    logger.info('Reminder unsubscribed via email', {
      userId: result.user.id,
      reminderType: result.reminderType,
      entityId: result.entityId,
    });

    return NextResponse.json({
      success: true,
      reminderType: result.reminderType,
    });
  } catch (error) {
    return handleApiError(error, 'unsubscribe');
  }
}
