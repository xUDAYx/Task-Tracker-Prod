import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'employee'
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      console.log('Fetching team members...');
      
      // Try multiple endpoint formats
      let response;
      let succeeded = false;
      
      try {
        // Try first endpoint format
        response = await api.get('/users/team');
        console.log('First team endpoint response:', response);
        succeeded = true;
      } catch (initialErr) {
        console.error('First endpoint attempt failed:', initialErr);
        
        try {
          // Try with trailing slash
          response = await api.get('/users/team/');
          console.log('Second team endpoint response:', response);
          succeeded = true;
        } catch (secondErr) {
          console.error('Second endpoint attempt failed:', secondErr);
          
          try {
            // Try team/members endpoint
            response = await api.get('/team/members');
            console.log('Third team endpoint response:', response);
            succeeded = true;
          } catch (thirdErr) {
            console.error('Third endpoint attempt failed:', thirdErr);
            
            // Last attempt with trailing slash
            response = await api.get('/team/members/');
            console.log('Fourth team endpoint response:', response);
            succeeded = true;
          }
        }
      }
      
      if (succeeded) {
        // Handle different response formats
        let members = [];
        if (Array.isArray(response.data)) {
          members = response.data;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          members = response.data.results;
        } else if (typeof response.data === 'object') {
          members = Object.values(response.data);
        }
        
        console.log('Processed team members:', members);
        setTeamMembers(members);
        setError(null);
      }
    } catch (err) {
      console.error('All team fetching attempts failed:', err);
      setError('Failed to fetch team members. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      console.log('Adding new team member:', newMember);
      
      // Try multiple endpoint formats for adding team member
      const endpoints = [
        '/users/team',
        '/users/team/',
        '/team/members',
        '/team/members/'
      ];
      
      let succeeded = false;
      let lastError = null;
      
      // Try each endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to add member using endpoint: ${endpoint}`);
          const response = await api.post(endpoint, newMember);
          console.log('Add response:', response);
          succeeded = true;
          break;
        } catch (err) {
          console.error(`Failed to add using ${endpoint}:`, err);
          lastError = err;
        }
      }
      
      if (!succeeded) {
        throw lastError || new Error('All add attempts failed');
      }
      
      setShowAddMember(false);
      setNewMember({ email: '', role: 'employee' });
      await fetchTeamMembers();
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          (err.response?.data && typeof err.response.data === 'object' 
                            ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
                            : err.response?.data) || 
                          err.message || 'Unknown error';
      setError(`Failed to add team member: ${errorMessage}. Please check console for details.`);
      console.error('Error adding team member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      setLoading(true);
      console.log('Removing team member with ID:', memberId);
      
      // Try multiple endpoint formats for removing team member
      const endpoints = [
        `/users/team/${memberId}`,
        `/users/team/${memberId}/`,
        `/team/members/${memberId}`,
        `/team/members/${memberId}/`
      ];
      
      let succeeded = false;
      let lastError = null;
      
      // Try each endpoint
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to remove member using endpoint: ${endpoint}`);
          const response = await api.delete(endpoint);
          console.log('Remove response:', response);
          succeeded = true;
          break;
        } catch (err) {
          console.error(`Failed to remove using ${endpoint}:`, err);
          lastError = err;
        }
      }
      
      if (!succeeded) {
        throw lastError || new Error('All removal attempts failed');
      }
      
      await fetchTeamMembers();
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      setError(`Failed to remove team member: ${errorMessage}. Please check console for details.`);
      console.error('Error removing team member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      setLoading(true);
      console.log(`Updating member ${memberId} role to ${newRole}`);
      
      // Try multiple endpoint formats for updating team member role
      const endpoints = [
        `/users/team/${memberId}`,
        `/users/team/${memberId}/`,
        `/team/members/${memberId}`,
        `/team/members/${memberId}/`
      ];
      
      let succeeded = false;
      let lastError = null;
      
      // Try each endpoint with both PATCH and PUT methods
      for (const endpoint of endpoints) {
        // Try PATCH first
        try {
          console.log(`Trying PATCH to endpoint: ${endpoint}`);
          const response = await api.patch(endpoint, { role: newRole });
          console.log('Update response:', response);
          succeeded = true;
          break;
        } catch (patchErr) {
          console.error(`Failed PATCH to ${endpoint}:`, patchErr);
          
          // Try PUT as fallback
          try {
            console.log(`Trying PUT to endpoint: ${endpoint}`);
            const response = await api.put(endpoint, { role: newRole });
            console.log('Update response (PUT):', response);
            succeeded = true;
            break;
          } catch (putErr) {
            console.error(`Failed PUT to ${endpoint}:`, putErr);
            lastError = putErr;
          }
        }
      }
      
      if (!succeeded) {
        throw lastError || new Error('All update attempts failed');
      }
      
      await fetchTeamMembers();
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 
                          (err.response?.data && typeof err.response.data === 'object' 
                            ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
                            : err.response?.data) || 
                          err.message || 'Unknown error';
      setError(`Failed to update member role: ${errorMessage}. Please check console for details.`);
      console.error('Error updating member role:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !teamMembers.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Team Members</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all team members including their name, email, and role.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add member
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="mt-4">
          <form onSubmit={handleAddMember} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={newMember.email}
                onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={newMember.role}
                onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddMember(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">
                        No team members found
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {member.name || member.first_name && member.last_name 
                            ? `${member.first_name || ''} ${member.last_name || ''}`.trim() 
                            : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {member.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            disabled={member.id === user.id}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                          </select>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {member.id !== user.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          )}
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
    </div>
  );
} 