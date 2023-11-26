FROM node:16.14.2
USER root
RUN apt-get update && \
  apt-get install -y \
  redis-server \
  postgresql postgresql-contrib \
  sudo \
  nginx \
  vim \
  certbot \
  python3-acme \ 
  python3-certbot \
  python3-mock \
  python3-openssl \
  python3-pkg-resources \
  python3-pyparsing \
  python3-zope.interface \
  python3-certbot-nginx \
  && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/nginx.key -out /etc/nginx/ssl/nginx.crt -subj "/CN=localhost"
WORKDIR /usr/src/app
COPY nginx.conf /etc/nginx/conf.d/
COPY . .

EXPOSE 80
EXPOSE 443
EXPOSE 9231
EXPOSE 9232
EXPOSE 9856

RUN chown -R node /usr/src/app
RUN yarn install

ENTRYPOINT ["./setup.sh"]
#CMD yarn run build:app && yarn start
