export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string
          name: string
          email: string
          dob: string | null
        }
        Insert: {
          user_id: string
          name: string
          email: string
          dob?: string | null
        }
        Update: {
          user_id?: string
          name?: string
          email?: string
          dob?: string | null
        }
      }
      tasks: {
        Row: {
          task_id: string
          user_id: string
          task_name: string
          status: 'incomplete' | 'complete'
          created_at: string
          updated_at: string
        }
        Insert: {
          task_id?: string
          user_id: string
          task_name: string
          status?: 'incomplete' | 'complete'
          created_at?: string
          updated_at?: string
        }
        Update: {
          task_id?: string
          user_id?: string
          task_name?: string
          status?: 'incomplete' | 'complete'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}