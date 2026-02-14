import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Only allow http/https URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid URL scheme' }, { status: 400 });
    }

    // Use macOS `open` command to launch in default browser
    exec(`open "${url.replace(/"/g, '\\"')}"`);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to open URL' }, { status: 500 });
  }
}
