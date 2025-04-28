import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please connect to Supabase to get your credentials.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
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

// Optimized task queries
export const taskQueries = {
  fetchTasks: async (userId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('task_id, task_name, status, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  addTask: async (userId: string, taskName: string) => {
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
    return data;
  },
  
  updateTask: async (taskId: string, userId: string, updates: Partial<Database['public']['Tables']['tasks']['Update']>) => {
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
    return data;
  },
  
  deleteTask: async (taskId: string, userId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};