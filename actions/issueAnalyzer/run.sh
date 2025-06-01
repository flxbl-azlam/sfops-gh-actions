#!/bin/bash

# Check if the GitHub token is provided as an argument
if [ -z "$1" ]; then
  echo "Please provide your GitHub token as an argument."
  exit 1
fi

# Set environment variables
export INPUT_REPO_OWNER="flxbl-io"
export INPUT_REPO_NAME="sf-core"
export INPUT_ISSUE=$2
export INPUT_TOKEN="$1"
export INPUT_INCLUDE_ISSUES=""
export INPUT_EXCLUDE_ISSUES=""

# Run the script
node index.js