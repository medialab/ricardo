############ building database
FROM python:2.7-alpine3.8 AS ricardo_data

ARG DATA_VERSION_REF=2017.12.with.FT
ENV DATA_VERSION_REF=${DATA_VERSION_REF}

RUN  apk add --no-cache git 
RUN mkdir /ricardo_data

WORKDIR /ricardo_data

RUN git --version
RUN git clone https://github.com/medialab/ricardo_data .
RUN git checkout ${DATA_VERSION_REF}

WORKDIR /ricardo_data/database_scripts

RUN pip install -r requirements.txt
RUN python RICardo_website_sqlite_creation.py

################ Build API image
FROM python:2.7.16-alpine3.10

RUN adduser -D ricardo

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

