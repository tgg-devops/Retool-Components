// src/index.tsx
import React, { useMemo, useState, useCallback, memo, useRef } from 'react'
import { BryntumGantt as BryntumGanttBase } from '@bryntum/gantt-react'
import { Retool } from '@tryretool/custom-component-support'

import { makeGanttConfig, DEFAULT_TIMELINE_DATA, type TimelineData } from './Gantt/GanttConfig'

import '@bryntum/gantt/fontawesome/css/fontawesome.css'
import '@bryntum/gantt/fontawesome/css/solid.css'
import '@bryntum/gantt/gantt.css'
import '@bryntum/gantt/svalbard-light.css'

import './Gantt/App.scss'

function coerceToTimelineData(value: unknown): TimelineData {
  if (!value || typeof value !== 'object') return DEFAULT_TIMELINE_DATA
  const obj = value as Record<string, unknown>
  const project = (obj.project || DEFAULT_TIMELINE_DATA.project) as TimelineData['project']
  const tasks = (obj.tasks || DEFAULT_TIMELINE_DATA.tasks) as TimelineData['tasks']
  const deps = (obj.dependencies || DEFAULT_TIMELINE_DATA.dependencies) as TimelineData['dependencies']
  const cals = (obj.calendars || DEFAULT_TIMELINE_DATA.calendars) as TimelineData['calendars']
  return { project, tasks, dependencies: deps, calendars: cals }
}

const MemoGantt = memo(BryntumGanttBase)

export const CreateGantt: React.FC = () => {
  const [timelineDataState] = Retool.useStateObject({ name: 'timelineData' })

  const [initialTimeline] = useState<TimelineData>(() =>
    coerceToTimelineData(timelineDataState as unknown)
  )

  // ✅ Keep ONLY this output, but make it a persistable diff instead of a delta log
  const [, setFinalTimelineJson] = Retool.useStateString({
    name: 'finalTimeline',
    initialValue: '{}', // must be literal; use {} instead of [] now
  })

  const ganttRef = useRef<any>(null)

  const ganttConfig = useMemo(() => makeGanttConfig(initialTimeline), [initialTimeline])

  const handleDataChange = useCallback(() => {
    const ganttInstance = ganttRef.current?.instance
    const project = ganttInstance?.project
    if (!project) return

    // ✅ Best for “big SQL update”: persistable diff
    const changes = project.changes ?? project.changesData ?? {}

    // Optional: include snapshot too (handy for debugging)
    // const snapshot = project.inlineData ?? null

    setFinalTimelineJson(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        changes,
        // snapshot,
      })
    )
  }, [setFinalTimelineJson])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MemoGantt
        ref={ganttRef}
        {...ganttConfig}
        onDataChange={handleDataChange}
      />
    </div>
  )
}
