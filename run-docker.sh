#!/bin/bash
set -o errexit

ENV=$(sed -n "s/^ENV=\(.*\)$/\1/p" .env)
FILE="docker-compose.$ENV.yml"

docker-compose stop

if [ -f $FILE ]; then
	echo "Merging docker-compose files for $ENV environment..."
    docker-compose -f docker-compose.common.yml -f $FILE up --build
else
	echo "Merging docker-compose files..."
    docker-compose -f docker-compose.common.yml up --build
fi
