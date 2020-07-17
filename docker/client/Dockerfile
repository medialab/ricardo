FROM nginx:latest

ADD ./nginx.conf /etc/nginx/nginx.prod.conf
ADD ./nginx.dev.conf /etc/nginx/nginx.dev.conf
ADD ./docker-entrypoint.sh /docker-entrypoint.sh

RUN ["chmod", "+x", "/docker-entrypoint.sh"]
RUN apt-get update && apt-get -y install npm curl
RUN npm install -g n
RUN n lts
RUN npm i npm@latest -g

EXPOSE 80

ENTRYPOINT ["/bin/bash", "/docker-entrypoint.sh", "$MODE"]
