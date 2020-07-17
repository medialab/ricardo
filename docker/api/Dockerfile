FROM python:2.7.16-alpine3.10
ADD ./docker-entrypoint.sh /docker-entrypoint.sh

RUN ["chmod", "+x", "/docker-entrypoint.sh"]

EXPOSE 5000

ENTRYPOINT ["/bin/sh", "/docker-entrypoint.sh", "$MODE"]
