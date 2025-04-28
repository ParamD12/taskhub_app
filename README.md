# TaskHub - Task Management App

A full-stack to-do list web application with user authentication and task management functionalities.

## Features

- User registration and authentication
- Create, edit, delete, and mark tasks as complete/incomplete
- View tasks by status (In Progress/Completed)
- User profile management
- Real-time updates with Supabase

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Supabase for authentication and database
- React Router for navigation
- React Hot Toast for notifications

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd taskhub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Connect to Supabase

- Click the "Connect to Supabase" button in the StackBlitz UI
- Create a new Supabase project or connect to an existing one
- This will automatically set up the required environment variables

### 4. Run the migration script

The migration script will create the necessary tables in your Supabase database. It's located in the `supabase/migrations` folder.

### 5. Start the development server

```bash
npm run dev
```

## Database Schema

### Users Table
- `user_id` (Primary Key, UUID)
- `name` (String)
- `email` (Unique String)
- `dob` (Date)

### Tasks Table
- `task_id` (Primary Key, UUID)
- `user_id` (Foreign Key referencing Users)
- `task_name` (String)
- `status` (Enum: 'incomplete', 'complete')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Project Structure

```
src/
├── components/       # UI components
│   ├── auth/         # Authentication components
│   ├── layout/       # Layout components
│   ├── profile/      # Profile components
│   ├── tasks/        # Task-related components
│   └── ui/           # Reusable UI components
├── contexts/         # React context providers
├── lib/              # Utility functions and configurations
├── pages/            # Page components
├── types/            # TypeScript types
└── main.tsx          # Application entry point
```

## License

MIT