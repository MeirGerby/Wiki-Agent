Use `psql` inside the container, from the repo root:

```bash
docker compose exec postgres psql -U postgres -d jarvis
```

Inside the `psql` prompt:

| Command | What it does |
|---|---|
| `\dt` | list tables |
| `\d permissions` | show a table's columns and indexes |
| `select * from permissions;` | query a table |
| `\q` | quit |

For a one-off command without opening the prompt:

```bash
docker compose exec postgres psql -U postgres -d jarvis -c '\dt'
```

The database is `jarvis`, the user and password are both `postgres`, and the container is published on host port **5433**. You can also connect from a GUI client such as DBeaver, pgAdmin or the VS Code SQL extensions with `postgresql://postgres:postgres@localhost:5433/jarvis`.