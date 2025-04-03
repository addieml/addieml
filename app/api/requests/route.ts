import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InsightRequest from '@/models/InsightRequest';
import { sendSlackNotification } from '@/lib/slack';

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
    const body: InsightRequestData = await request.json();
    await connectDB();
    
    const newRequest = await InsightRequest.create(body);
    
    // Send Slack notification
    await sendSlackNotification(body);
    
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating insight request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const requests = await InsightRequest.find({}).sort({ createdAt: -1 });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching insight requests' },
      { status: 500 }
    );
  }
} 