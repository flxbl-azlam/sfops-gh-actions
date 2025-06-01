const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const repo = core.getInput('repo', { required: true });
    const environments = core.getInput('environments', { required: true }).split(',');
    const waitTime = parseInt(core.getInput('wait_time', { required: true }));
    const requiredReviewers = core.getInput('required_reviewers', { required: true }).split(',');
    const protectedBranchesOnly = core.getBooleanInput('protected_branches_only', { required: true });

    const [owner, repoName] = repo.split('/');

    const octokit = github.getOctokit(token);

    async function createUpdateEnvironments() {
      const createdRepoEnvironments = [];

      for (const env of environments) {
        const opts = {
          owner,
          repo: repoName,
          environment_name: env,
          wait_timer: waitTime,
          reviewers: await getUsers(),
          deployment_branch_policy: {
            protected_branches: protectedBranchesOnly,
            custom_branch_policies: !protectedBranchesOnly,
          },
        };

        try {
          const { data: environment } = await octokit.rest.repos.createOrUpdateEnvironment(opts);
          createdRepoEnvironments.push(environment);
          console.log(`Created environment [${environment.name}] ${environment.url}`);
        } catch (error) {
          console.error(`Failed to create environment [${env}]`, error);
          throw error;
        }
      }

      return createdRepoEnvironments;
    }

    async function getUsers() {
      const retrievedUsers = [];

      for (const user of requiredReviewers) {
        if (user.includes('/')) {
          const [org, teamSlug] = user.split('/');
          const { data: team } = await octokit.rest.teams.getByName({ org, team_slug: teamSlug });
          retrievedUsers.push({ type: 'Team', id: team.id });
        } else if (user !== '') {
          const { data: userData } = await octokit.rest.users.getByUsername({ username: user });
          retrievedUsers.push({ type: userData.type, id: userData.id });
        }
      }

      return retrievedUsers;
    }

    await createUpdateEnvironments();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

module.exports = { run };