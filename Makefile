# import config.
# You can change the default config with `make cnf="config_special.env" build`
#cnf ?= ./env/config.env
#include $(cnf)
#export $(shell sed 's/=.*//' $(cnf))

# HELP
# This will output the help for each task
# thanks to https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
.PHONY: help

help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help


# DOCKER TASKS
# Build the container
build: ## Build the container

	docker build -t pixel-project-web:dev --platform linux/amd64 .

build-nc: ## Build the container without no cache
	docker build -t pixel-project-web:dev --platform linux/amd64 --no-cache .

# Clean Up
clean: # Remove images, modules, and cached build layers

	rm -rf node_modules
	rm -rf package-lock.json

# Run the container
run: ## Run container attached`
	-docker kill pixel-project-web-dev
	-docker rm pixel-project-web-dev
	docker run --name="pixel-project-web-dev" -it --rm -p 8001:8001 pixel-project-web:dev

run-d: ## Run container detached
	-docker kill pixel-project-web-dev
	-docker rm pixel-project-web-dev
	docker run --name="pixel-project-web-dev" -it --rm -p 8001:8001 -d pixel-project-web:dev

init: # Initailize development environment and start it

	chmod +x ./dev-init.sh
	./dev-init.sh
	npm install
	docker pull node:18-alpine

	docker build -t pixel-project-web:dev --platform linux/amd64 .

	@echo "Type 'make help' for a list of commands"