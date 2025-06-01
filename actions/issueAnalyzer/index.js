const core = require("@actions/core");
const github = require("@actions/github");

function parseJsonFromBody(body) {
  const jsonRegex = /<!--\s*(\{.*\})\s*-->/;
  const match = body.match(jsonRegex);
  if (match && match[1]) {
    const jsonString = match[1];
    const parsedData = JSON.parse(jsonString);
    return parsedData;
  }
  return undefined;
}

async function run() {
  const owner = core.getInput("repo_owner");
  const repo = core.getInput("repo_name");
  const issueNumber = parseInt(core.getInput("issue"), 10);
  const token = core.getInput("token");
  const includeIssues = core.getInput("include_issues");
  const excludeIssues = core.getInput("exclude_issues");

  console.error(`----------------------------------------------------`);
  console.error(`🤖  sfops github actions                            `);
  console.error(`🚧  Action: issueAnalyzer`);
  console.error(`----------------------------------------------------`);
  console.error();
  console.error(`ℹ️  issueNumber: ${issueNumber}`);
  console.error(`ℹ️  includeIssues: ${includeIssues}`);
  console.error(`ℹ️  excludeIssues: ${excludeIssues}`);
  console.error();

  const octokit = github.getOctokit(token);
  let issue = undefined;
  try {
    issue = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });
  } catch (error) {
    core.error(`Error fetching issue ${issueNumber}: ${error.message}`);
    core.ExitCode = 1;
    return;
  }
  try {
    const payload = parseJsonFromBody(issue.data.body);

    if (payload) {
      // Check if the issue should be processed based on the include and exclude behaviors
      if (
        (includeIssues && !includeIssues.split(",").includes(payload.id)) ||
        (excludeIssues && excludeIssues.split(",").includes(payload.id))
      ) {
        core.info(`Issue ${issueNumber} is excluded from processing`);
        core.setOutput("sfops_issue", "false");
        return;
      }

      payload["issueNumber"] = issueNumber;
      payload["repoOwner"] = owner;
      payload["repoName"] = repo;
      payload["issueCreator"] = issue.data.user.login;

      // Check if the 'envs' key is present in the parsed issue inputs
      if (!payload.envs) {
        payload.envs = ["devhub"];
      }

      core.info(`Payload: ${JSON.stringify(payload)}`);
      for (const [key, value] of Object.entries(payload)) {
        core.setOutput(`sfops_issue_${key}`, value);
      }
      core.setOutput("sfops_issue_payload", JSON.stringify(payload));
      core.setOutput("sfops_issue", "true");
    } else {
      core.setOutput("sfops_issue", "false");
    }
  } catch (error) {
    core.warning(error.message);
    core.setOutput("sfops_issue", "false");
  }
}

run();
module.exports = { run };
