import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '../types';
import { useAuth } from './AuthContext';
import { taskQueries } from '../lib/supabase';
import toast from 'react-hot-toast';

type TaskContextType = {
  tasks: Task[];
  loading: boolean;
  addTask: (taskName: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: 'incomplete' | 'complete') => Promise<void>;
  updateTaskName: (taskId: string, taskName: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const TASKS_QUERY_KEY = 'tasks';

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();  // <- ensure authLoading available
  const queryClient = useQueryClient();

  const {
    data: tasks = [],
    isLoading: taskLoading,
    isFetching,
  } = useQuery({
    queryKey: [TASKS_QUERY_KEY, user?.id],
    queryFn: () => user ? taskQueries.fetchTasks(user.id) : Promise.resolve([]),
    enabled: !!user?.id && !authLoading,  // <- Don't run until user ready
    select: useCallback((data) =>
      data.map(task => ({
        id: task.task_id,
        userId: user!.id,
        name: task.task_name,
        status: task.status,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      })),
    [user]),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const loading = authLoading || taskLoading || isFetching;

  const prefetchTasks = useCallback(async () => {
    if (user?.id) {
      await queryClient.prefetchQuery({
        queryKey: [TASKS_QUERY_KEY, user.id],
        queryFn: () => taskQueries.fetchTasks(user.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [user?.id, queryClient]);

  React.useEffect(() => {
    if (user?.id) {
      prefetchTasks();
    }
  }, [prefetchTasks, user?.id]);

  const addTaskMutation = useMutation({
    mutationFn: (taskName: string) => taskQueries.addTask(user!.id, taskName),
    onMutate: async (taskName) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });

      const optimisticTask = {
        id: 'temp-' + Date.now(),
        userId: user!.id,
        name: taskName,
        status: 'incomplete' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) => [optimisticTask, ...old]);
      return { optimisticTask };
    },
    onSuccess: () => {
      toast.success('Task added successfully');
    },
    onError: (error) => {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });
    }
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string, status: 'incomplete' | 'complete' }) =>
      taskQueries.updateTask(taskId, user!.id, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });

      const previousTasks = queryClient.getQueryData<Task[]>([TASKS_QUERY_KEY, user?.id]);

      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) =>
        old.map(task =>
          task.id === taskId
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (error, variables, context) => {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task');
      if (context?.previousTasks) {
        queryClient.setQueryData([TASKS_QUERY_KEY, user?.id], context.previousTasks);
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(`Task marked as ${status}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });
    }
  });

  const updateTaskNameMutation = useMutation({
    mutationFn: ({ taskId, taskName }: { taskId: string, taskName: string }) =>
      taskQueries.updateTask(taskId, user!.id, { task_name: taskName }),
    onMutate: async ({ taskId, taskName }) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });

      const previousTasks = queryClient.getQueryData<Task[]>([TASKS_QUERY_KEY, user?.id]);

      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) =>
        old.map(task =>
          task.id === taskId
            ? { ...task, name: taskName, updatedAt: new Date().toISOString() }
            : task
        )
      );

      return { previousTasks };
    },
    onError: (error, variables, context) => {
      console.error('Error updating task name:', error);
      toast.error('Failed to update task');
      if (context?.previousTasks) {
        queryClient.setQueryData([TASKS_QUERY_KEY, user?.id], context.previousTasks);
      }
    },
    onSuccess: () => {
      toast.success('Task updated successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskQueries.deleteTask(taskId, user!.id),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });

      const previousTasks = queryClient.getQueryData<Task[]>([TASKS_QUERY_KEY, user?.id]);

      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) =>
        old?.filter(task => task.id !== taskId) ?? []
      );

      return { previousTasks };
    },
    onError: (error, variables, context) => {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      if (context?.previousTasks) {
        queryClient.setQueryData([TASKS_QUERY_KEY, user?.id], context.previousTasks);
      }
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY, user?.id] });
    }
  });

  const contextValue = {
    tasks,
    loading,
    addTask: (taskName: string) => addTaskMutation.mutateAsync(taskName),
    updateTaskStatus: (taskId: string, status: 'incomplete' | 'complete') =>
      updateTaskStatusMutation.mutateAsync({ taskId, status }),
    updateTaskName: (taskId: string, taskName: string) =>
      updateTaskNameMutation.mutateAsync({ taskId, taskName }),
    deleteTask: (taskId: string) => deleteTaskMutation.mutateAsync(taskId)
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
