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

################ Build API image
FROM python:2.7.16-alpine3.10

RUN adduser -D ricardo

RUN apk add --no-cache icu-dev build-base gcc musl-dev

ENV SECRET_KEY=azeoijz3245324aepoizajeoizé&
ENV DEBUG=False

# Add API app
COPY --chown=ricardo:ricardo . /ricardo/api

WORKDIR /ricardo/api

RUN pip --no-cache-dir install --requirement ./requirements.txt

USER ricardo

RUN /bin/cp ./ricardo_api.wsgi.docker ./ricardo_api/wsgi.py

# GET the database DATA
COPY --from=ricardo_data --chown=ricardo:ricardo /ricardo_data/sqlite_data /ricardo/api/ricardo_api/

EXPOSE 8000

CMD ["gunicorn","--config=docker-gunicorn.conf.py", "ricardo_api.wsgi:application"]

