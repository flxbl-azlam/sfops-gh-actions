# Pull Request Comment Branch

Get the head ref and sha of a pull request comment.

Workflows for pull request comments are triggered using the [`issue_comment`](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows#issue-comment-event-issue_comment) event which runs for both issues and pull requests.
This action lets you filter your workflow to comments only on pull requests.
It also gets the head ref and sha for the pull request branch which can be used later in the workflow.

The pull request head ref and sha are important because `issue_comment` workflows run against the repository's `default` branch (usually `main` or `master`) and not the pull request's branch.
With this action you'll be able to pass the ref to [`actions/checkout`](https://github.com/actions/checkout) and work with the pull request's code.

