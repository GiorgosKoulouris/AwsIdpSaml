#!/bin/sh

sed -i -e "s|\"REACT_APP_AZ_CLIENT_ID_PH\"|'$AZ_CLIENT_ID'|g" /usr/share/nginx/html/index.html
sed -i -e "s|\"REACT_APP_AZ_AUTHORITY_PH\"|'$AZ_AUTHORITY'|g" /usr/share/nginx/html/index.html

nginx -g 'daemon off;'