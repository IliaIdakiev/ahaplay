#!/bin/bash

# Disable Transparent Huge Pages (THP) because of REDIS
echo 'never' > /sys/kernel/mm/transparent_hugepage/enabled
echo 'never' > /sys/kernel/mm/transparent_hugepage/defrag

# Start PostgreSQL
/etc/init.d/postgresql start

./wait-for-it.sh -t 0 -h 127.0.0.1 -p 5432 -- echo "PostgreSQL is ready as listening on port :5432"

# Create user and database
su - postgres -c "psql -c \"CREATE USER ahaplay WITH SUPERUSER PASSWORD 'ahaplay';\""
su - postgres -c "createdb -O ahaplay ahaplay"

# Start Redis
redis-server &

# Wait for Redis to be ready
./wait-for-it.sh -t 0 -h 127.0.0.1 -p 6379 -- echo "Redis is ready and listening on port :6379"

# Expose a port for postgres connections from outside of docker
cat ./nginx.postgres.conf >> /etc/nginx/nginx.conf
# Remove default configuration that shows nginx running on port 80
rm -f /etc/nginx/sites-available/default
rm -f /etc/nginx/sites-enabled/default

service nginx start
service nginx status


if [ "$IS_DEBUG" = "true" ]; then
  npm install -g pm2 && yarn start:pm2:debug
else
  npm install -g pm2 && yarn run build:app && yarn start:pm2
fi

# Wait for background processes to finish
wait