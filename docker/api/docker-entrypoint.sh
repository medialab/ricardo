#!/bin/bash
cd /ricardo/api

if [ "$MODE" = "dev" ]; then
  echo "/!\\ Mode is set to DEV /!\\"
else
  echo "/!\\ Mode is set to PRODUCTION /!\\"
fi

echo
echo " ~"
echo " ~ Install dependencies"
echo " ~"
echo
pip --no-cache-dir install --requirement ./requirements.txt

if [ "$MODE" = "dev" ]; then
  echo
  echo " ~"
  echo " ~ Setting flask dev mode"
  echo " ~"
  echo
  export FLASK_ENV=development
fi

echo
echo " ~"
echo " ~ Run the API server"
echo " ~"
echo
python runserver.py
