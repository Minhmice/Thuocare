# CocoIndex (Python) + Postgres (Docker)

This repo is primarily JS/Expo. The Python setup below is **opt-in** and isolated to a local venv at `./.venv`.

## 1) Create and activate the venv (macOS zsh)

From the repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -V
python -m pip -V
```

To leave the venv later:

```bash
deactivate
```

## 2) Install CocoIndex

```bash
python -m pip install --upgrade pip
python -m pip install -U cocoindex
python -c "import cocoindex; print(getattr(cocoindex, '__version__', 'unknown'))"
```

## 3) Start Postgres (Docker Compose)

This repo includes a dedicated compose file for CocoIndex Postgres:

- `docker-compose.postgres.yml`

Start it:

```bash
docker compose -f docker-compose.postgres.yml up -d
docker compose -f docker-compose.postgres.yml ps
```

### Connection settings

Defaults defined in `docker-compose.postgres.yml`:

- `POSTGRES_DB=cocoindex`
- `POSTGRES_USER=cocoindex`
- `POSTGRES_PASSWORD=cocoindex_local_dev_change_me`
- `DATABASE_URL=postgresql://cocoindex:cocoindex_local_dev_change_me@localhost:54329/cocoindex`

## 4) Verify Postgres is reachable

Run a basic query inside the container:

```bash
docker compose -f docker-compose.postgres.yml exec postgres pg_isready -U cocoindex -d cocoindex
docker compose -f docker-compose.postgres.yml exec postgres psql -U cocoindex -d cocoindex -c "select now(), 1 as ok;"
```

## 5) Stop / reset

Stop:

```bash
docker compose -f docker-compose.postgres.yml down
```

Stop and delete the data volume (destroys local data):

```bash
docker compose -f docker-compose.postgres.yml down -v
```

