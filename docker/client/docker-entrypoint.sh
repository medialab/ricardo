#!/bin/bash
cd /ricardo/client

if [ "$MODE" = "dev" ]; then
  echo "/!\\ Mode is set to DEV /!\\"
else
  echo "/!\\ Mode is set to PRODUCTION /!\\"
fi
echo "(i) Npm version is $(npm -v)"
echo "(i) Node version is $(node -v)"

echo
echo " ~"
echo " ~ Install dependencies"
echo " ~"
echo
npm install

echo
echo " ~"
echo " ~ Make configuration"
echo " ~"
echo
cp src/js/config.sample.js src/js/config.js
sed -i 's@http://localhost:5000@/api@g' src/js/config.js


if [ "$MODE" = "dev" ]; then
  echo
  echo " ~"
  echo " ~ Start the web server for dev"
  echo " ~"
  echo
  cp -f /etc/nginx/nginx.dev.conf /etc/nginx/nginx.conf
  nginx -c /etc/nginx/nginx.conf

  echo
  echo " ~"
  echo " ~ Serve application"
  echo " ~"
  echo
  npm start
else
  echo
  echo " ~"
  echo " ~ Building the application"
  echo " ~"
  echo
  npm run build

  echo
  echo " ~"
  echo " ~ Run the production server"
  echo " ~"
  echo
  cp -f /etc/nginx/nginx.prod.conf /etc/nginx/nginx.conf
  nginx -g 'daemon off;'
fi
