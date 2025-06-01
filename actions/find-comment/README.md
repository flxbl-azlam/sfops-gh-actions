# Find Comment

A GitHub action to find an issue or pull request comment.

The action will output the comment ID of the comment matching the search criteria.

## Usage

### Find the first comment containing the specified string

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          body-includes: search string 1
```

### Find the first comment by the specified author

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          comment-author: flxbl-azlam/sfops-gh-actions
```

### Find the first comment containing the specified string AND by the specified author

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          comment-author: flxbl-azlam/sfops-gh-actions
          body-includes: search string 1
```

### Find the first comment matching the specified regular expression

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          body-regex: '^.*search string 1.*$'
```

### Find the last comment containing the specified string

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          body-includes: search string 1
          direction: last
```

### Find the nth comment containing the specified string

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          body-includes: search string 1
          nth: 1 # second matching comment (0-indexed)
```

### Action inputs

| Name | Description | Default |
| --- | --- | --- |
| `token` | `GITHUB_TOKEN` or a `repo` scoped [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). | `GITHUB_TOKEN` |
| `repository` | The full name of the repository containing the issue or pull request. | `github.repository` (Current repository) |
| `issue-number` | The number of the issue or pull request in which to search. | |
| `comment-author` | The GitHub user name of the comment author. | |
| `body-includes` | A string to search for in the body of comments. | |
| `body-regex` | A regular expression to search for in the body of comments. | |
| `direction` | Search direction, specified as `first` or `last` | `first` |
| `nth` | 0-indexed number, specifying which comment to return if multiple are found | 0 |

#### Outputs

The `comment-id`, `comment-node-id`, `comment-body`, `comment-author` and `comment-created-at` of the matching comment found will be output for use in later steps.
They will be empty strings if no matching comment was found.
Note that in order to read the step outputs the action step must have an id.

Tip: Empty strings evaluate to zero in GitHub Actions expressions.
e.g. If `comment-id` is an empty string `steps.fc.outputs.comment-id == 0` evaluates to `true`.

```yml
      - name: Find Comment
        uses: flxbl-azlam/sfops-gh-actions/find-comment@main
        id: fc
        with:
          issue-number: 1
          body-includes: search string 1
      - run: |
          echo ${{ steps.fc.outputs.comment-id }}
          echo ${{ steps.fc.outputs.comment-node-id }}
          echo ${{ steps.fc.outputs.comment-body }}
          echo ${{ steps.fc.outputs.comment-author }}
          echo ${{ steps.fc.outputs.comment-created-at }}
```

### Accessing issues and pull requests in other repositories

You can search the comments of issues and pull requests in another repository by using a [PAT](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) instead of `GITHUB_TOKEN`.

## License

[MIT](LICENSE)
