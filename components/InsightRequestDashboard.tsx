'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';

interface InsightRequest {
  _id: string;
  title: string;
  description: string;
  requester: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  dueDate: string;
  createdAt: string;
  githubIssue?: {
    url: string;
    number: number;
  };
}

const priorityColors = {
  low: 'bg-[#A5E3B9]/20 text-[#A5E3B9]',
  medium: 'bg-[#FCF3B0]/20 text-[#FCF3B0]',
  high: 'bg-[#CEC9F8]/20 text-[#CEC9F8]',
  urgent: 'bg-[#FCF3B0]/30 text-[#FCF3B0]',
};

const statusColors = {
  pending: 'bg-[#A5E3B9]/20 text-[#A5E3B9]',
  in_progress: 'bg-[#FCF3B0]/20 text-[#FCF3B0]',
  completed: 'bg-[#CEC9F8]/20 text-[#CEC9F8]',
  cancelled: 'bg-[#FCF3B0]/30 text-[#FCF3B0]',
};

export default function InsightRequestDashboard() {
  const [requests, setRequests] = useState<InsightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<{id: string, message: string} | null>(null);
  const [generatingTitle, setGeneratingTitle] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError('Error loading requests');
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
      const response = await fetch('/api/requests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete request');
      }

      setRequests(requests.filter(request => request._id !== id));
    } catch (err) {
      setError('Error deleting request');
      console.error('Error deleting request:', err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: InsightRequest['status']) => {
    setUpdatingStatus(id);
    setStatusError(null);
    try {
      const response = await fetch('/api/requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setRequests(requests.map(request => 
        request._id === id ? data : request
      ));

      // Show toast for GitHub issue creation
      if (newStatus === 'completed' && data.githubIssue) {
        toast.success('Request marked as completed!', {
          description: (
            <div className="mt-2">
              <p>GitHub issue #{data.githubIssue.number} created.</p>
              <button
                onClick={() => window.open(data.githubIssue.url, '_blank')}
                className="mt-2 text-[#008060] hover:text-[#004c3f] underline transition-colors"
              >
                View on GitHub →
              </button>
            </div>
          ),
          duration: 5000,
        });
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setStatusError({
        id,
        message: err.message
      });
      
      // If it's a GitHub error, we still want to update the status locally
      if (err.message.includes('GitHub')) {
        setRequests(requests.map(request => 
          request._id === id ? { ...request, status: newStatus } : request
        ));
        toast.error('GitHub issue creation failed', {
          description: 'The status was updated but we couldn\'t create the GitHub issue.',
        });
      } else {
        // Revert the select back to the previous status only for non-GitHub errors
        const currentRequest = requests.find(r => r._id === id);
        if (currentRequest) {
          const select = document.querySelector(`select[data-request-id="${id}"]`) as HTMLSelectElement;
          if (select) {
            select.value = currentRequest.status;
          }
        }
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEC9F8]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-[#FCF3B0]/10 p-4 border border-[#FCF3B0]/30">
        <div className="flex">
          <div className="ml-3">
            <p className="text-lg font-medium text-[#FCF3B0]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#002e25',
            border: '1px solid rgba(165, 227, 185, 0.3)',
            color: '#FCF3B0',
          },
        }}
      />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#FCF3B0]">Insight Requests</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl bg-[#002e25] border-[#A5E3B9] text-[#FCF3B0] focus:border-[#CEC9F8] focus:ring-[#CEC9F8]"
        >
          <option value="all" className="bg-[#002e25]">All Status</option>
          <option value="pending" className="bg-[#002e25]">Pending</option>
          <option value="in_progress" className="bg-[#002e25]">In Progress</option>
          <option value="completed" className="bg-[#002e25]">Completed</option>
          <option value="cancelled" className="bg-[#002e25]">Cancelled</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRequests.map((request) => (
          <div
            key={request._id}
            className="bg-[#002e25] rounded-xl border border-[#A5E3B9]/30 p-6 space-y-4"
          >
            <div className="flex justify-between items-center gap-4">
              <h3 className="text-lg font-medium text-[#FCF3B0] flex-1 min-w-0 truncate">
                {generatingTitle === request._id ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse">Generating title...</span>
                    <div className="animate-spin h-4 w-4 border-b-2 border-[#CEC9F8] rounded-full"></div>
                  </span>
                ) : (
                  request.title
                )}
              </h3>
              <button
                onClick={() => handleDelete(request._id)}
                className="text-[#FCF3B0] hover:text-[#FCF3B0]/80 px-2 py-1 rounded-lg hover:bg-[#004c3f] transition-colors flex-shrink-0"
              >
                Delete
              </button>
            </div>

            <p className="text-[#A5E3B9] line-clamp-2">{request.description}</p>

            <div className="flex justify-between items-center text-[#A5E3B9]/80">
              <span>Requester: {request.requester}</span>
              <span>Due: {format(new Date(request.dueDate), 'MMM d, yyyy')}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center gap-4">
                <select
                  data-request-id={request._id}
                  value={request.status}
                  onChange={(e) => handleStatusChange(request._id, e.target.value as InsightRequest['status'])}
                  disabled={updatingStatus === request._id}
                  className={`rounded-xl bg-[#002e25] border-[#A5E3B9] text-[#FCF3B0] focus:border-[#CEC9F8] focus:ring-[#CEC9F8] flex-1 ${
                    updatingStatus === request._id ? 'opacity-50' : ''
                  }`}
                >
                  <option value="pending" className="bg-[#002e25]">To Do</option>
                  <option value="in_progress" className="bg-[#002e25]">In Progress</option>
                  <option value="completed" className="bg-[#002e25]">Done</option>
                  <option value="cancelled" className="bg-[#002e25]">Cancelled</option>
                </select>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                  priorityColors[request.priority]
                }`}>
                  {request.priority}
                </span>
              </div>
              
              {statusError && statusError.id === request._id && (
                <p className="text-[#FCF3B0] text-sm bg-[#FCF3B0]/10 p-2 rounded-lg">
                  {statusError.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 