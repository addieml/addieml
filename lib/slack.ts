interface InsightRequest {
  title: string;
  description: string;
  requester: string;
  priority: string;
  category: string;
  dueDate: string;
}

interface SlackMessage {
  text: string;
}

export async function sendSlackNotification(message: SlackMessage) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL is not configured');
    return;
  }

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message.text,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send Slack notification');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
} 