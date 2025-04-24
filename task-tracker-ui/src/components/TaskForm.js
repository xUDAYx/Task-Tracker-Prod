import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function TaskForm({ onSuccess, task = null }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    hours_spent: task?.hours_spent || '',
    task_date: task?.task_date || new Date().toISOString().split('T')[0],
    tags: task?.tags?.join(', ') || '',
    user_id: task?.user || '',
    completed: task?.completed || false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Fetch employees for manager to assign tasks
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare payload
      const payload = {
        ...formData,
        hours_spent: parseFloat(formData.hours_spent),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        completed: formData.completed
      };
      
      // Add user_id if manager is assigning task
      if (user?.role === 'manager' && formData.user_id) {
        payload.user_id = parseInt(formData.user_id);
      } else {
        delete payload.user_id;
      }

      if (task) {
        await api.put(`/tasks/${task.id}/`, payload);
      } else {
        await api.post('/tasks/', payload);
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving task:', err);
      if (err.response?.data) {
        // Handle different types of error responses
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              const messageText = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${messageText}`;
            })
            .join('\n');
          setError(errorMessages);
        } else {
          setError('Failed to save task. Please try again.');
        }
      } else {
        setError('Failed to save task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
        </div>
      )}

      {user?.role === 'manager' && (
        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
            Assign To Employee
          </label>
          <select
            id="user_id"
            name="user_id"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.user_id}
            onChange={handleChange}
          >
            <option value="">Assign to myself</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name} ({employee.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.title}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          id="description"
          rows={3}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.description}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="hours_spent" className="block text-sm font-medium text-gray-700">
          Hours Spent
        </label>
        <input
          type="number"
          name="hours_spent"
          id="hours_spent"
          required
          min="0.1"
          max="8"
          step="0.1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.hours_spent}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="task_date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          name="task_date"
          id="task_date"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.task_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          name="tags"
          id="tags"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g. development, frontend, ui"
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => onSuccess()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
} 