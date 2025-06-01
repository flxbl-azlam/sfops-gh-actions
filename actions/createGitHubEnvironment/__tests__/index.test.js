const core = require('@actions/core');
const github = require('@actions/github');
const action = require('../index');

jest.mock('@actions/core');
jest.mock('@actions/github');

describe('Create/Update Environments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates or updates environments successfully', async () => {
    const mockInputs = {
      token: 'my-token',
      repo: 'owner/repo',
      environments: 'production,staging',
      wait_time: '30',
      required_reviewers: 'octocat,myorg/myteam',
      protected_branches_only: 'true',
    };

    core.getInput.mockImplementation((name) => mockInputs[name]);
    core.getBooleanInput.mockImplementation((name) => mockInputs[name] === 'true');

    const mockOctokit = {
      rest: {
        repos: {
          createOrUpdateEnvironment: jest.fn().mockResolvedValue({
            data: { name: 'production', url: 'https://api.github.com/repos/owner/repo/environments/production' },
          }),
        },
        teams: {
          getByName: jest.fn().mockResolvedValue({ data: { id: 123 } }),
        },
        users: {
          getByUsername: jest.fn().mockResolvedValue({ data: { type: 'User', id: 456 } }),
        },
      },
    };
    github.getOctokit.mockReturnValue(mockOctokit);

    await action.run();

    expect(core.getInput).toHaveBeenCalledWith('token', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('repo', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('environments', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('wait_time', { required: true });
    expect(core.getInput).toHaveBeenCalledWith('required_reviewers', { required: true });
    expect(core.getBooleanInput).toHaveBeenCalledWith('protected_branches_only', { required: true });

    expect(mockOctokit.rest.repos.createOrUpdateEnvironment).toHaveBeenCalledTimes(2);
    expect(mockOctokit.rest.teams.getByName).toHaveBeenCalledTimes(2);
    expect(mockOctokit.rest.users.getByUsername).toHaveBeenCalledTimes(2);

    expect(core.setFailed).not.toHaveBeenCalled();
  });

  test('sets failed status when an error occurs', async () => {
    core.getInput.mockImplementation(() => {
      throw new Error('Invalid input');
    });

    await action.run();

    expect(core.setFailed).toHaveBeenCalledWith('Invalid input');
  });
});