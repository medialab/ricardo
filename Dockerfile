############ building database
FROM python:2.7-alpine3.8 AS ricardo_data
ENV DATA_VERSION_REF=2017.12.with.FT
RUN  apk add --no-cache git 
RUN mkdir /ricardo_data
WORKDIR /ricardo_data
RUN git --version
RUN git clone https://github.com/medialab/ricardo_data .
RUN git checkout ${DATA_VERSION_REF}

WORKDIR /ricardo_data/database_scripts
RUN pip install -r requirements.txt
RUN python RICardo_website_sqlite_creation.py

############## BUILDING ANGULAR WEB CLIENT

FROM node:6.17  AS static_client

ENV NODE_ENV production

ARG STATIC_URL=http://localhost:80
ARG API_URL=$STATIC_URL/api

ENV API_URL=${API_URL}
ENV STATIC_URL=${STATIC_URL}
ENV PATH /client/node_modules/.bin:$PATH


ADD . /
WORKDIR /client
RUN npm install --quiet --production true --no-audit \
    && npm run build 

################ Build nginx image
FROM tiangolo/uwsgi-nginx:python2.7-alpine3.8
ENV SECRET_KEY=azeoijz3245324aepoizajeoizé&
ENV PROD=true
# GET the exploration website from build image
COPY --from=static_client --chown=nginx:nginx /client/build /client

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

# Add demo app
COPY ./api /api
# GET the database DATA
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/sqlite_data /data/sqlite_data
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/database_scripts/config.json /data/database_scripts/config.json
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/database_scripts/deploy.sh /data/database_scripts/deploy.sh
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/database_scripts/*.csv /data/database_scripts/
COPY --from=ricardo_data --chown=nginx:nginx /ricardo_data/data/exchange_rates.csv /data/data/exchange_rates.csv
WORKDIR /data/database_scripts
# move data files to api folder
RUN sh deploy.sh -o /

WORKDIR /api
RUN pip install -r ./requirements.txt

# Make /app/* available to be imported by Python globally to better support several use cases like Alembic migrations.
ENV PYTHONPATH=/api

# Move the base entrypoint to reuse it
RUN mv /entrypoint.sh /uwsgi-nginx-entrypoint.sh
# Copy the entrypoint that will generate Nginx additional configs
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
# Run the start script provided by the parent image tiangolo/uwsgi-nginx.
# It will check for an /app/prestart.sh script (e.g. for migrations)
# And then will start Supervisor, which in turn will start Nginx and uWSGI
CMD ["/start.sh"]
