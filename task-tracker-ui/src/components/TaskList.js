import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import TaskApproval from './TaskApproval';

export default function TaskList({ onAddClick, onEditClick, refreshTrigger }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    tag: '',
    search: '',
    employee_id: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1
  });
  const [employees, setEmployees] = useState([]);
  const { user } = useAuth();

  // Fetch employees for filter if user is manager
  useEffect(() => {
    if (user?.role === 'manager') {
      const fetchEmployees = async () => {
        try {
          console.log('Fetching employees with user:', user);
          // Try the endpoint without trailing slash first
          const response = await api.get('/users/team');
          
          console.log('Employees response:', response);
          
          // Ensure employees is always an array and contains valid data
          let employeeData = [];
          
          if (response.data) {
            if (Array.isArray(response.data)) {
              employeeData = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
              employeeData = response.data.results;
            } else if (typeof response.data === 'object') {
              // In case the API returns an object with employee data
              employeeData = Object.values(response.data);
            }
          }
          
          if (employeeData.length === 0) {
            console.warn('No employees found in the response. Response data:', response.data);
          } else {
            console.log('Found', employeeData.length, 'employees');
          }
          
          setEmployees(employeeData);
        } catch (err) {
          console.error('Error fetching employees:', err.response || err);
          // Try alternative endpoint with trailing slash as fallback
          try {
            console.log('Trying alternative endpoint with trailing slash');
            const fallbackResponse = await api.get('/users/team/');
            const employeeData = Array.isArray(fallbackResponse.data) 
              ? fallbackResponse.data 
              : (fallbackResponse.data?.results || []);
            
            setEmployees(employeeData);
          } catch (fallbackErr) {
            console.error('Both employee fetch attempts failed:', fallbackErr.response || fallbackErr);
            setEmployees([]);
          }
        }
      };
      fetchEmployees();
    }
  }, [user?.role]);

  useEffect(() => {
    fetchTasks();
  }, [filters, pagination.page, refreshTrigger]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        ...filters
      };
      const response = await api.get('/tasks/', { params });
      setTasks(response.data.results || response.data || []);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil((response.data.count || response.data.length || 0) / 10)
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReviewClick = (task) => {
    console.log('Opening review for task:', task);
    setReviewingTask(task);
  };

  const handleReviewSuccess = (result) => {
    console.log('Review completed with result:', result);
    setReviewingTask(null);
    fetchTasks();
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}/`);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await api.put(`/tasks/${task.id}/`, updatedTask);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task completion status:', error);
      alert('Failed to update task status. Please try again.');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !tasks.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (reviewingTask) {
    return (
      <TaskApproval 
        task={reviewingTask}
        onSuccess={handleReviewSuccess}
        onCancel={() => setReviewingTask(null)}
      />
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all tasks and their current status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={onAddClick}
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {user?.role === 'manager' && (
          <div>
            <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              id="employee_id"
              name="employee_id"
              value={filters.employee_id}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Employees</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            type="text"
            id="search"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search tasks..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Task Table */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Hours
                    </th>
                    {user?.role === 'manager' && (
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Assigned To
                      </th>
                    )}
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tags
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Completed
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'manager' ? 8 : 7} className="px-3 py-4 text-sm text-center text-gray-500">
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {task.title}
                          {user?.role === 'employee' && task.user !== user.id && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Assigned
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {task.task_date}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {task.hours_spent}
                        </td>
                        {user?.role === 'manager' && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {task.user_id === user.id ? (
                              <span className="text-gray-500">You</span>
                            ) : (
                              <span>{task.user_name}</span>
                            )}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeColor(task.status)}`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </span>
                          {task.status === 'rejected' && task.feedback && (
                            <div className="text-xs text-red-600 mt-1">
                              Feedback: {task.feedback}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {task.tags && task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {task.completed ? (
                            <span className="text-green-500">Completed</span>
                          ) : (
                            <span className="text-red-500">Not Completed</span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            {task.status === 'pending' && (
                              <>
                                {user.role === 'manager' ? (
                                  <button
                                    onClick={() => handleReviewClick(task)}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    Review
                                  </button>
                                ) : (
                                  (task.user === user.id) && (
                                    <button
                                      onClick={() => onEditClick(task)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Edit
                                    </button>
                                  )
                                )}
                                {(user.role === 'manager' || task.user === user.id) && (
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                )}
                              </>
                            )}
                            {task.status === 'rejected' && task.user === user.id && (
                              <button
                                onClick={() => onEditClick(task)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit & Resubmit
                              </button>
                            )}
                            {task.status === 'approved' && task.user === user.id && (
                              <button
                                onClick={() => handleToggleComplete(task)}
                                className={`${task.completed ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                              >
                                {task.completed ? 'Mark Not Done' : 'Mark Done'}
                              </button>
                            )}
                            {task.status === 'approved' && (
                              task.completed ? (
                                <span className="text-green-600">✓</span>
                              ) : user.role === 'manager' ? (
                                <span className="text-gray-400">Pending completion</span>
                              ) : null
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
              disabled={pagination.page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 