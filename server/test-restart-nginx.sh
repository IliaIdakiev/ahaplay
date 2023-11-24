#!/bin/bash
nginx -t
if [ $? -ne 0 ]; then
  echo "Error: Nginx configuration test failed"
  exit 1
fi
nginx -s reload
if [ $? -ne 0 ]; then
  echo "Error: Nginx reload failed"
  exit 1
fi

exit 0