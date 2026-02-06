import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'app-data.json');

interface AppData {
  projects: unknown[];
  columns: unknown[];
  cards: unknown[];
  tasks: unknown[];
  notes: unknown[];
  currentProjectId: string | null;
}

const DEFAULT_DATA: AppData = {
  projects: [],
  columns: [],
  cards: [],
  tasks: [],
  notes: [],
  currentProjectId: null,
};

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE_PATH);
  } catch {
    // File doesn't exist, create it with default data
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

export async function GET() {
  try {
    await ensureDataFile();
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return NextResponse.json(DEFAULT_DATA);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate structure
    const validData: AppData = {
      projects: Array.isArray(data.projects) ? data.projects : [],
      columns: Array.isArray(data.columns) ? data.columns : [],
      cards: Array.isArray(data.cards) ? data.cards : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      currentProjectId: typeof data.currentProjectId === 'string' ? data.currentProjectId : null,
    };

    await ensureDataFile();
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(validData, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing data file:', error);
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    );
  }
}
