// src/index.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { BryntumGantt } from '@bryntum/gantt-react';
import { Retool } from '@tryretool/custom-component-support';

import {
  makeGanttConfig,
  DEFAULT_TIMELINE_DATA,
  type TimelineData,
} from './GanttConfig';

// Bryntum CSS
import '@bryntum/gantt/fontawesome/css/fontawesome.css';
import '@bryntum/gantt/fontawesome/css/solid.css';
import '@bryntum/gantt/gantt.css';
import '@bryntum/gantt/svalbard-light.css';

// Your local styles (e.g. .b-gantt { height: '100%' })
import './App.scss';

export const CreateGantt: React.FC = () => {
  // 1) INPUT from Retool – you already bind this to your transformer
  const [timelineDataState] = Retool.useStateObject({
    name: 'timelineData',
  });

  // 2) OUTPUT to Retool – JSON string of the edited timeline
  //    In Retool you'll read this as {{ bryntumGanttComponent1.finalTimeline }}
  const [, setFinalTimelineJson] = Retool.useStateString({
    name: 'finalTimeline',
    initialValue: '',
  });

  // Safely coerce the Retool state into our TimelineData type
  const timelineData: TimelineData = useMemo(() => {
    const value = timelineDataState as unknown;

    if (!value || typeof value !== 'object') {
      return DEFAULT_TIMELINE_DATA;
    }

    if (Object.keys(value as Record<string, unknown>).length === 0) {
      return DEFAULT_TIMELINE_DATA;
    }

    return value as TimelineData;
  }, [timelineDataState]);

  const ganttConfig = useMemo(
    () => makeGanttConfig(timelineData),
    [timelineData]
  );

  // 3) Ref to get the Bryntum Gantt instance
  const ganttRef = useRef<BryntumGantt | null>(null);

  // 4) On changes inside Bryntum, snapshot the project into JSON
  useEffect(() => {
    const refCurrent = ganttRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = (refCurrent as any)?.instance;
    if (!instance) return;

    const project = instance.project;
    const taskStore = project.taskStore;
    const dependencyStore = project.dependencyStore;

    const syncFromProject = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tasks = taskStore.records.map((r: any) => r.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dependencies = dependencyStore.records.map((r: any) => r.data);

      const base = timelineData;

      const updated: TimelineData = {
        project: {
          ...(base.project || {}),
          startDate: project.startDate
            ? project.startDate.toISOString().slice(0, 10)
            : base.project?.startDate,
        },
        calendars: base.calendars || { rows: [] },
        tasks: { rows: tasks },
        dependencies: { rows: dependencies },
      };

      setFinalTimelineJson(JSON.stringify(updated));
    };

    // Bryntum stores' on() returns a detacher function
    const detachUpdate = taskStore.on('update', syncFromProject);
    const detachAdd = taskStore.on('add', syncFromProject);
    const detachRemove = taskStore.on('remove', syncFromProject);

    const detachDepAdd = dependencyStore.on('add', syncFromProject);
    const detachDepRemove = dependencyStore.on('remove', syncFromProject);

    // We don't call syncFromProject immediately –
    // finalTimeline will fill once the user makes an edit.

    return () => {
      detachUpdate();
      detachAdd();
      detachRemove();
      detachDepAdd();
      detachDepRemove();
    };
  }, [timelineData, setFinalTimelineJson]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <BryntumGantt ref={ganttRef} {...ganttConfig} />
    </div>
  );
};
