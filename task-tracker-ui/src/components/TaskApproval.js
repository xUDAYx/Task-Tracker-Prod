import React, { useState } from 'react';
import api from '../lib/api';

export default function TaskApproval({ task, onSuccess, onCancel }) {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Approving task ID:', task.id);
      
      // Try different HTTP methods and endpoints
      const methods = ['put', 'patch', 'post'];
      const endpoints = [
        `/tasks/${task.id}/approve`, 
        `/tasks/${task.id}/approve/`
      ];
      let succeeded = false;
      
      // Try all combinations of methods and endpoints
      for (const method of methods) {
        if (succeeded) break;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying ${method.toUpperCase()} request to ${endpoint}`);
            const response = await api[method](endpoint);
            console.log(`${method.toUpperCase()} response:`, response);
            onSuccess('approved');
            succeeded = true;
            break;
          } catch (err) {
            console.error(`${method.toUpperCase()} request to ${endpoint} failed:`, err);
          }
        }
      }
      
      // If action endpoints failed, try direct task update as fallback
      if (!succeeded) {
        try {
          console.log('Trying direct task update as fallback');
          const response = await api.put(`/tasks/${task.id}/`, {
            ...task,
            status: 'approved'
          });
          console.log('Direct update response:', response);
          onSuccess('approved');
          succeeded = true;
        } catch (err) {
          console.error('Direct task update failed:', err);
        }
      }
      
      // If all attempts failed, throw an error to be caught by the outer catch block
      if (!succeeded) {
        throw new Error('All approval attempts failed');
      }
    } catch (err) {
      console.error('Error approving task:', err);
      let errorMessage = 'Failed to approve task. Please try again.';
      
      if (err.response) {
        console.error('Error response:', err.response);
        if (err.response.data && typeof err.response.data === 'object') {
          const errorDetails = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = `Failed to approve task: ${errorDetails}`;
        } else if (err.response.data) {
          errorMessage = `Failed to approve task: ${err.response.data}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      setError('Feedback is required when rejecting a task.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Rejecting task ID:', task.id, 'with feedback:', feedback);
      
      // Try different HTTP methods and endpoints
      const methods = ['put', 'patch', 'post'];
      const endpoints = [
        `/tasks/${task.id}/reject`, 
        `/tasks/${task.id}/reject/`
      ];
      let succeeded = false;
      
      // Try all combinations of methods and endpoints
      for (const method of methods) {
        if (succeeded) break;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying ${method.toUpperCase()} request to ${endpoint}`);
            const response = await api[method](endpoint, { feedback });
            console.log(`${method.toUpperCase()} response:`, response);
            onSuccess('rejected');
            succeeded = true;
            break;
          } catch (err) {
            console.error(`${method.toUpperCase()} request to ${endpoint} failed:`, err);
          }
        }
      }
      
      // If action endpoints failed, try direct task update as fallback
      if (!succeeded) {
        try {
          console.log('Trying direct task update as fallback');
          const response = await api.put(`/tasks/${task.id}/`, {
            ...task,
            status: 'rejected',
            feedback: feedback
          });
          console.log('Direct update response:', response);
          onSuccess('rejected');
          succeeded = true;
        } catch (err) {
          console.error('Direct task update failed:', err);
        }
      }
      
      // If all attempts failed, throw an error to be caught by the outer catch block
      if (!succeeded) {
        throw new Error('All rejection attempts failed');
      }
    } catch (err) {
      console.error('Error rejecting task:', err);
      let errorMessage = 'Failed to reject task. Please try again.';
      
      if (err.response) {
        console.error('Error response:', err.response);
        if (err.response.data && typeof err.response.data === 'object') {
          const errorDetails = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          errorMessage = `Failed to reject task: ${errorDetails}`;
        } else if (err.response.data) {
          errorMessage = `Failed to reject task: ${err.response.data}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Review Task
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Review the task details and either approve or reject it with feedback.
          </p>
        </div>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="mt-5 border-t border-gray-200 pt-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.title}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.task_date}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Hours Spent</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.hours_spent}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Employee</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.user_name || task.user_email}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{task.description}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Tags</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.tags && task.tags.length > 0
                  ? task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2"
                      >
                        {tag}
                      </span>
                    ))
                  : 'No tags'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-5">
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
            Feedback (required for rejection)
          </label>
          <textarea
            id="feedback"
            name="feedback"
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Provide feedback for the employee..."
          />
        </div>

        <div className="mt-5 flex justify-end space-x-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleApprove}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
} 