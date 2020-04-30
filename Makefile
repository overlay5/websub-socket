

c-ps: ## Status of the Web-SubSocket container
	@docker-compose ps

c-top: ## Top status of the Web-SubSocket container
	@docker-compose top

c-up: ## Start the Web-SubSocket container
	@docker-compose up -d

c-down: ## Stop the Web-SubSocket container
	@docker-compose down

c-logs: ## Tail logs of the Web-SubSocket container
	@docker-compose logs -f

node: ## Start a Node.js CLI in the WebSub container
	@docker-compose exec websub node --experimental-repl-await --harmony

node-shell: ## Start a Bash CLI in the WebSub container
	@docker-compose exec websub bash

test: ## Run 'npm test' in the WebSub container
	@docker-compose exec websub /bin/sh -c 'DEBUG= npm test'

.PHONY: help test

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
