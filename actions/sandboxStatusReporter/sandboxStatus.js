const { execSync } = require("child_process");
const fs = require("fs");

function getSandboxStatus(githubRepo) {
  console.error(`🔄 Fetching all github variables from ${githubRepo}...`);

  const output = execSync(
    `gh api /repos/${githubRepo}/actions/variables --paginate | gh merge-json | jq -r .variables[].name`,
  ).toString();

  const variableNames = output.trim().split("\n");
  if (variableNames.length === 0 || variableNames[0] === "") {
    console.error("❌ No variables found...");
    process.exit(1);
  }

  let devSandboxes = [];
  let ciSandboxes = [];

  for (let variableName of variableNames) {
    if (variableName.trim() === "") continue;

    const variableValueOutput = execSync(
      `gh api /repos/${githubRepo}/actions/variables/${variableName.trim()}`,
    ).toString();
    const variableValue = JSON.parse(variableValueOutput);

    let sandbox = {};

    if (variableName.startsWith("CONTEXT_")) {
      // Handle context variables
      const contextPayload = JSON.parse(variableValue.value).payload;

      if (
        contextPayload.jobId === "dev-sandbox-creation-awaiter" ||
        contextPayload.jobId === "dev-sandbox-expiry"
      ) {
        // Developer sandbox
        const daysToKeep = contextPayload.daysToKeep || 0;
        const createdAtTimestamp = Date.parse(variableValue.created_at);

        if (isNaN(createdAtTimestamp)) {
          console.error(
            `❌ Invalid created_at timestamp for variable ${variableName}: ${variableValue.created_at}`,
          );
          continue;
        }

        const expiryTimestamp =
          createdAtTimestamp + daysToKeep * 24 * 60 * 60 * 1000;

        sandbox = {
          ...contextPayload,
          requested_at: variableValue.created_at,
          created_at: contextPayload.createdAt
            ? new Date(Number.parseInt(contextPayload.createdAt)).toISOString()
            : variableValue.created_at,
          type: "Developer",
          expiry_at: new Date(expiryTimestamp).toISOString(),
        };
        devSandboxes.push(sandbox);
      }
    } else {
      // Handle old-style variables
      let type = variableName.endsWith("_DEVSBX")
        ? "Developer"
        : variableName.endsWith("_SBX")
          ? "CI"
          : variableName.endsWith("_SO")? "CI" : null;
      if (!type) continue;

      let domain = variableName.split("_").slice(0, -3).join("_");
      let branch = variableName.split("_").slice(-3, -2)[0];
      const variableData = JSON.parse(variableValue.value);

      let createdAtDate;
      if (variableData.createdAt) {
        createdAtDate = new Date(variableData.createdAt);
        if (isNaN(createdAtDate.getTime())) {
          createdAtDate = new Date(Number(variableData.createdAt));
          if (isNaN(createdAtDate.getTime())) {
            console.error(
              `❌ Invalid createdAt value for variable ${variableName}: ${variableData.createdAt}`,
            );
            continue;
          }
        }
      } else {
        createdAtDate = new Date(variableValue.created_at);
      }

      sandbox = {
        ...variableData,
        requested_at: variableValue.created_at,
        created_at: createdAtDate.toISOString(),
        branch,
        reviewOrgType:variableName.endsWith("_SO")? "scratchorg" : "sandbox",
        assigned_at:
          type !== "Developer" && variableData.assignedAt
            ? new Date(Number(variableData.assignedAt)).toISOString()
            : undefined,
        type,
        domain,
      };

      if (type === "Developer") {
        devSandboxes.push(sandbox);
      } else {
        ciSandboxes.push(sandbox);
      }
    }
  }

  return { devSandboxes, ciSandboxes };
}

function writeSandboxDetailsToFile(sandboxes, filename) {
  fs.writeFileSync(filename, JSON.stringify(sandboxes, null, 2));
  console.log(`✅ Sandbox details written to ${filename}`);
}

function main() {
  const [githubRepo] = process.argv.slice(2);

  console.log(`ℹ️  Executing sandboxStatus.js`);
  try {
    const { devSandboxes, ciSandboxes } = getSandboxStatus(githubRepo);
    writeSandboxDetailsToFile(devSandboxes, "developer_sandboxes.json");
    writeSandboxDetailsToFile(ciSandboxes, "ci_sandboxes.json");
  } catch (err) {
    console.error("❌ Error fetching sandbox status:", err);
  }
}

main();
