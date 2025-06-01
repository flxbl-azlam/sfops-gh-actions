import * as github from '@actions/github';
import * as core from '@actions/core';

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github_token');

    const labels = core
      .getMultilineInput('labels')
      .filter(l => l !== '');
    const [owner, repo] = core.getInput('repo').split('/');
    const number =
      core.getInput('number') === ''
        ? github.context.issue.number
        : parseInt(core.getInput('number'));

    if (labels.length === 0) {
      return;
    }

    const client = github.getOctokit(githubToken);


    for (const label of labels) {
      try {
        await client.rest.issues.removeLabel({
          name: label,
          owner,
          repo,
          issue_number: number
        });
      } catch (e) {
        core.debug(`failed to remove label: ${label}: ${e}`);
      }
    }
  } catch (e:any) {
    core.error(e);
  
    if (core.getBooleanInput('fail_on_error')) {
      core.setFailed(e.message);
    }
  }
}

run();