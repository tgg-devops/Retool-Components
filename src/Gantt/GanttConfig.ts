// src/Gantt/GanttConfig.ts
import type {
  TaskModelConfig,
  DependencyModelConfig,
  CalendarModelConfig,
  ProjectModelConfig,
} from '@bryntum/gantt';
import type { BryntumGanttProps } from '@bryntum/gantt-react';

export interface TimelineData {
  project?: ProjectModelConfig;
  tasks?: { rows: TaskModelConfig[] };
  dependencies?: { rows: DependencyModelConfig[] };
  calendars?: { rows: CalendarModelConfig[] };
}

export const DEFAULT_TIMELINE_DATA: TimelineData = {
  project: {
    calendar    : 'general',
    startDate   : '2026-01-01',
    hoursPerDay : 24,
    daysPerWeek : 5,
    daysPerMonth: 20,
  },
  tasks: {
    rows: [],
  },
  dependencies: { rows: [] },
  calendars: { rows: [] },
};

export function makeGanttConfig(raw: TimelineData | null | undefined): BryntumGanttProps {
  const data: TimelineData = raw ?? DEFAULT_TIMELINE_DATA;

  const project: ProjectModelConfig = data.project ?? {};
  const tasks: TaskModelConfig[] = data.tasks?.rows ?? [];
  const deps: DependencyModelConfig[] = data.dependencies?.rows ?? [];
  const cals: CalendarModelConfig[] = data.calendars?.rows ?? [];

  const startDate = project.startDate ? new Date(project.startDate) : new Date(2026, 0, 1);
  const endDate   = new Date(2030, 5, 30);

  const config = {
    // 🔓 allow editing
    readOnly: false,

    startDate,
    endDate,
    columns: [{ type: 'name', field: 'name', width: 250 }],
    viewPreset: 'weekAndDayLetter',
    barMargin: 10,

    // ✅ explicitly enable interaction features
    features: {
      taskDrag  : true,   // drag bar to move task
      taskResize: true,   // resize bar to change duration
      taskEdit  : true,   // double-click → task editor
    },

    project: {
      ...project,
      tasksData        : tasks,
      dependenciesData : deps,
      calendarsData    : cals,
      autoSetConstraints: true,
    },
  };

  // Bryntum's React typings don't list `features`, so cast once here.
  return config as unknown as BryntumGanttProps;
}