import * as core from "@actions/core";
import * as github from "@actions/github";
import { Octokit } from "@octokit/core";
import { RequestError } from "@octokit/request-error";

interface ListDeploymentIDs {
  owner: string;
  repo: string;
  environment: string;
}

interface Deployment {
  owner: string;
  repo: string;
  deploymentId: number;
}

interface Context {
  owner: string;
  repo: string;
}

async function listDeployments(
  client: Octokit,
  { owner, repo, environment }: ListDeploymentIDs,
  page = 0
): Promise<number[]> {
  core.debug(`Getting list of deployments in environment ${environment}`);
  const { data } = await client.request(
    "GET /repos/{owner}/{repo}/deployments",
    {
      owner,
      repo,
      environment,
      per_page: 100,
      page,
    }
  );
  const deploymentIds: number[] = data.map((deployment) => deployment.id);
  core.debug(
    `Getting total of ${deploymentIds.length} deployments on page ${page} `
  );

  if (deploymentIds.length === 100)
    return deploymentIds.concat(
      await listDeployments(client, { owner, repo, environment }, page + 1)
    );

  return deploymentIds;
}

async function setDeploymentInactive(
  client: Octokit,
  { owner, repo, deploymentId }: Deployment
): Promise<void> {
  await client.request(
    "POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
    {
      owner,
      repo,
      deployment_id: deploymentId,
      state: "inactive",
    }
  );
}

async function deleteDeploymentById(
  client: Octokit,
  { owner, repo, deploymentId }: Deployment
): Promise<void> {
  await client.request(
    "DELETE /repos/{owner}/{repo}/deployments/{deployment_id}",
    {
      owner,
      repo,
      deployment_id: deploymentId,
    }
  );
}

async function deleteTheEnvironment(
  client: Octokit,
  environment: string,
  { owner, repo }: Context
): Promise<void> {
  let existingEnv = false;
  try {
    const getEnvResult = await client.request(
      "GET /repos/{owner}/{repo}/environments/{environment_name}",
      {
        owner,
        repo,
        environment_name: environment,
      }
    );
    existingEnv = typeof getEnvResult === "object";
  } catch (err) {
    if ((err as RequestError).status !== 404) {
      core.error("Error deleting environment");
      throw err;
    }
  }

  if (existingEnv) {
    core.info(`Deleting environment ${environment}`);
    await client.request(
      "DELETE /repos/{owner}/{repo}/environments/{environment_name}",
      {
        owner,
        repo,
        environment_name: environment,
      }
    );
    core.info(`Environment ${environment} deleted`);
  }
}

async function processInBatches(items: any, batchSize: any, actionFn: any, client: any, context: any) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item: any) => actionFn(client, { ...context.repo, deploymentId: item })));
    await new Promise(resolve => setTimeout(resolve, 2000)); // Sleep for 2 seconds
  }
}

async function getAllEnvironments(
  client: Octokit,
  { owner, repo }: Context
): Promise<string[]> {
  try {
    const { data } = await client.request("GET /repos/{owner}/{repo}/environments", {
      owner,
      repo,
    });
    return data.environments ? data.environments.map((env: any) => env.name) : [];
  } catch (error) {
    if ((error as RequestError).status === 404) {
      core.info("No environments found in the repository.");
      return [];
    }
    throw error;
  }
}

export async function main(): Promise<void> {
  const { context } = github;
  const token: string = core.getInput("token", { required: true });
  const excludeEnvironmentsInput: string = core.getInput("exclude_environments", { required: true });
  const excludeEnvironments: string[] = excludeEnvironmentsInput.split(",").map(env => env.trim());

  const client: Octokit = github.getOctokit(token);

  try {
    const allEnvironments = await getAllEnvironments(client, context.repo);
    const environmentsToDelete = allEnvironments.filter(env => !excludeEnvironments.map(excludeEnv => excludeEnv.toLowerCase()).includes(env.toLowerCase()));

    core.info(`Environments to delete: ${environmentsToDelete.join(", ")}`);

    for (const environment of environmentsToDelete) {
      core.info(`Processing environment: ${environment}`);

      const deploymentIds = await listDeployments(client, {
        ...context.repo,
        environment,
      });

      core.info(`Found ${deploymentIds.length} deployments for environment ${environment}`);

      await processInBatches(deploymentIds, 30, setDeploymentInactive, client, context);
      await processInBatches(deploymentIds, 30, deleteDeploymentById, client, context);

      await deleteTheEnvironment(client, environment, context.repo);
    }

    core.info("Done");
  } catch (error) {
    core.setFailed((error as RequestError).message);
  }
}