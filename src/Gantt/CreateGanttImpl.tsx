// src/index.tsx
import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react'
import { BryntumGantt as BryntumGanttBase } from '@bryntum/gantt-react'
import { Retool } from '@tryretool/custom-component-support'

import { makeGanttConfig, DEFAULT_TIMELINE_DATA, type TimelineData, makeViewGanttConfig } from './CreateGanttConfig'

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
  const peopleMap = (obj.peopleMap || DEFAULT_TIMELINE_DATA.peopleMap) as TimelineData['peopleMap']
  return { project, tasks: tasks as any, dependencies: deps, calendars: cals, peopleMap }
}


const MemoGantt = memo(BryntumGanttBase)

export const CreateGanttImpl: React.FC = () => {
  // INPUT from Retool
  const [timelineDataState] = Retool.useStateObject({ name: 'timelineData' })
  const [peopleMapState] = Retool.useStateObject({ name: 'peopleMap' })


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

  const timelineData: TimelineData = useMemo(() => {
    const base = coerceToTimelineData(timelineDataState as unknown)
    const pm   = (peopleMapState && typeof peopleMapState === 'object') ? (peopleMapState as any) : {}
    return { ...base, peopleMap: pm }
  }, [timelineDataState, peopleMapState])

  const ganttConfig = useMemo(
    () => makeGanttConfig(timelineData),
    [timelineData]
  )

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