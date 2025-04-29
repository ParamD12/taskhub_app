import React, { useMemo, useRef, useEffect } from 'react';
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

  // Filter tasks based on completion status
  const filteredTasks = useMemo(() => 
    tasks?.filter((task) => task.status === status) || [],
    [tasks, status]
  );

  // UseRef for cache to avoid regeneration on each render
  const cacheRef = useRef(
    new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 80,
    })
  );

  // Clear cache when the list size changes (important for empty -> populated transition)
  useEffect(() => {
    cacheRef.current.clearAll();
  }, [filteredTasks.length]);

  // Show loading skeleton while data is loading
  if (loading || !tasks) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={3} className="h-16" />
      </div>
    );
  }

  // Handle empty list case
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

  // Render list of tasks using react-virtualized
  return (
    <div className="h-[calc(100vh-300px)]">
      <AutoSizer>
        {({ width, height }) => (
          <List
            key={filteredTasks.length} // forces re-render when task count changes
            width={width}
            height={height}
            rowCount={filteredTasks.length}
            rowHeight={cacheRef.current.rowHeight}
            deferredMeasurementCache={cacheRef.current}
            overscanRowCount={5}
            rowRenderer={({ index, key, style, parent }) => (
              <CellMeasurer
                cache={cacheRef.current}
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
