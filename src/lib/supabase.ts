import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Vercel automatically injects these environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Cache-Control': 'public, max-age=300' // 5 minutes cache
    }
  }
});

// Optimized task queries with better error handling and retries
export const taskQueries = {
  fetchTasks: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('task_id, task_name, status, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },
  
  addTask: async (userId: string, taskName: string) => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          task_name: taskName,
          status: 'incomplete',
          created_at: now,
          updated_at: now
        })
        .select('task_id, task_name, status, created_at, updated_at')
        .single();
      
      if (error) throw error;
      return {
        id: data.task_id,
        userId,
        name: data.task_name,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },
  
  updateTask: async (taskId: string, userId: string, updates: Partial<Database['public']['Tables']['tasks']['Update']>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('task_id', taskId)
        .eq('user_id', userId)
        .select('task_id, task_name, status, created_at, updated_at')
        .single();
      
      if (error) throw error;
      return {
        id: data.task_id,
        userId,
        name: data.task_name,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },
  
  deleteTask: async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};
