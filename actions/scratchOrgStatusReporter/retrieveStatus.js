const { execSync } = require('child_process');
const fs = require('fs');

function getSfpPoolList(devHub) {
    try {
        const output = execSync(`sfp pool:list -v ${devHub} -a --json`).toString();
        return JSON.parse(output);
    } catch (error) {
        console.error('Error executing sfp pool:list:', error);
        return null;
    }
}

function getGithubVariables(githubRepo) {
    try {
        // Fetch the variable names
        const namesCommand = `gh api /repos/${githubRepo}/actions/variables --paginate | gh merge-json | jq -r '.variables[] | select(.name | test("^SO_") or test("_SO$")) | .name'`;
        console.error(`Executing Command: ${namesCommand}`);
        const namesOutput = execSync(namesCommand, { encoding: 'utf8', timeout: 10000 }).toString();
        const variableNames = namesOutput.trim().split('\n');

        // Fetch the value for each variable
        const variables = variableNames.map(name => {
            try {
                const valueCommand = `gh api /repos/${githubRepo}/actions/variables/${name}`;
                console.error(`Executing Command: ${valueCommand}`);
                const valueOutput = execSync(valueCommand, { encoding: 'utf8', timeout: 10000 }).toString();
                const variable = JSON.parse(valueOutput);
                return {
                    name: variable.name,
                    value: variable.value
                };
            } catch (error) {
                console.warn(`Error fetching value for variable ${name}:`, error);
                return null;
            }
        }).filter(v => v !== null);

        return variables;
    } catch (error) {
        console.error('Error getting GitHub variables:', error);
        return [];
    }
}

function correlateAndAugment(sfpData, githubVariables) {
    const foundOrgIds = new Set();

    if (!sfpData || !sfpData.scratchOrgDetails) {
        return foundOrgIds;
    }

    sfpData.scratchOrgDetails.forEach(orgDetail => {
        const relatedVar = githubVariables.find(v => {
            try {
                const varValue = JSON.parse(v.value);
                return varValue.orgId === orgDetail.orgId || v.name.endsWith(`_${orgDetail.orgId.toUpperCase()}_SO`);
            } catch (parseError) {
                console.warn('Error parsing variable value:', parseError);
                return false;
            }
        });

        if (relatedVar) {
            const varValue = JSON.parse(relatedVar.value);
            orgDetail.issueNumber = varValue.issue;
            orgDetail.email = varValue.email;
            orgDetail.username = varValue.username;
            orgDetail.type = relatedVar.name.endsWith('_SO') ? 'review' : 'dev';
            foundOrgIds.add(orgDetail.orgId);
        }
    });

    return foundOrgIds;
}

function deleteUnmatchedVariables(githubRepo, githubVariables, matchedOrgIds) {
    githubVariables.forEach(v => {
        try {
            if (!matchedOrgIds.has(JSON.parse(v.value).orgId)) {
                const command = `gh variable delete ${v.name} --repo ${githubRepo}`;
                execSync(command);
                console.log(`Deleted GitHub variable: ${v.name}`);
            }
        } catch (error) {
            console.error(`Error deleting GitHub variable ${v.name}:`, error);
        }
    });
}

function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node script.js <github-repo>');
        process.exit(1);
    }
    
    const devHub = process.argv[2]
    const githubRepo = process.argv[3]; 
    const pathToFile = process.argv[4]
    const sfpData = getSfpPoolList(devHub);
    const githubVariables = getGithubVariables(githubRepo);

    const matchedOrgIds = correlateAndAugment(sfpData, githubVariables);
    deleteUnmatchedVariables(githubRepo, githubVariables, matchedOrgIds);
    fs.writeFileSync(pathToFile, JSON.stringify(sfpData, null, 2));
}

main();
