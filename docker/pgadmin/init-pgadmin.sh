#!/bin/sh
set -e

/entrypoint.sh &
PGADMIN_PID=$!

# Wait until pgAdmin creates its internal SQLite database.
while [ ! -f /var/lib/pgadmin/pgadmin4.db ]; do
  sleep 1
done

# Create pgpass so pgAdmin can auto-connect without prompting password.
printf '%s\n' 'postgres:5432:helipagos:postgres:123456' > /var/lib/pgadmin/pgpass
chmod 600 /var/lib/pgadmin/pgpass

# Import predefined servers.
# In SERVER_MODE=False, pgAdmin uses the default internal user.
/venv/bin/python /pgadmin4/setup.py load-servers /pgadmin4/servers.json --replace

wait "${PGADMIN_PID}"
