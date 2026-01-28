import React, { useMemo, memo, useRef, useEffect } from 'react'
import { BryntumGantt as BryntumGanttBase } from '@bryntum/gantt-react'
import { Retool } from '@tryretool/custom-component-support'

import { makeViewGanttConfig, DEFAULT_TIMELINE_DATA, type TimelineData } from './CreateGanttConfig'

import '@bryntum/gantt/fontawesome/css/fontawesome.css'
import '@bryntum/gantt/fontawesome/css/solid.css'
import '@bryntum/gantt/gantt.css'
import '@bryntum/gantt/svalbard-light.css'

import './App.scss'

const MemoGantt = memo(BryntumGanttBase)

function collapseAllExpandedFlags(rows: any[]): any[] {
  const walk = (node: any): any => {
    const copy = { ...node, expanded: false }
    if (Array.isArray(copy.children)) copy.children = copy.children.map(walk)
    return copy
  }
  return (rows || []).map(walk)
}

function coerceToTimelineData(value: unknown): TimelineData {
  if (!value || typeof value !== 'object') return DEFAULT_TIMELINE_DATA
  const obj = value as Record<string, unknown>

  const project = (obj.project || DEFAULT_TIMELINE_DATA.project) as TimelineData['project']
  const tasks   = (obj.tasks || DEFAULT_TIMELINE_DATA.tasks) as TimelineData['tasks']
  const deps    = (obj.dependencies || DEFAULT_TIMELINE_DATA.dependencies) as TimelineData['dependencies']
  const cals    = (obj.calendars || DEFAULT_TIMELINE_DATA.calendars) as TimelineData['calendars']

  const collapsedTasks = {
    rows: collapseAllExpandedFlags(((tasks as any)?.rows as any[]) || []),
  }

  return { project, tasks: collapsedTasks as any, dependencies: deps, calendars: cals }
}

export const ViewGanttImpl: React.FC = () => {
  const [timelineDataState] = Retool.useStateObject({ name: 'timelineData' })

  const timelineData: TimelineData = useMemo(
    () => coerceToTimelineData(timelineDataState as unknown),
    [timelineDataState]
  )

  const ganttConfig = useMemo(
    () => makeViewGanttConfig(timelineData),
    [timelineData]
  )

  // ✅ add a ref so we can call zoomToFit
  const ganttRef = useRef<any>(null)

  // ✅ zoom out to fit the whole project span
  useEffect(() => {
    const inst = ganttRef.current?.instance
    if (!inst || typeof inst.zoomToFit !== 'function') return

    // Wait a tick so Bryntum has laid out the time axis
    requestAnimationFrame(() => {
      inst.zoomToFit({ leftMargin: 40, rightMargin: 40, animate: false })
    })
  }, [timelineDataState])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MemoGantt
        ref={ganttRef}
        {...ganttConfig}

        // hard stops
        onBeforeTaskDrag={() => false}
        onBeforeTaskResize={() => false}
        onBeforeTaskEdit={() => false}
        onBeforePercentBarResize={() => false}
      />
    </div>
  )
}
