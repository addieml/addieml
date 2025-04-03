import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InsightRequest from '@/models/InsightRequest';
import { sendSlackNotification } from '@/lib/slack';
import { createGitHubIssue } from '@/lib/github';

interface CreateIssueParams {
  title: string;
  description: string;
  labels: string[];
}

interface RequestBody {
  title?: string;
  description: string;
  requester: string;
  priority: string;
  dueDate: string;
  category: string;
}

interface InsightRequestData {
  title: string;
  description: string;
  requester: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  category: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { title, description, requester, priority, dueDate, category } = body;

    // Generate title using OpenAI
    const titleResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3009'}/api/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!titleResponse.ok) {
      const errorData = await titleResponse.json();
      throw new Error(errorData.error || 'Failed to generate title');
    }

    const { title: generatedTitle } = await titleResponse.json();

    // Create the request in the database
    const insightRequest = await InsightRequest.create({
      title: generatedTitle || title,
      description,
      requester,
      priority,
      dueDate: new Date(dueDate),
      category,
      status: 'pending',
    });

    // Create GitHub issue
    const issue = await createGitHubIssue({
      title: generatedTitle || title || '',
      description: `**Description:** ${description}\n\n**Requester:** ${requester}\n**Priority:** ${priority}\n**Due Date:** ${dueDate}\n**Category:** ${category}`,
    });

    // Update the request with the GitHub issue number
    insightRequest.githubIssueNumber = issue.number;
    await insightRequest.save();

    // Send Slack notification
    await sendSlackNotification({
      text: `New Insight Request: ${generatedTitle || title}\nDescription: ${description}\nRequester: ${requester}\nPriority: ${priority}\nDue Date: ${dueDate}\nCategory: ${category}`
    });

    return NextResponse.json({
      ...insightRequest.toObject(),
      slackSuccess: true,
      githubSuccess: true
    });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const requests = await InsightRequest.find().sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json() as { id: string };
    await InsightRequest.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json() as { id: string; status: string };
    const updatedRequest = await InsightRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
} 