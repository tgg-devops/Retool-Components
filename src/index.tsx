// src/index.tsx
import React from 'react'
import { Retool } from '@tryretool/custom-component-support';

import { CreateGanttImpl } from './Gantt/CreateGanttImpl'
import { ViewGanttImpl } from './Gantt/ViewGanttImpl'
import KanbanBoard from './task_board/KanbanBoardImpl.tsx'


// IMPORTANT: export real components (no recursion)
export const CreateGantt: React.FC = () => <CreateGanttImpl />
export const ViewGantt: React.FC = () => <ViewGanttImpl />
export const TaskBoard = () => {
  Retool.useComponentSettings({
    defaultHeight: 50,
    defaultWidth: 20,
  });

  return <KanbanBoard />;
};