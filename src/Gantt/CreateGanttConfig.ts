// src/Gantt/CreateGanttConfig.ts
import type {
  TaskModelConfig,
  DependencyModelConfig,
  CalendarModelConfig,
  ProjectModelConfig,
} from '@bryntum/gantt'
import type { BryntumGanttProps } from '@bryntum/gantt-react'
export type PeopleMap = Record<string, string>

export interface TimelineData {
  project?: ProjectModelConfig
  tasks?: { rows: TaskModelConfig[] }
  dependencies?: { rows: DependencyModelConfig[] }
  calendars?: { rows: CalendarModelConfig[] }
  peopleMap?: PeopleMap
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
  peopleMap: {}
}

// ✅ your existing editable config (keep as-is)
export function makeGanttConfig(raw: TimelineData | null | undefined): BryntumGanttProps {
  const data: TimelineData = raw ?? DEFAULT_TIMELINE_DATA
  const peopleMap = data.peopleMap ?? {}
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

    // inside config in makeGanttConfig()

    features : {
      taskDrag   : true,
      taskResize : true,
      labels     : true,
      timeRanges : true   // ✅ enable feature
    },

    timeRangesFeature : {
      showCurrentTimeLine : {
        name : 'Today'
      }
    },


    labelsFeature : {
      after : {
        renderer : ({ taskRecord }: any) => {
          const id =
            taskRecord.assignedIndividual ??   // <-- change if needed
            taskRecord.assignee_user_id ??
            taskRecord.assignedUserId

          if (!id) return ''
          return peopleMap[String(id)] ?? ''   // show blank if unknown
        }
      }
    },
    project: {
      ...project,
      tasksData          : tasks,
      dependenciesData   : deps,
      calendarsData      : cals,
      autoSetConstraints : true,
      statusDate         : new Date(),
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
    ...(base.features || {}),
    taskMenuBeforeShow : () => false,
    taskDrag     : false,
    taskResize   : false,
    taskEdit     : false,
    percentBar   : false,
    labels       : true,
    timeRanges   : true,

  }
// keep this too:
  base.timeRangesFeature = base.timeRangesFeature ?? {
    showCurrentTimeLine : { name : 'Today' }
  }


  return base as unknown as BryntumGanttProps
}

