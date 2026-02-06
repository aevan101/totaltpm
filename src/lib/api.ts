import type { Project, KanbanColumn, KanbanCard, Task, Note } from '@/types';

export interface AppData {
  projects: Project[];
  columns: KanbanColumn[];
  cards: KanbanCard[];
  tasks: Task[];
  notes: Note[];
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

export async function loadData(): Promise<AppData> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Failed to load data');
    }
    const data = await response.json();
    return {
      projects: data.projects ?? [],
      columns: data.columns ?? [],
      cards: data.cards ?? [],
      tasks: data.tasks ?? [],
      notes: data.notes ?? [],
      currentProjectId: data.currentProjectId ?? null,
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return DEFAULT_DATA;
  }
}

export async function saveData(data: AppData): Promise<boolean> {
  try {
    const response = await fetch('/api/data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to save data');
    }
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}
