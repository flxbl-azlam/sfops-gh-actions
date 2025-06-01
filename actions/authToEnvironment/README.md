# authToEnvironmentAction

This GitHub Action authenticates to a Salesforce environment or sandbox created by a DevHub User. It provides a streamlined way to handle authentication for various Salesforce environments within your GitHub workflows.

## Description

This action performs the following tasks:
1. Authenticates to the DevHub (Production org)
2. Authenticates to the specified environment or sandbox
3. Exports details about the authenticated org

It's particularly useful for CI/CD pipelines that interact with Salesforce orgs and need secure, automated authentication.

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `DEVHUB_SFDX_AUTH_URL` | Auth URL for the DevHub | Yes |
| `ENV_SFDX_AUTH_URL` | Auth URL for the Environment | No |
| `SB_SFDX_AUTH_URL` | Auth URL for the Sandbox | No |
| `environment` | Environment to authenticate to | No |
| `environment-profile` | Environment profile to use | No |
| `org-name` | Name of the sandbox (if `SB_SFDX_AUTH_URL` is not provided) | No |

## Outputs

## Outputs

| Output | Description |
|--------|-------------|
| `alias` | Alias of the authenticated org |
| `org_id` | Org ID of the authenticated org |
| `instance_url` | Instance URL of the authenticated org |
| `username` | Username of the authenticated org |
| `login_url` | Login URL of the authenticated org |
| `access_token` | Access Token of the authenticated org |


## Usage

Here's an example of how to use this action in your workflow:

```yaml
jobs:
  authenticate-salesforce:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Authenticate to Salesforce Org
      uses: your-org/authenticate-salesforce-action@v1
      with:
        DEVHUB_SFDX_AUTH_URL: ${{ secrets.DEVHUB_SFDX_AUTH_URL }}
        ENV_SFDX_AUTH_URL: ${{ secrets.ENV_SFDX_AUTH_URL }}
        environment: 'staging'
        environment-profile: 'staging-profile'
      id: sf-auth
    
    - name: Use authenticated org details
      run: |
        echo "Authenticated to org with ID: ${{ steps.sf-auth.outputs.org_id }}"
        echo "Using API version: ${{ steps.sf-auth.outputs.api_version }}"
```

## Authentication Mechanism and Priority

The action uses a priority-based mechanism to determine how to authenticate to the Salesforce org. Here's how it works:

1. **DevHub Authentication**: 
   - Always authenticates to the DevHub first using the provided `DEVHUB_SFDX_AUTH_URL`.
   - This step is mandatory and occurs regardless of the target environment.

2. **Target Org Authentication**:
   The action then attempts to authenticate to the target org based on the following priority:

   a. If the `environment` input is "prod" or "production":
      - Uses the DevHub authentication (already performed).
      - Sets the alias to "prod" or the value of `environment-profile` if provided.

   b. If `ENV_SFDX_AUTH_URL` is provided:
      - Uses this URL to authenticate to the environment.
      - Sets the alias to the lowercase value of `environment-profile`.

   c. If `SB_SFDX_AUTH_URL` is provided:
      - Uses this URL to authenticate to the sandbox.
      - Sets the alias to the lowercase value of `environment-profile`.

   d. If `org-name` is provided:
      - Attempts to log in to the sandbox with the given name using the DevHub user.
      - Sets the alias to the lowercase value of `environment-profile`.

   e. If none of the above conditions are met:
      - Uses the `environment` input as the org name and attempts to log in using the DevHub user.
      - Sets the alias to the lowercase value of `environment-profile`.

This priority system allows for flexible authentication scenarios while maintaining a clear order of operations.

## Notes

- Ensure that your `DEVHUB_SFDX_AUTH_URL` and other sensitive inputs are stored as secrets in your GitHub repository.
- The action will automatically clean up any temporary files created during the authentication process.
- If authenticating to a sandbox without providing `SB_SFDX_AUTH_URL`, ensure that the DevHub user has permission to access the sandbox.
- The authentication mechanism is case-insensitive for environment names and profiles.