interface InsightRequest {
  title: string;
  description: string;
  requester: string;
  priority: string;
  category: string;
  dueDate: string;
}

export async function sendSlackNotification(request: InsightRequest) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL is not configured');
    return;
  }

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🎯 New Insight Request Submitted",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Title:*\n${request.title}`
          },
          {
            type: "mrkdwn",
            text: `*Requester:*\n${request.requester}`
          },
          {
            type: "mrkdwn",
            text: `*Priority:*\n${request.priority}`
          },
          {
            type: "mrkdwn",
            text: `*Category:*\n${request.category}`
          },
          {
            type: "mrkdwn",
            text: `*Due Date:*\n${new Date(request.dueDate).toLocaleDateString()}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${request.description}`
        }
      }
    ]
  };

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to send Slack notification: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
} 