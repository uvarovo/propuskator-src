#!/bin/sh

set -e

cat <<'EOF' > /crontab
* * * * * find "$MEDIA_DIR_PATH/cameras" -mmin +$CAMERAS_MEDIA_FILES_LIFE_MINUTES -type f -delete
EOF

# Specify the crontab file for the cron daemon
/usr/bin/crontab /crontab

# Start the cron daemon
/usr/sbin/crond

npm start