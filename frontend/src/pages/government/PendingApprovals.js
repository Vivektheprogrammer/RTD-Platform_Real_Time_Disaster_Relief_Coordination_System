import React, { useEffect, useState } from 'react';
import { governmentService } from '../../services/api';

const PendingApprovals = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await governmentService.getPendingUsers();
      setUsers(data);
    } catch (e) {
      setError(e?.msg || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (id) => {
    await governmentService.verifyUser(id);
    await load();
  };
  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason');
    await governmentService.rejectUser(id, reason || '');
    await load();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Approvals</h1>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u._id}>
                <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button onClick={() => handleVerify(u._id)} className="px-3 py-1 bg-green-600 text-white rounded">Verify</button>
                  <button onClick={() => handleReject(u._id)} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingApprovals;


