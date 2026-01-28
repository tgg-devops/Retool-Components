// // src/ViewGanttConfig.ts
// import type {
//   TaskModelConfig,
//   DependencyModelConfig,
//   CalendarModelConfig,
//   ProjectModelConfig,
// } from '@bryntum/gantt'
// import type { BryntumGanttProps } from '@bryntum/gantt-react'
//
// export interface TimelineData {
//   project?: ProjectModelConfig
//   tasks?: { rows: TaskModelConfig[] }
//   dependencies?: { rows: DependencyModelConfig[] }
//   calendars?: { rows: CalendarModelConfig[] }
// }
//
// export const DEFAULT_TIMELINE_DATA: TimelineData = {
//   project: {
//     calendar    : 'general',
//     startDate   : '2026-01-01',
//     hoursPerDay : 24,
//     daysPerWeek : 5,
//     daysPerMonth: 20,
//   },
//   tasks: { rows: [] },
//   dependencies: { rows: [] },
//   calendars: { rows: [] },
// }
//
// // Flatten any existing children so we can rebuild purely by parentName
// function flattenTasks(rows: TaskModelConfig[] | undefined): any[] {
//   const out: any[] = []
//   const walk = (t: any) => {
//       out.push({ ...t }) // clone node shallowly
//       if (t.children && Array.isArray(t.children)) t.children.forEach(walk)
//     }
//   ;(rows ?? []).forEach(walk)
//   return out
// }
//
// // Rebuild tree based on `parentName` (your data uses this)
// function rebuildTreeByParentName(rows: TaskModelConfig[] | undefined): TaskModelConfig[] {
//   const all = flattenTasks(rows)
//   const byName = new Map<string, any>()
//   all.forEach(t => {
//     byName.set(String(t.name), t)
//     t.children = [] // reset children
//   })
//
//   const roots: any[] = []
//
//   all.forEach(t => {
//     const pName = (t.parentName ?? '').toString().trim()
//     if (pName && byName.has(pName)) {
//       byName.get(pName).children.push(t)
//     } else {
//       roots.push(t)
//     }
//   })
//
//   // Remove empty children arrays for cleanliness
//   const cleanup = (t: any) => {
//     if (t.children && t.children.length === 0) delete t.children
//     if (t.children) t.children.forEach(cleanup)
//   }
//   roots.forEach(cleanup)
//
//   return roots as TaskModelConfig[]
// }
//
// export function viewGanttConfig(raw: TimelineData | null | undefined): BryntumGanttProps {
//   const data: TimelineData = raw ?? DEFAULT_TIMELINE_DATA
//
//   const project: ProjectModelConfig = data.project ?? {}
//   const tasks: TaskModelConfig[] = rebuildTreeByParentName(data.tasks?.rows ?? [])
//   const deps: DependencyModelConfig[] = data.dependencies?.rows ?? []
//   const cals: CalendarModelConfig[] = data.calendars?.rows ?? []
//
//   const money = new Intl.NumberFormat('en-US', {
//     style: 'currency',
//     currency: 'USD',
//     maximumFractionDigits: 0,
//   })
//
//   const config = {
//     // IMPORTANT: keep readOnly false so tree expand/collapse works
//     readOnly: false,
//
//     startDate: project.startDate ? new Date(project.startDate) : new Date(2026, 0, 1),
//     endDate: new Date(2030, 5, 30),
//
//     columns: [
//       { type: 'name', field: 'name', width: 250 },
//       {
//         text: 'Assigned To',
//         field: 'assignedTo',
//         width: 140,
//         // eslint-disable-next-line @typescript-eslint/no-explicit-any
//         renderer: ({ record }: { record: any }) => {
//           const person = (record.assignedUserLabel ?? '').toString().trim()
//           if (person) return person
//           const team = (record.assignedTeamLabel ?? '').toString().trim()
//           return team || ''
//         },
//       },
//       {
//         text: 'Cost',
//         field: 'projectedCost',
//         width: 140,
//         align: 'end',
//         renderer: ({ value }: { value: unknown }) => {
//           if (value === null || value === undefined || value === '') return ''
//           const n = Number(value)
//           return Number.isFinite(n) ? money.format(n) : String(value)
//         },
//       },
//     ],
//
//     viewPreset: 'weekAndDayLetter',
//     barMargin: 10,
//
//     // Disable schedule editing, keep tree interactions
//     features: {
//       taskDrag: false,
//       taskResize: false,
//       taskEdit: false,
//     },
//
//     project: {
//       ...project,
//       tasksData: tasks,
//       dependenciesData: deps,
//       calendarsData: cals,
//       autoSetConstraints: true,
//     },
//   }
//
//   return config as unknown as BryntumGanttProps
// }
