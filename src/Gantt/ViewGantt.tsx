// src/index.tsx
import React, { useMemo, useState } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import { Retool } from '@tryretool/custom-component-support';

import {
  makeReadOnlyGanttConfig,
  DEFAULT_TIMELINE_DATA,
  type TimelineData,
} from './ViewGanttConfig.ts';

// Bryntum CSS
import '@bryntum/gantt/fontawesome/css/fontawesome.css';
import '@bryntum/gantt/fontawesome/css/solid.css';
import '@bryntum/gantt/gantt.css';
import '@bryntum/gantt/svalbard-light.css';

// Your local styles
import './App.scss';

// helper to coerce whatever Retool gives into TimelineData
function coerceToTimelineData(value: unknown): TimelineData {
  if (!value || typeof value !== 'object') return DEFAULT_TIMELINE_DATA;
  const obj = value as Record<string, unknown>;

  const project = (obj.project || DEFAULT_TIMELINE_DATA.project) as TimelineData['project'];
  const tasks   = (obj.tasks || DEFAULT_TIMELINE_DATA.tasks) as TimelineData['tasks'];
  const deps    = (obj.dependencies || DEFAULT_TIMELINE_DATA.dependencies) as TimelineData['dependencies'];
  const cals    = (obj.calendars || DEFAULT_TIMELINE_DATA.calendars) as TimelineData['calendars'];

  return { project, tasks, dependencies: deps, calendars: cals };
}

export const ReadOnlyGantt: React.FC = () => {
  // INPUT from Retool – bind this to your JSON:
  // ReadOnlyGantt.timelineData = {{ yourJsonObject }}
  const [timelineDataState] = Retool.useStateObject({
    name: 'timelineData',
  });

  // Fix the initial timeline for this session
  const [initialTimeline] = useState<TimelineData>(() =>
    coerceToTimelineData(timelineDataState as unknown)
  );

  // Build the read-only config
  const ganttConfig = useMemo(
    () => makeReadOnlyGanttConfig(initialTimeline),
    [initialTimeline]
  );

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <BryntumGantt {...ganttConfig} />
    </div>
  );
};
