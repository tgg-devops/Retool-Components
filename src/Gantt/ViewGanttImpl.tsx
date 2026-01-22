// src/index.tsx
import React, { useMemo, useCallback, memo, useRef, useEffect } from 'react'
import { BryntumGantt as BryntumGanttBase } from '@bryntum/gantt-react'
import { Retool } from '@tryretool/custom-component-support'

import { viewGanttConfig, DEFAULT_TIMELINE_DATA, type TimelineData } from './ViewGanttConfig'

import '@bryntum/gantt/fontawesome/css/fontawesome.css'
import '@bryntum/gantt/fontawesome/css/solid.css'
import '@bryntum/gantt/gantt.css'
import '@bryntum/gantt/svalbard-light.css'

import './App.scss'

function coerceToTimelineData(value: unknown): TimelineData {
  if (!value || typeof value !== 'object') return DEFAULT_TIMELINE_DATA
  const obj = value as Record<string, unknown>

  const project = (obj.project || DEFAULT_TIMELINE_DATA.project) as TimelineData['project']
  const tasks   = (obj.tasks || DEFAULT_TIMELINE_DATA.tasks) as TimelineData['tasks']
  const deps    = (obj.dependencies || DEFAULT_TIMELINE_DATA.dependencies) as TimelineData['dependencies']
  const cals    = (obj.calendars || DEFAULT_TIMELINE_DATA.calendars) as TimelineData['calendars']

  return { project, tasks, dependencies: deps, calendars: cals }
}

const MemoGantt = memo(BryntumGanttBase)

export const ViewGanttImpl: React.FC = () => {
  // INPUT from Retool
  const [timelineDataState] = Retool.useStateObject({ name: 'timelineData' })

  // ✅ Always derive current timeline from Retool state
  const timelineData: TimelineData = useMemo(
    () => coerceToTimelineData(timelineDataState as unknown),
    [timelineDataState]
  )

  // OUTPUT to Retool (persistable diff JSON)
  const [, setFinalTimelineJson] = Retool.useStateString({
    name: 'finalTimeline',
    initialValue: '{}',
  })

  // Reset finalTimeline when component mounts
  useEffect(() => {
    setFinalTimelineJson('{}')
  }, [setFinalTimelineJson])

  const ganttRef = useRef<any>(null)

  // Build read-only config from *current* timelineData
  const ganttConfig = useMemo(
    () => viewGanttConfig(timelineData),
    [timelineData]
  )

  // Whenever Bryntum data changes, write persistable diff to finalTimeline
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
