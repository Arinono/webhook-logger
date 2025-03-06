default:
  @just --list

build:
  docker build -t arinono/webhook-logger .

push: build
  git push
  docker push arinono/webhook-logger
