############ building database
FROM python:3.8.6-alpine3.12 AS ricardo_data

ARG DATA_VERSION_REF
ENV DATA_VERSION_REF=${DATA_VERSION_REF}

RUN apk add --no-cache git icu-dev build-base gcc musl-dev
RUN mkdir /ricardo_data

WORKDIR /ricardo_data

RUN git --version
RUN git clone -b ${DATA_VERSION_REF} --single-branch --depth 1 https://github.com/medialab/ricardo_data .

WORKDIR /ricardo_data/database_scripts

RUN pip install -r requirements.txt
RUN python flows.py aggregate
RUN python flows.py deduplicate

############## BUILDING ANGULAR WEB CLIENT

FROM node:14.13.1-alpine3.12  AS static_client

ARG STATIC_URL=http://localhost:80
ARG API_URL=$STATIC_URL/api

ENV API_URL=${API_URL}
ENV STATIC_URL=${STATIC_URL}
ENV PATH /client/node_modules/.bin:$PATH

RUN apk --update add --no-cache git

USER node

COPY --chown=node:node client /client
COPY --chown=node:node .git /
COPY --chown=node:node analysis/WorldTradeWeb /WorldTradeWeb

WORKDIR /client

RUN npm install --no-audit
ENV NODE_ENV production
RUN /bin/cp ./src/js/config.sample.js ./src/js/config.js \
    && npm run build

################ Build nginx image
FROM nginx:alpine

ENV API_PORT=8000
ENV API_HOST=api

# GET the exploration website from build image
COPY --from=static_client --chown=nginx:nginx /client/build /ricardo/client
COPY --from=static_client --chown=nginx:nginx /WorldTradeWeb /ricardo/client/WTW/

WORKDIR /ricardo/client

# GET the database DATA
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/database_scripts/*.csv /ricardo/client/data/
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/data/exchange_rates.csv /ricardo/client/data/RICardo_exchange_rates.csv

RUN rm /etc/nginx/conf.d/default.conf

COPY ./client/nginx.conf /etc/nginx/conf.d/docker.template
COPY ./client/docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]

