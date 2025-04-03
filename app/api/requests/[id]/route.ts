import { NextResponse } from 'next/server';
import InsightRequest from '@/models/InsightRequest';
import { createGitHubIssue } from '@/lib/github';
import { sendSlackNotification } from '@/lib/slack';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update the request status
    const updatedRequest = await InsightRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // If the request is completed, create a GitHub issue
    if (status === 'completed' && !updatedRequest.githubIssueNumber) {
      try {
        const issue = await createGitHubIssue({
          title: updatedRequest.title,
          description: `# Insight Request\n\n**Description:** ${updatedRequest.description}\n\n**Requester:** ${updatedRequest.requester}\n\n**Priority:** ${updatedRequest.priority}\n\n**Due Date:** ${new Date(updatedRequest.dueDate).toLocaleDateString()}\n\n**Category:** ${updatedRequest.category}`,
        });

        // Update the request with the GitHub issue number
        updatedRequest.githubIssueNumber = issue.number;
        await updatedRequest.save();

        // Send Slack notification
        await sendSlackNotification({
          text: `🎉 Insight request "${updatedRequest.title}" has been completed!\n\nView the GitHub issue: https://github.com/addieml/insight-requests/issues/${issue.number}`,
        });

        return NextResponse.json({
          ...updatedRequest.toObject(),
          githubSuccess: true
        });
      } catch (error) {
        console.error('Error creating GitHub issue:', error);
        return NextResponse.json(
          { error: 'Failed to create GitHub issue' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete the request
    const deletedRequest = await InsightRequest.findByIdAndDelete(id);

    if (!deletedRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
} 