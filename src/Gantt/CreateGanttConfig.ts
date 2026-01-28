// src/Gantt/CreateGanttConfig.ts
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

function findDateRange(rows: any[]): { min?: Date; max?: Date } {
  let min: Date | undefined
  let max: Date | undefined

  const walk = (n: any) => {
      if (!n) return
      if (n.startDate) {
        const s = new Date(n.startDate)
        if (!Number.isNaN(s.getTime())) {
          if (!min || s < min) min = s
        }
      }
      if (n.endDate) {
        const e = new Date(n.endDate)
        if (!Number.isNaN(e.getTime())) {
          if (!max || e > max) max = e
        }
      }
      if (Array.isArray(n.children)) n.children.forEach(walk)
    }

  ;(rows || []).forEach(walk)
  return { min, max }
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

// ✅ your existing editable config (keep as-is)
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
      {
        text: 'Assigned To',
        field: 'assignedTp',
        width: 120,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderer: ({ record }: { record: any }) => {
          const person = (record.assignedUserLabel ?? '').toString().trim()
          if (person) return person
          const team = (record.assignedTeamLabel ?? '').toString().trim()
          return team || ''
        },
      },
      {
        text: 'Cost',
        field: 'projectedCost',
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

export function makeViewGanttConfig(raw: TimelineData | null | undefined): BryntumGanttProps {
  const base = makeGanttConfig(raw) as any

  const taskRows = base.project?.tasksData ?? []
  const { min, max } = findDateRange(taskRows)

  base.startDate = min ?? base.startDate
  base.endDate   = max ?? base.endDate

  base.readOnly = false
  base.features = {
    taskDrag: false,
    taskResize: false,
    taskEdit: false,
    percentBar: false,
  }

  return base as unknown as BryntumGanttProps
}


