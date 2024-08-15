#!/bin/bash
certbot renew
cp -L /etc/letsencrypt/live/ffwemding.dynv6.net/privkey.pem /home/ubuntu/atw-app/certs/privkey.pem
cp -L /etc/letsencrypt/live/ffwemding.dynv6.net/fullchain.pem /home/ubuntu/atw-app/certs/fullchain.pem