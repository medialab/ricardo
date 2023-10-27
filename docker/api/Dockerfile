FROM python:3.10.13-alpine
ADD ./docker-entrypoint.sh /docker-entrypoint.sh

RUN ["chmod", "+x", "/docker-entrypoint.sh"]

EXPOSE 5000

ENTRYPOINT ["/bin/sh", "/docker-entrypoint.sh", "$MODE"]
