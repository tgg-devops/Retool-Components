// src/Gantt/GanttConfig.ts
import type {
  TaskModelConfig,
  DependencyModelConfig,
  CalendarModelConfig,
  ProjectModelConfig,
} from '@bryntum/gantt'
import type { BryntumGanttProps } from '@bryntum/gantt-react'

export interface TimelineData {
  project?: ProjectModelConfig
  tasks?: { rows: TaskModelConfig[] }
  dependencies?: { rows: DependencyModelConfig[] }
  calendars?: { rows: CalendarModelConfig[] }
}

export const DEFAULT_TIMELINE_DATA: TimelineData = {
  project: {
    calendar    : 'general',
    startDate   : '2026-01-01',
    hoursPerDay : 24,
    daysPerWeek : 5,
    daysPerMonth: 20,
  },
  tasks: { rows: [] },
  dependencies: { rows: [] },
  calendars: { rows: [] },
}

export function makeGanttConfig(raw: TimelineData | null | undefined): BryntumGanttProps {
  const data: TimelineData = raw ?? DEFAULT_TIMELINE_DATA

  const project: ProjectModelConfig = data.project ?? {}
  const tasks: TaskModelConfig[] = data.tasks?.rows ?? []
  const deps: DependencyModelConfig[] = data.dependencies?.rows ?? []
  const cals: CalendarModelConfig[] = data.calendars?.rows ?? []

  const startDate = project.startDate ? new Date(project.startDate) : new Date(2026, 0, 1)
  const endDate   = new Date(2030, 5, 30)

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })

  const config = {
    readOnly: false,

    startDate,
    endDate,

    columns: [
      { type: 'name', field: 'name', width: 200 },

      // ✅ Single "Assigned To" column:
      // - if assignedIndividual is set -> show that
      // - else show assignedTeam
      {
        text: 'Assigned To',
        field: 'assignedIndividual', // field can be anything; renderer controls display
        width: 120,
        renderer: ({ record }: { record: any }) => {
          const person = (record.assignedIndividual ?? '').toString().trim()
          if (person) return person
          const team = (record.assignedTeam ?? '').toString().trim()
          return team || ''
        },
      },

      // ✅ Cost column
      {
        text: 'Cost',
        field: 'cost',
        width: 120,
        align: 'end',
        renderer: ({ value }: { value: unknown }) => {
          if (value === null || value === undefined || value === '') return ''
          const n = Number(value)
          return Number.isFinite(n) ? money.format(n) : String(value)
        },
      },
    ],

    viewPreset: 'weekAndDayLetter',
    barMargin: 10,

    features: {
      taskDrag  : true,
      taskResize: true,

      // keep task editor and include the raw fields (so edits persist in project.changes)
      taskEdit  : {
        items: {
          generalTab: {
            items: {
              assignedTeam: {
                type: 'text',
                name: 'assignedTeam',
                label: 'Assigned Team',
              },
              assignedIndividual: {
                type: 'text',
                name: 'assignedIndividual',
                label: 'Assigned Person',
              },
              cost: {
                type: 'number',
                name: 'cost',
                label: 'Cost',
              },
            },
          },
        },
      },
    },

    project: {
      ...project,
      tasksData          : tasks,
      dependenciesData   : deps,
      calendarsData      : cals,
      autoSetConstraints : true,
    },
  }

  return config as unknown as BryntumGanttProps
}
