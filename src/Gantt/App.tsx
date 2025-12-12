// src/Gantt/App.tsx
import React, { FunctionComponent, useMemo, useRef } from 'react';
import { BryntumGantt as BryntumGanttReact } from '@bryntum/gantt-react';
import { makeGanttConfig, DEFAULT_TIMELINE_DATA } from './GanttConfig';
import './App.scss';

const App: FunctionComponent = () => {
  const ganttRef = useRef<any>(null);

  // Build a config once using the default timeline data
  const ganttConfig = useMemo(
    () => makeGanttConfig(DEFAULT_TIMELINE_DATA),
    []
  );

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <BryntumGanttReact ref={ganttRef} {...ganttConfig} />
    </div>
  );
};

export default App;
