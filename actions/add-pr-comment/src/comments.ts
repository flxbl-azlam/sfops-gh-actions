import { GitHub } from '@actions/github/lib/utils'
import {
  CreateIssueCommentResponseData,
  ExistingIssueComment,
  ExistingIssueCommentResponseData,
} from './types'

// GitHub has a 64KB limit on comment size, we use 60KB to be safe
const GITHUB_COMMENT_MAX_SIZE = 61440; // 60 * 1024 bytes

function truncateComment(body: string): string {
  if (Buffer.byteLength(body, 'utf8') <= GITHUB_COMMENT_MAX_SIZE) {
    return body;
  }
  
  const truncationMessage = '\n\n[Comment was truncated due to GitHub\'s size limit]';
  let truncated = body;
  
  // Keep truncating until we're under the limit including our message
  while (Buffer.byteLength(truncated + truncationMessage, 'utf8') > GITHUB_COMMENT_MAX_SIZE) {
    // Remove characters from the middle to preserve context at start and end
    const halfLength = Math.floor(truncated.length / 2);
    const quarterLength = Math.floor(halfLength / 2);
    truncated = truncated.slice(0, quarterLength) + '\n...\n' + truncated.slice(-quarterLength);
  }
  
  return truncated + truncationMessage;
}

export async function getExistingComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  issueNumber: number,
  messageId: string,
): Promise<ExistingIssueComment | undefined> {
  const parameters = {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  }

  let found: ExistingIssueCommentResponseData | undefined

  for await (const comments of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters,
  )) {
    found = comments.data.find(({ body }) => {
      return (body?.search(messageId) ?? -1) > -1
    })

    if (found) {
      break
    }
  }

  if (found) {
    const { id, body } = found
    return { id, body }
  }

  return
}

export async function updateComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  existingCommentId: number,
  body: string,
): Promise<CreateIssueCommentResponseData> {
  const truncatedBody = truncateComment(body);
  
  const updatedComment = await octokit.rest.issues.updateComment({
    comment_id: existingCommentId,
    owner,
    repo,
    body: truncatedBody,
  })

  return updatedComment.data
}

export async function deleteComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  existingCommentId: number,
  body: string,
): Promise<CreateIssueCommentResponseData> {
  const deletedComment = await octokit.rest.issues.deleteComment({
    comment_id: existingCommentId,
    owner,
    repo,
    body,
  })

  return deletedComment.data
}

export async function createComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<CreateIssueCommentResponseData> {
  const truncatedBody = truncateComment(body);
  
  const createdComment = await octokit.rest.issues.createComment({
    issue_number: issueNumber,
    owner,
    repo,
    body: truncatedBody,
  })

  return createdComment.data
}
