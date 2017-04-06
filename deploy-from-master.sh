#!/bin/bash
set -o errexit

# Start fetching.
commits=$(git fetch && git log HEAD..origin/master --oneline)

if [ "$commits" ]; then
  # Stop server.
  docker stop $(docker ps -a -q)

  # Pull repository.
  if ! git reset --hard origin/master && git clean -f -d; then
    # Report failure.
    echo "Pulling failed..."
    ./run-docker.sh
    exit 1

  else
    echo "Pulling was successful, restarting..."
    ./run-docker.sh
  fi
fi
