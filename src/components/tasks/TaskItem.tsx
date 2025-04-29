import React, { useState } from 'react';
import { Task } from '../../types';
import { Pencil, Trash2, Check } from 'lucide-react';
import { useTask } from '../../contexts/TaskContext';
import { ConfirmDialog } from '../ui/Dialog';
import Dialog from '../ui/Dialog';
import Input from '../ui/Input';
import Button from '../ui/Button';

type TaskItemProps = {
  task: Task;
};

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { updateTaskStatus, updateTaskName, deleteTask } = useTask();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(task.name ?? '');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleStatusChange = async () => {
    const newStatus = task.status === 'complete' ? 'incomplete' : 'complete';
    
    if (task.status === 'incomplete' && newStatus === 'complete') {
      // Moving to completed - no confirmation needed
      await updateTaskStatus(task.id, newStatus);
    } else if (task.status === 'complete' && newStatus === 'incomplete') {
      // Moving back to incomplete - show confirmation
      setIsStatusDialogOpen(true);
    }
  };
  
  const confirmStatusChange = async () => {
    await updateTaskStatus(task.id, 'incomplete');
    setIsStatusDialogOpen(false);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteTask(task.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim() && editedName !== task.name) {
      await updateTaskName(task.id, editedName);
    }
    setIsEditDialogOpen(false);
  };

  return (
    <div className="group flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-shrink-0 mr-3">
        <button 
          onClick={handleStatusChange}
          className={`
            w-5 h-5 rounded-full border flex items-center justify-center transition-colors
            ${
              task.status === 'complete'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-gray-300 hover:border-indigo-500'
            }
          `}
        >
          {task.status === 'complete' && <Check className="w-3 h-3" />}
        </button>
      </div>
      
      <div className="flex-grow min-w-0">
        <h3 
          className={`
            text-sm font-medium text-gray-900 truncate
            ${task.status === 'complete' ? 'line-through text-gray-500' : ''}
          `}
        >
          {task.name}
        </h3>
      </div>
      
      <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            setEditedName(task.name);
            setIsEditDialogOpen(true);
          }}
          className="text-gray-500 hover:text-indigo-600 mr-2"
          aria-label="Edit task"
        >
          <Pencil className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-gray-500 hover:text-red-600"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isDangerous
      />
      
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onConfirm={confirmStatusChange}
        title="Move Task Back"
        message="Move this task back to 'In Progress'?"
        confirmText="Move"
      />
      
      {/* Edit Dialog */}
      <Dialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title="Edit Task"
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEditSubmit}
              disabled={!editedName.trim() || editedName === task.name}
            >
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit}>
          <Input
            label="Task Name"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            placeholder="Enter task name"
            autoFocus
          />
        </form>
      </Dialog>
    </div>
  );
};

export default TaskItem;
