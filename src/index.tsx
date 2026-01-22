// src/index.tsx
import React from 'react';
import { CreateGanttImpl } from './Gantt/CreateGanttImpl';
import { ViewGanttImpl } from './Gantt/ViewGanttImpl.tsx';


export const CreateGantt: React.FC = () => {
  return <CreateGanttImpl />;
};

export const ViewGantt: React.FC = () => {
  return <ViewGanttImpl />;
}
