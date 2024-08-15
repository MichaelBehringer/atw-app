#!/bin/bash
mysqldump --user=ffwadmin --password=gnidmewff ffw > /home/ubuntu/atw-app/backup/gitRepo/dump.sql
git -C /home/ubuntu/atw-app/backup/gitRepo add /home/ubuntu/atw-app/backup/gitRepo/dump.sql
git -C /home/ubuntu/atw-app/backup/gitRepo commit -m "auto commit"
git -C /home/ubuntu/atw-app/backup/gitRepo push