# atw-app
docker stop $(docker ps -a -q)
sudo docker compose up --build -d
certonly --standalone -d ffwemding.dynv6.net --non-interactive --agree-tos -m michabehringer@gmail.com
sudo crontab -u root -e

# crontab
30 2 * * * sh /home/ubuntu/atw-app/certs/cert.sh
0 3 * * * /sbin/shutdown -r
0 */6 * * * /home/ubuntu/atw-app/backup/backup.sh