// src/index.tsx
import React, {
  useMemo,
  useState,
  useCallback,
  memo,
} from 'react';
import { BryntumGantt as BryntumGanttBase } from '@bryntum/gantt-react';
import { Retool } from '@tryretool/custom-component-support';

import {
  makeGanttConfig,
  DEFAULT_TIMELINE_DATA,
  type TimelineData,
} from './Gantt/GanttConfig';

// Bryntum CSS
import '@bryntum/gantt/fontawesome/css/fontawesome.css';
import '@bryntum/gantt/fontawesome/css/solid.css';
import '@bryntum/gantt/gantt.css';
import '@bryntum/gantt/svalbard-light.css';

// Your local styles (e.g. .b-gantt { height: '100%' })
import './Gantt/App.scss';

// Coerce whatever Retool gives us into TimelineData
function coerceToTimelineData(value: unknown): TimelineData {
  if (!value || typeof value !== 'object') {
    return DEFAULT_TIMELINE_DATA;
  }

  const obj = value as Record<string, unknown>;

  const project = (obj.project || DEFAULT_TIMELINE_DATA.project) as TimelineData['project'];
  const tasks   = (obj.tasks || DEFAULT_TIMELINE_DATA.tasks) as TimelineData['tasks'];
  const deps    = (obj.dependencies || DEFAULT_TIMELINE_DATA.dependencies) as TimelineData['dependencies'];
  const cals    = (obj.calendars || DEFAULT_TIMELINE_DATA.calendars) as TimelineData['calendars'];

  return {
    project,
    tasks,
    dependencies: deps,
    calendars   : cals,
  };
}

// Shape of a change event (delta)
type DataChangeDelta = {
  storeId: string;
  action: string;
  // we record shallow snapshots of records' data
  records: Array<Record<string, unknown>>;
  timestamp: string;
};

// Memoized Gantt so it doesn't re-render on deltas/finalTimeline changes
const MemoGantt = memo(BryntumGanttBase);

export const CreateGantt: React.FC = () => {
  // 1) INPUT from Retool – bind this to your transformer:
  //    CreateGantt.timelineData = {{ bryntumTimeline.value }}
  const [timelineDataState] = Retool.useStateObject({
    name: 'timelineData',
  });

  // Coerce the input once; Bryntum owns live edits internally
  const [initialTimeline] = useState<TimelineData>(() =>
    coerceToTimelineData(timelineDataState as unknown)
  );

  // 2) OUTPUT to Retool – JSON string of data-change deltas
  //    In Retool you'll read this as {{ CreateGantt1.finalTimeline }}
  const [, setFinalTimelineJson] = Retool.useStateString({
    name: 'finalTimeline',
    initialValue: '[]', // literal, as required
  });

  // Local React state to accumulate deltas
  const [deltas, setDeltas] = useState<DataChangeDelta[]>([]);

  // Build Bryntum config once; keep the same reference
  const ganttConfig = useMemo(
    () => makeGanttConfig(initialTimeline),
    [initialTimeline]
  );

  // Helper: register a delta and mirror to finalTimelineJson
  const registerDelta = useCallback(
    (delta: DataChangeDelta) => {
      setDeltas(prev => {
        const next = [...prev, delta];
        setFinalTimelineJson(JSON.stringify(next));
        return next;
      });
    },
    [setFinalTimelineJson]
  );

  // 3) onDataChange listener (per Bryntum docs)
  const handleDataChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (args: any) => {
      const { store, action, records } = args || {};
      const storeId = store?.id ?? 'unknown';

      const recordSnapshots: Array<Record<string, unknown>> = Array.isArray(records)
        ? records.map((rec: unknown) => {
          if (rec && typeof rec === 'object' && 'data' in (rec as Record<string, unknown>)) {
            const r = rec as { data: Record<string, unknown> };
            return r.data;
          }
          return (rec as Record<string, unknown>) ?? {};
        })
        : [];

      registerDelta({
        storeId,
        action: String(action ?? ''),
        records: recordSnapshots,
        timestamp: new Date().toISOString(),
      });
    },
    [registerDelta]
  );

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MemoGantt
        {...ganttConfig}
        onDataChange={handleDataChange}
      />
    </div>
  );
};
