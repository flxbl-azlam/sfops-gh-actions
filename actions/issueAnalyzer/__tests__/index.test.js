const core = require('@actions/core');
const github = require('@actions/github');
const { run } = require('../index');

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('Analyze Issue', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('sets output variables for a valid issue', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        default:
          return '';
      }
    });

    // Mock the GitHub API response
    const issueBody = `
      <!-- {"id": "issue-1", "envs": ["prod"]} -->
      Issue description
    `;
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              body: issueBody,
              user: { login: 'test-user' },
              number: 1,
              title: 'Test Issue',
            },
          }),
        },
      },
    });

    // Run the function
    await run();

    // Assert the expected output variables
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue', 'true');
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_payload', expect.stringContaining('"id":"issue-1"'));
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_id', 'issue-1');
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_envs', ['prod']);
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_issueNumber', 1);
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_issueCreator', 'test-user');
  });

  test('excludes issue based on exclude-issues input', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        case 'exclude_issues':
          return 'issue-1';
        default:
          return '';
      }
    });

    // Mock the GitHub API response
    const issueBody = `
      <!-- {"id": "issue-1", "envs": ["prod"]} -->
      Issue description
    `;
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              body: issueBody,
              user: { login: 'test-user' },
              number: 1,
              title: 'Test Issue',
            },
          }),
        },
      },
    });

    // Run the function
    await run();

    // Assert the expected output variables
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue', 'false');
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.info).toHaveBeenCalledWith('Issue 1 is excluded from processing');
  });

  test('includes issue based on include-issues input', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        case 'include_issues':
          return 'issue-1';
        default:
          return '';
      }
    });

    // Mock the GitHub API response
    const issueBody = `
      <!-- {"id": "issue-1", "envs": ["prod"]} -->
      Issue description
    `;
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              body: issueBody,
              user: { login: 'test-user' },
              number: 1,
              title: 'Test Issue',
            },
          }),
        },
      },
    });

    // Run the function
    await run();

    // Assert the expected output variables
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue', 'true');
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_payload', expect.stringContaining('"id":"issue-1"'));
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_id', 'issue-1');
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_envs', ['prod']);
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_issueNumber', 1);
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_issueCreator', 'test-user');
  });

  test('excludes issue not included in include-issues input', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        case 'include_issues':
          return 'issue-2';
        default:
          return '';
      }
    });

    // Mock the GitHub API response
    const issueBody = `
      <!-- {"id": "issue-1", "envs": ["prod"]} -->
      Issue description
    `;
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              body: issueBody,
              user: { login: 'test-user' },
              number: 1,
              title: 'Test Issue',
            },
          }),
        },
      },
    });

    // Run the function
    await run();

    // Assert the expected output variables
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue', 'false');
    expect(core.setOutput).toHaveBeenCalledTimes(1);
    expect(core.info).toHaveBeenCalledWith('Issue 1 is excluded from processing');
  });

  test('uses default envs value when not provided in issue body', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        default:
          return '';
      }
    });

    // Mock the GitHub API response
    const issueBody = `
      <!-- {"id": "issue-1"} -->
      Issue description
    `;
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              body: issueBody,
              user: { login: 'test-user' },
              number: 1,
              title: 'Test Issue',
            },
          }),
        },
      },
    });

    // Run the function
    await run();

    // Assert the expected output variables
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue', 'true');
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_payload', expect.stringContaining('"id":"issue-1"'));
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_id', 'issue-1');
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_envs', ['devhub']);
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_issueNumber', 1);
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue_issueCreator', 'test-user');
  });

  test('sets sfops_issue to false for an invalid issue', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        default:
          return '';
      }
    });

    // Mock the GitHub API response
    const issueBody = 'Issue description without JSON';
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockResolvedValue({
            data: {
              body: issueBody,
              user: { login: 'test-user' },
              number: 1,
              title: 'Test Issue',
            },
          }),
        },
      },
    });

    // Run the function
    await run();

    // Assert the expected output variables
    expect(core.setOutput).toHaveBeenCalledWith('sfops_issue', 'false');
    expect(core.setOutput).toHaveBeenCalledTimes(1);
  });

  test('sets sfops_issue to exit with error code 1 when api fails', async () => {
    // Mock core.getInput to return the desired values
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'repo_owner':
          return 'test-owner';
        case 'repo_name':
          return 'test-repo';
        case 'issue':
          return '1';
        case 'token':
          return 'test-token';
        default:
          return '';
      }
    });
  
    // Mock the GitHub API response to throw an error
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          get: jest.fn().mockRejectedValue(new Error('API error')),
        },
      },
    });
  
    // Run the function and catch any errors
    await run();
  
    // Assert the expected output variables and error handling
    expect(core.ExitCode).toBe(1);
  });
});