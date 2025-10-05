import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '~/lib/auth';
import { saveGratitudeEntry, getGratitudeEntries, GratitudeEntry } from '~/lib/kv';

// GET /api/gratitude - Get user's gratitude entries
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    
    const entries = await getGratitudeEntries(auth, limit);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Failed to fetch gratitude entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gratitude entries' },
      { status: 500 }
    );
  }
}

// POST /api/gratitude - Create or update a gratitude entry
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, date, mood, isPublic } = body;

    if (!content || !date) {
      return NextResponse.json(
        { error: 'Content and date are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Date must be in YYYY-MM-DD format' },
        { status: 400 }
      );
    }

    // Validate mood if provided
    const validMoods = ['happy', 'grateful', 'peaceful', 'excited', 'content'];
    if (mood && !validMoods.includes(mood)) {
      return NextResponse.json(
        { error: 'Invalid mood value' },
        { status: 400 }
      );
    }

    const entry: GratitudeEntry = {
      id: `${auth}-${date}-${Date.now()}`,
      fid: auth,
      content: content.trim(),
      date,
      createdAt: Date.now(),
      mood: mood || 'grateful',
      isPublic: isPublic || false,
    };

    await saveGratitudeEntry(entry);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Failed to save gratitude entry:', error);
    return NextResponse.json(
      { error: 'Failed to save gratitude entry' },
      { status: 500 }
    );
  }
}
