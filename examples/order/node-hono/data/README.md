# Database Directory

This directory contains the SQLite database files for the Orders Service.

## Files

- `orders.db` - Main SQLite database file (created automatically)
- `orders.db-wal` - Write-Ahead Logging file (created automatically)
- `orders.db-shm` - Shared memory file (created automatically)

## Environment Variables

Set `DATABASE_URL` to override the default database location:

```bash
export DATABASE_URL="./data/orders.db"
```

## Backup

To backup the database:

```bash
cp data/orders.db data/orders-backup-$(date +%Y%m%d).db
```

## Git Ignore

Database files are ignored by git to prevent committing sensitive data.
