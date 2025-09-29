import React, { useEffect, useState } from 'react';
import { governmentService, requestService } from '../../services/api';

const GovDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('emergency');
  const [emergencyForm, setEmergencyForm] = useState({ title: '', message: '', priority: 'high' });
  const [requests, setRequests] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await governmentService.getOverview();
        setOverview(data);
        
        // Load all requests for government to handle
        const requestsData = await governmentService.getRequests();
        setRequests(requestsData);
      } catch (e) {
        setError(e?.msg || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleEmergencyInputChange = (e) => {
    const { name, value } = e.target;
    setEmergencyForm(prev => ({ ...prev, [name]: value }));
  };

  const sendEmergencyAlert = async (e) => {
    e.preventDefault();
    try {
      await governmentService.createEmergencyAlert(emergencyForm);
      setSuccessMessage('Emergency alert sent successfully!');
      setEmergencyForm({ title: '', message: '', priority: 'high' });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.msg || 'Failed to send emergency alert');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const request = requests.find(r => r._id === requestId);
      
      if (action === 'contact') {
        // Contact the requestor
        await governmentService.contactEmergencyRequestor({
          requestId,
          message: 'Government emergency team will contact you soon regarding your request.',
          contactMethod: 'in_app'
        });
        
        setSuccessMessage('Contact message has been sent to the requestor!');
      }
      
      // Refresh requests after action
      const requestsData = await governmentService.getRequests();
      setRequests(requestsData);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.msg || `Failed to process emergency ${action}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Government Dashboard</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex -mb-px">
          <button 
            onClick={() => setActiveTab('emergency')}
            className={`mr-10 py-4 px-4 border-b-2 font-medium text-base ${
              activeTab === 'emergency' 
                ? 'border-blue-600 text-blue-600 font-semibold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Emergency Alerts
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`mr-10 py-4 px-4 border-b-2 font-medium text-base ${
              activeTab === 'requests' 
                ? 'border-blue-600 text-blue-600 font-semibold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Emergency Assistance
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'emergency' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Send Emergency Alert</h2>
          <form onSubmit={sendEmergencyAlert} className="bg-white p-8 rounded-lg shadow-md border border-gray-100 mb-8">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Alert Title
              </label>
              <input
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="title"
                type="text"
                name="title"
                value={emergencyForm.title}
                onChange={handleEmergencyInputChange}
                placeholder="Emergency Alert Title"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
                Alert Message
              </label>
              <textarea
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="message"
                name="message"
                value={emergencyForm.message}
                onChange={handleEmergencyInputChange}
                placeholder="Detailed emergency message"
                rows="5"
                required
              />
            </div>
            <div className="mb-8">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
                Priority Level
              </label>
              <select
                className="shadow-sm border border-gray-300 rounded-md w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="priority"
                name="priority"
                value={emergencyForm.priority}
                onChange={handleEmergencyInputChange}
              >
                <option value="high">High - Immediate Attention</option>
                <option value="medium">Medium - Important</option>
                <option value="low">Low - Informational</option>
              </select>
            </div>
            <div className="flex items-center justify-center">
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200"
                type="submit"
              >
                Send Emergency Alert
              </button>
            </div>
          </form>
        </div>
      )}
      
      {activeTab === 'requests' && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Emergency Assistance Requests</h2>
          <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
            {requests.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No emergency requests available.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Emergency Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request._id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.requestType || request.type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status === 'matched' ? 'pending' : request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.location?.address || request.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRequestAction(request._id, 'contact')}
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                        >
                          Contact
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GovDashboard;


