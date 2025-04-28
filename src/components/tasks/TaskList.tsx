import React, { useMemo } from 'react';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { Task } from '../../types';
import TaskItem from './TaskItem';
import { useTask } from '../../contexts/TaskContext';
import { ClipboardList } from 'lucide-react';
import LoadingSkeleton from '../ui/LoadingSkeleton';

type TaskListProps = {
  status: 'incomplete' | 'complete';
};

const TaskList: React.FC<TaskListProps> = ({ status }) => {
  const { tasks, loading } = useTask();

  // Filtering the tasks based on status (incomplete/complete)
  const filteredTasks = useMemo(() => 
    tasks?.filter((task) => task.status === status) || [],
    [tasks, status]
  );

  // Cache for optimizing dynamic row heights
  const cache = useMemo(() => new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 80
  }), []);

  // Loading state: show skeleton
  if (loading || !tasks) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={3} className="h-16" />
      </div>
    );
  }

  // No tasks state: show empty message
  if (!loading && filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          {status === 'incomplete' ? 'No tasks in progress' : 'No completed tasks'}
        </h3>
        <p className="text-gray-500 max-w-sm">
          {status === 'incomplete'
            ? 'Add a new task to get started with your to-do list.'
            : 'Complete some tasks to see them here.'}
        </p>
      </div>
    );
  }

  // Render the list of tasks
  return (
    <div className="h-[calc(100vh-300px)]">
      <AutoSizer>
        {({ width, height }) => (
          <List
            width={width}
            height={height}
            rowCount={filteredTasks.length}
            rowHeight={cache.rowHeight}
            deferredMeasurementCache={cache}
            overscanRowCount={5}
            rowRenderer={({ index, key, style, parent }) => (
              <CellMeasurer
                cache={cache}
                columnIndex={0}
                key={key}
                rowIndex={index}
                parent={parent}
              >
                <div style={style} className="pb-3">
                  <TaskItem task={filteredTasks[index]} />
                </div>
              </CellMeasurer>
            )}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default TaskList;
