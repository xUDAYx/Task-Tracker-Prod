import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import Analytics from './Analytics';
import TeamManagement from './TeamManagement';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingTask, setEditingTask] = useState(null);

  const handleTaskSuccess = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    // Increment the refresh key to trigger a re-fetch
    setRefreshKey(prev => prev + 1);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
    setActiveTab('tasks');
  };

  const renderContent = () => {
    if (activeTab === 'tasks') {
      if (showTaskForm) {
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button
                onClick={() => {
                  setShowTaskForm(false);
                  setEditingTask(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            <TaskForm
              task={editingTask}
              onSuccess={handleTaskSuccess}
            />
          </div>
        );
      } else {
        return (
          <TaskList 
            onAddClick={() => setShowTaskForm(true)} 
            onEditClick={handleEditClick}
            refreshTrigger={refreshKey}
          />
        );
      }
    } else if (activeTab === 'analytics') {
      return <Analytics />;
    } else if (activeTab === 'team' && user.role === 'manager') {
      return <TeamManagement />;
    }
    
    return null;
  };

  return (
    <div className="min-h-full">
      <nav className="bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="text-white font-bold text-xl">Task Tracker</div>
              <div className="hidden md:block ml-10">
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setActiveTab('tasks');
                      setShowTaskForm(false);
                    }}
                    className={`${
                      activeTab === 'tasks' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('analytics');
                      setShowTaskForm(false);
                    }}
                    className={`${
                      activeTab === 'analytics' 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                  >
                    Analytics
                  </button>
                  {user.role === 'manager' && (
                    <button
                      onClick={() => {
                        setActiveTab('team');
                        setShowTaskForm(false);
                      }}
                      className={`${
                        activeTab === 'team' 
                          ? 'bg-gray-900 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      } px-3 py-2 rounded-md text-sm font-medium`}
                    >
                      Team
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:block">
                <div className="flex items-center">
                  <span className="text-gray-300 mr-4">
                    {user?.first_name} {user?.last_name} ({user?.role})
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {activeTab === 'tasks' && (showTaskForm ? (editingTask ? 'Edit Task' : 'New Task') : 'Tasks')}
            {activeTab === 'analytics' && 'Analytics'}
            {activeTab === 'team' && 'Team Management'}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
} 