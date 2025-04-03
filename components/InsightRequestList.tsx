'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface InsightRequest {
  _id: string;
  title: string;
  description: string;
  requester: string;
  priority: string;
  status: string;
  dueDate: string;
  category: string;
  createdAt: string;
  githubIssueNumber?: number;
}

export default function InsightRequestList() {
  const [requests, setRequests] = useState<InsightRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }

      const result = await response.json();
      
      // Show success toast for GitHub issue creation only when status is completed
      if (status === 'completed') {
        toast.success('📝 GitHub issue created!', {
          duration: 3000,
        });
      }

      // Refresh the request list
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update request');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete request');
      }

      // Refresh the request list
      fetchRequests();
      
      // Show success toast
      toast.success('Request deleted successfully!', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete request');
    }
  };

  useEffect(() => {
    fetchRequests();

    // Listen for new request submissions
    const handleNewRequest = (event: CustomEvent) => {
      setRequests(prevRequests => [event.detail, ...prevRequests]);
    };

    window.addEventListener('requestSubmitted', handleNewRequest as EventListener);

    return () => {
      window.removeEventListener('requestSubmitted', handleNewRequest as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[#002e25] p-8 border border-[#A5E3B9]/30">
        <h2 className="text-2xl font-bold text-[#CEC9F8] mb-6">Active Requests</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#004c3f] rounded w-3/4"></div>
          <div className="h-4 bg-[#004c3f] rounded w-1/2"></div>
          <div className="h-4 bg-[#004c3f] rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#002e25] p-8 border border-[#A5E3B9]/30">
      <h2 className="text-2xl font-bold text-[#CEC9F8] mb-6">Active Requests</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-[#A5E3B9]">No active requests</p>
        ) : (
          requests.map((request) => (
            <div
              key={request._id}
              className="rounded-lg bg-[#004c3f] p-4 border border-[#A5E3B9]/30"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-[#FCF3B0]">
                    {request.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#A5E3B9]">
                    {request.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={request.status}
                    onChange={(e) => handleStatusChange(request._id, e.target.value)}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-[#002e25] text-[#CEC9F8] border border-[#A5E3B9]/30"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => handleDelete(request._id)}
                    className="px-2 py-1 text-xs font-medium rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                  {request.githubIssueNumber && (
                    <a
                      href={`https://github.com/shopify/insight-requests/issues/${request.githubIssueNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#A5E3B9] hover:text-[#FCF3B0]"
                    >
                      View Issue
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-[#CEC9F8]">
                <span>Requester: {request.requester}</span>
                <span>Priority: {request.priority}</span>
                <span>Due: {new Date(request.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 