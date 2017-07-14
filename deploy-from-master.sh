#!/bin/bash
set -o errexit

# Start fetching.
commits=$(git fetch --quiet && git log HEAD..origin/master --oneline)

if [ "$commits" ]; then
  # Pull repository.
  if ! git reset --hard origin/master && git clean -f -d; then
    # Report failure.
    echo "Pulling failed..."
    ./run-docker.sh "-d"
    exit 1

  else
    echo "Pulling was successful, restarting..."
    ./run-docker.sh "-d"
  fi
fi
