import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useTask } from '../../contexts/TaskContext';
import { Plus } from 'lucide-react';

const AddTaskForm: React.FC = () => {
  const [taskName, setTaskName] = useState('');
  const { addTask } = useTask();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (taskName.trim()) {
      await addTask(taskName);
      setTaskName('');
      setIsExpanded(false);
    }
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      {isExpanded ? (
        <form onSubmit={handleSubmit} className="p-4">
          <Input
            autoFocus
            placeholder="What needs to be done?"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="mb-3"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setIsExpanded(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={!taskName.trim()}
            >
              Add Task
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 flex items-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-5 w-5 text-indigo-500 mr-2" />
          <span>Add a task</span>
        </button>
      )}
    </div>
  );
};

export default AddTaskForm;