import React, { useState } from 'react';
import api from '../lib/api';

export default function CSVExport() {
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    tag: '',
    employee_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employeeList, setEmployeeList] = useState([]);

  React.useEffect(() => {
    // Fetch team members for the employee dropdown
    const fetchTeamMembers = async () => {
      try {
        console.log('Fetching employees for CSV export...');
        
        // Try multiple endpoint formats
        let response;
        let employees = [];
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
              
              try {
                // Last attempt with trailing slash
                response = await api.get('/team/members/');
                console.log('Fourth team endpoint response:', response);
                succeeded = true;
              } catch (fourthErr) {
                console.error('Fourth endpoint attempt failed:', fourthErr);
              }
            }
          }
        }
        
        if (succeeded && response) {
          // Ensure employee list is always an array
          if (Array.isArray(response.data)) {
            employees = response.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            employees = response.data.results;
          } else if (typeof response.data === 'object') {
            employees = Object.values(response.data);
          } else {
            employees = [];
          }
          
          console.log('Processed employee list for CSV export:', employees);
          setEmployeeList(employees);
        } else {
          console.warn('No successful response from any endpoint, setting empty employee list');
          setEmployeeList([]);
        }
      } catch (err) {
        console.error('Error fetching team members for CSV export:', err);
        setEmployeeList([]);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/analytics/export/', {
        params: filters,
        responseType: 'blob'
      });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tasks_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Ensure employeeList is an array before rendering
  const safeEmployeeList = Array.isArray(employeeList) ? employeeList : [];

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Export Tasks to CSV
        </h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>
            Filter tasks and download them as a CSV file for further analysis or reporting.
          </p>
        </div>
        
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={filters.start_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={filters.end_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700">
              Tag
            </label>
            <input
              type="text"
              id="tag"
              name="tag"
              value={filters.tag}
              onChange={handleChange}
              placeholder="Filter by tag"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              id="employee_id"
              name="employee_id"
              value={filters.employee_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Employees</option>
              {safeEmployeeList.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name || ''} {employee.last_name || ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>
    </div>
  );
} 