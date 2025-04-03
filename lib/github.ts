import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface CreateIssueParams {
  title: string;
  description: string;
}

export async function createGitHubIssue({ title, description }: CreateIssueParams) {
  try {
    // Create the issue
    const { data: issue } = await octokit.issues.create({
      owner: 'addieml',
      repo: 'insight-requests',
      title,
      body: `${description}\n\n---\nAutomatically created from Insight Requests Platform`,
      labels: ['insight-request'],
    });

    return issue;
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    throw error;
  }
} 