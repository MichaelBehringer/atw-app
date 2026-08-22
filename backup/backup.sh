#!/bin/bash
mysqldump --user=ffwadmin --password=gnidmewff ffw > /root/atw-app/backup/gitRepo/dump.sql
git -C /root/atw-app/backup/gitRepo add /root/atw-app/backup/gitRepo/dump.sql
git -C /root/atw-app/backup/gitRepo commit -m "auto commit"
git -C /root/atw-app/backup/gitRepo push