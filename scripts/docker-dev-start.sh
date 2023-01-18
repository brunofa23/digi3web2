#!/bin/bash

if [ "$(docker ps -a -q)" ]; then
  echo "Stopping and removing all docker containers..."
  docker stop $(docker ps -a -q)
  docker rm $(docker ps -a -q)
fi

echo "Starting docker containers..."
docker-compose -f ./docker/dev/docker-compose.yml up --build -d