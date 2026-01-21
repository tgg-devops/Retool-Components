// src/index.tsx
import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react'
import { BryntumGantt as BryntumGanttBase } from '@bryntum/gantt-react'
import { Retool } from '@tryretool/custom-component-support'

import { makeGanttConfig, DEFAULT_TIMELINE_DATA, type TimelineData } from './CreateGanttConfig'

import '@bryntum/gantt/fontawesome/css/fontawesome.css'
import '@bryntum/gantt/fontawesome/css/solid.css'
import '@bryntum/gantt/gantt.css'
import '@bryntum/gantt/svalbard-light.css'

import './App.scss'

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

export const CreateGanttImpl: React.FC = () => {
  // INPUT from Retool
  const [timelineDataState] = Retool.useStateObject({ name: 'timelineData' })

  // Seed Bryntum once; Bryntum owns live edits internally
  const [initialTimeline] = useState<TimelineData>(() =>
    coerceToTimelineData(timelineDataState as unknown)
  )

  // OUTPUT to Retool (persistable diff JSON)
  const [, setFinalTimelineJson] = Retool.useStateString({
    name: 'finalTimeline',
    initialValue: '{}',
  })

  // ✅ Reset finalTimeline every time the component mounts (i.e., each load/render in Retool)
  useEffect(() => {
    setFinalTimelineJson('{}')
  }, [setFinalTimelineJson])

  const ganttRef = useRef<any>(null)

  const ganttConfig = useMemo(() => makeGanttConfig(initialTimeline), [initialTimeline])

  // ✅ Whenever Bryntum data changes, write persistable diff to finalTimeline
  const handleDataChange = useCallback(() => {
    const ganttInstance = ganttRef.current?.instance
    const project = ganttInstance?.project
    if (!project) return

    const changes = project.changes ?? project.changesData ?? {}

    setFinalTimelineJson(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        changes,
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
