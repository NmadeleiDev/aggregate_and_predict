#!/usr/bin/make

include .env
include .env.release
export

.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "\n  Allowed for overriding next properties:\n\n\
		Usage example:\n\
	    	make run"

init: back-dep front-dep ## initialize project

build: ## build all containers (docker compose)
	docker-compose build

up: ## build & start the project (docker-compose)
	docker-compose up --build -d

up-it: ## build & start the project (docker-compose)
	docker-compose up --build

down: ## stop the project (docker-compose)
	docker-compose down

# === BACKEND ===


# === FRONTEND ===

front-dep:
	cd ./src/frontend && npm install

front-dev:
	cd ./src/frontend && npm run serve

front-build:
	cd ./src/frontend && npm run build


# === COMMON ===

server-recreate:
	ssh -t GoMobileS2 \
	"cd /mnt/HC_Volume_4180932/deploy/prediction_services/general_preparation_and_forecasting && make pull && make up"

full-deploy: deploy server-recreate

loader-deploy: img-build-loader push-img-loader server-recreate

emitter-deploy: img-build-event-emitter push-img-event-emitter server-recreate

# === BUILD ===

img-build-task-manager: ## build rotation-api image
	docker build -t ${TASK_MANAGER_BACKEND_NAME}:${TASK_MANAGER_BACKEND_VERSION} ./src/task_manager \
		&& docker tag ${TASK_MANAGER_BACKEND_NAME}:${TASK_MANAGER_BACKEND_VERSION} ${DOCKER_REGISTRY}/${TASK_MANAGER_BACKEND_NAME}:${TASK_MANAGER_BACKEND_VERSION}

push-img-task-manager: ## push rotation-api image to registry
	docker push ${DOCKER_REGISTRY}/${TASK_MANAGER_BACKEND_NAME}:${TASK_MANAGER_BACKEND_VERSION}

img-build-loader: ## build rotation-api image
	docker build -t ${DATA_LOADER_BACKEND_NAME}:${DATA_LOADER_BACKEND_VERSION} ./src/load_and_group \
		&& docker tag ${DATA_LOADER_BACKEND_NAME}:${DATA_LOADER_BACKEND_VERSION} ${DOCKER_REGISTRY}/${DATA_LOADER_BACKEND_NAME}:${DATA_LOADER_BACKEND_VERSION}

push-img-loader: ## push rotation-api image to registry
	docker push ${DOCKER_REGISTRY}/${DATA_LOADER_BACKEND_NAME}:${DATA_LOADER_BACKEND_VERSION}

img-build-predictor: ## build rotation-api image
	docker build -t ${PREDICTOR_BACKEND_NAME}:${PREDICTOR_BACKEND_VERSION} ./src/predict_generator \
		&& docker tag ${PREDICTOR_BACKEND_NAME}:${PREDICTOR_BACKEND_VERSION} ${DOCKER_REGISTRY}/${PREDICTOR_BACKEND_NAME}:${PREDICTOR_BACKEND_VERSION}

push-img-predictor: ## push rotation-api image to registry
	docker push ${DOCKER_REGISTRY}/${PREDICTOR_BACKEND_NAME}:${PREDICTOR_BACKEND_VERSION}

img-build-event-emitter: ## build rotation-api image
	docker build -t ${EVENT_EMITTER_BACKEND_NAME}:${EVENT_EMITTER_BACKEND_VERSION} ./src/event_emitter \
		&& docker tag ${EVENT_EMITTER_BACKEND_NAME}:${EVENT_EMITTER_BACKEND_VERSION} ${DOCKER_REGISTRY}/${EVENT_EMITTER_BACKEND_NAME}:${EVENT_EMITTER_BACKEND_VERSION}

push-img-event-emitter: ## push rotation-api image to registry
	docker push ${DOCKER_REGISTRY}/${EVENT_EMITTER_BACKEND_NAME}:${EVENT_EMITTER_BACKEND_VERSION}

img-build-nginx: ## build nginx image
	docker build -t ${NGINX_NAME}:${NGINX_VERSION} ./src/nginx/ \
		&& docker tag ${NGINX_NAME}:${NGINX_VERSION} ${DOCKER_REGISTRY}/${NGINX_NAME}:${NGINX_VERSION}

push-nginx: ## push worker nginx to registry
	docker push ${DOCKER_REGISTRY}/${NGINX_NAME}:${NGINX_VERSION}

deploy: img-build-task-manager push-img-task-manager img-build-loader push-img-loader img-build-predictor push-img-predictor img-build-event-emitter push-img-event-emitter img-build-nginx push-nginx
