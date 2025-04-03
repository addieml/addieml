import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'shopify-eyJpZCI6IjZkOWI2MzRmMTcyMGMwZTlkYzY5NWEwZGUzOTM5MmVmIiwibW9kZSI6InBlcnNvbmFsIiwiZW1haWwiOiJhZGRpZS5sZXZpbnNreUBzaG9waWZ5LmNvbSIsImV4cGlyeSI6MTc0MzgwMDMwOX0=-ulQ2bjKMjWrgZJLEWWtBzikWEYizgEIkYBb01LzoHA4=',
  baseURL: 'https://proxy.shopify.ai/v1',
  defaultHeaders: {
    'Authorization': `Bearer shopify-eyJpZCI6IjZkOWI2MzRmMTcyMGMwZTlkYzY5NWEwZGUzOTM5MmVmIiwibW9kZSI6InBlcnNvbmFsIiwiZW1haWwiOiJhZGRpZS5sZXZpbnNreUBzaG9waWZ5LmNvbSIsImV4cGlyeSI6MTc0MzgwMDMwOX0=-ulQ2bjKMjWrgZJLEWWtBzikWEYizgEIkYBb01LzoHA4=`,
    'Content-Type': 'application/json',
  },
});

export async function POST(request: Request) {
  try {
    const { description } = await request.json();

    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters long' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates concise, descriptive titles for insight requests. Keep titles under 60 characters."
        },
        {
          role: "user",
          content: `Generate a concise title for this insight request description: ${description}`
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    const generatedTitle = completion.choices[0]?.message?.content?.trim() || '';

    if (!generatedTitle) {
      return NextResponse.json(
        { error: 'Failed to generate title' },
        { status: 500 }
      );
    }

    return NextResponse.json({ title: generatedTitle });
  } catch (error: any) {
    console.error('Error generating title:', error);
    
    // Handle specific error types
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key or authentication. Please check your OpenAI configuration.' },
        { status: 401 }
      );
    }
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'OpenAI API endpoint not found. Please check the base URL configuration.' },
        { status: 404 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: error.message || 'Failed to generate title' },
      { status: 500 }
    );
  }
} 