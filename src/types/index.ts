export type User = {
  id: string;
  name: string;
  email: string;
  dob: string | null;
};

export type Task = {
  id: string;
  userId: string;
  name: string;
  status: 'incomplete' | 'complete';
  createdAt: string;
  updatedAt: string;
};

export type AuthFormData = {
  name?: string;
  email: string;
  password: string;
  dob?: string;
};

export type TabType = 'in-progress' | 'completed' | 'profile';