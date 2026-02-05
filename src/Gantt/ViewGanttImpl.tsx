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
  const tasks = (obj.tasks || DEFAULT_TIMELINE_DATA.tasks) as TimelineData['tasks']
  const deps = (obj.dependencies || DEFAULT_TIMELINE_DATA.dependencies) as TimelineData['dependencies']
  const cals = (obj.calendars || DEFAULT_TIMELINE_DATA.calendars) as TimelineData['calendars']

  const peopleMap = (obj.peopleMap || DEFAULT_TIMELINE_DATA.peopleMap) as TimelineData['peopleMap']

  const collapsedTasks = {
    rows: collapseAllExpandedFlags(((tasks as any)?.rows as any[]) || []),
  }

  return { project, tasks: collapsedTasks as any, dependencies: deps, calendars: cals, peopleMap }
}

export const ViewGanttImpl: React.FC = () => {
  const [timelineDataState] = Retool.useStateObject({ name: 'timelineData' })
  const [peopleMapState] = Retool.useStateObject({ name: 'peopleMap' })

  const timelineData: TimelineData = useMemo(() => {
    const base = coerceToTimelineData(timelineDataState as unknown)
    const pm = peopleMapState && typeof peopleMapState === 'object' ? (peopleMapState as any) : {}
    return { ...base, peopleMap: pm }
  }, [timelineDataState, peopleMapState])

  const ganttConfig = useMemo(() => makeViewGanttConfig(timelineData), [timelineData])

  // Bryntum instance ref (for zoomToFit)
  const ganttRef = useRef<any>(null)

  // ✅ Wrapper ref used to hard-disable right-click inside the Gantt
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // ✅ zoom out to fit the whole project span
  useEffect(() => {
    const inst = ganttRef.current?.instance
    if (!inst || typeof inst.zoomToFit !== 'function') return

    requestAnimationFrame(() => {
      inst.zoomToFit({ leftMargin: 40, rightMargin: 40, animate: false })
    })
  }, [timelineDataState])

  useEffect(() => {
    // 1) Inject Gotham stylesheet into the iframe document
    const href =
      'https://cdn.jsdelivr.net/npm/gotham-fonts@1.0.3/css/gotham-rounded.min.css'

    const existing = document.querySelector(`link[data-gotham="1"]`) as HTMLLinkElement | null

    const link = existing ?? document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-gotham', '1')

    if (!existing) document.head.appendChild(link)

    // 2) Force Bryntum's font var + fallback hard override
    const styleExisting = document.querySelector(`style[data-bryntum-font="1"]`) as HTMLStyleElement | null
    const style = styleExisting ?? document.createElement('style')
    style.setAttribute('data-bryntum-font', '1')
    style.textContent = `
    :root {
      --bryntum-font-family: 'Gotham Rounded', 'Gotham', -apple-system,
        BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .b-gantt, .b-gantt * {
      font-family: var(--bryntum-font-family) !important;
    }
  `
    if (!styleExisting) document.head.appendChild(style)

    return () => {
    }
  }, [])


  // ✅ HARD KILL SWITCH: disable ALL right-click menus inside the gantt (capture phase)
  useEffect(() => {
    const root = wrapperRef.current
    if (!root) return

    const killContextMenu = (e: MouseEvent) => {
      if (!root.contains(e.target as Node)) return

      e.preventDefault()
      e.stopPropagation()
      ;(e as any).stopImmediatePropagation?.()
      return false
    }

    document.addEventListener('contextmenu', killContextMenu, true) // capture = true
    return () => {
      document.removeEventListener('contextmenu', killContextMenu, true)
    }
  }, [])

  return (
    <div ref={wrapperRef} style={{ height: '100%', width: '100%' }}>
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
