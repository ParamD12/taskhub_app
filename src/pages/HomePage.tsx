import React, { useState } from 'react';
import { CheckCircle2, Circle, User } from 'lucide-react';
import Tabs from '../components/ui/Tabs';
import TaskList from '../components/tasks/TaskList';
import AddTaskForm from '../components/tasks/AddTaskForm';
import ProfileForm from '../components/profile/ProfileForm';
import Header from '../components/layout/Header';
import { TabType } from '../types';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('in-progress');
  
  const tabs = [
    {
      id: 'in-progress',
      label: (
        <div className="flex items-center">
          <Circle className="h-4 w-4 mr-2" />
          <span>In Progress</span>
        </div>
      )
    },
    {
      id: 'completed',
      label: (
        <div className="flex items-center">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          <span>Completed</span>
        </div>
      )
    },
    {
      id: 'profile',
      label: (
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2" />
          <span>Profile</span>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-4 sm:px-0">
            <Tabs 
              tabs={tabs} 
              activeTab={activeTab} 
              onChange={(id) => setActiveTab(id as TabType)} 
              className="mb-6"
            />
            
            <div className="mt-6">
              {activeTab === 'in-progress' && (
                <>
                  <AddTaskForm />
                  <TaskList status="incomplete" />
                </>
              )}
              
              {activeTab === 'completed' && (
                <TaskList status="complete" />
              )}
              
              {activeTab === 'profile' && (
                <ProfileForm />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;