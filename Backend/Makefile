.PHONY: dev test lint typecheck migrate seed openapi purge-lead downgrade revision worker

dev:
	docker compose up --build

test:
	pytest -q

lint:
	ruff check app tests
	ruff format --check app tests

typecheck:
	mypy app

migrate:
	alembic upgrade head

downgrade:
	alembic downgrade -1

revision:
	alembic revision --autogenerate -m "$(MSG)"

seed:
	python -m app.seed.seed

openapi:
	python -m app.openapi_dump

worker:
	arq app.workers.main.WorkerSettings

purge-lead:
	python -m app.seed.purge --email "$(EMAIL)"
