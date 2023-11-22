FROM node:16.14.2
USER root
RUN apt-get update && \
  apt-get install -y \
  redis-server \
  postgresql postgresql-contrib \
  sudo \
  nginx \
  && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt -subj "/CN=localhost"
ENV NODE_ENV=dev
WORKDIR /usr/src/app
COPY nginx.conf /etc/nginx/conf.d/
COPY . .

EXPOSE 80
EXPOSE 443

RUN chown -R node /usr/src/app
RUN yarn install

ENTRYPOINT ["./setup.sh"]
#CMD yarn run build:app && yarn start
