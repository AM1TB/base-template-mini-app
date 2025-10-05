import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '~/lib/auth';
import { getGratitudeEntry, deleteGratitudeEntry } from '~/lib/kv';

// GET /api/gratitude/[date] - Get specific gratitude entry
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = params;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const entry = await getGratitudeEntry(auth, date);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Failed to fetch gratitude entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gratitude entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/gratitude/[date] - Delete specific gratitude entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date } = params;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const entry = await getGratitudeEntry(auth, date);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    await deleteGratitudeEntry(auth, date);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete gratitude entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete gratitude entry' },
      { status: 500 }
    );
  }
}
