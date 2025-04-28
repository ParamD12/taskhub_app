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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tasks with React Query
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: [TASKS_QUERY_KEY, user?.id],
    queryFn: () => user ? taskQueries.fetchTasks(user.id) : Promise.resolve([]),
    enabled: !!user,
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    initialData: () => {
      // Try to get data from cache first
      const cachedData = localStorage.getItem(`tasks_${user?.id}`);
      return cachedData ? JSON.parse(cachedData) : [];
    },
  });

  // Cache tasks in localStorage when they change
  React.useEffect(() => {
    if (user && tasks.length > 0) {
      localStorage.setItem(`tasks_${user.id}`, JSON.stringify(tasks));
    }
  }, [tasks, user]);

  // Add task mutation with optimistic updates
  const addTaskMutation = useMutation({
    mutationFn: (taskName: string) => 
      taskQueries.addTask(user!.id, taskName),
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

      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) => 
        [optimisticTask, ...old]
      );

      return { optimisticTask };
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) => {
        const filteredTasks = old.filter(task => !task.id.startsWith('temp-'));
        return [newTask, ...filteredTasks];
      });
      toast.success('Task added successfully');
    },
    onError: (error, _, context) => {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
      if (context?.optimisticTask) {
        queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY, user?.id], (old = []) =>
          old.filter(task => task.id !== context.optimisticTask.id)
        );
      }
    }
  });

  // Update task status mutation with optimistic updates
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
    }
  });

  // Update task name mutation with optimistic updates
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
    }
  });

  // Delete task mutation with optimistic updates
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => 
      taskQueries.deleteTask(taskId, user!.id),
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
    }
  });

  const contextValue = {
    tasks,
    loading: isLoading,
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
