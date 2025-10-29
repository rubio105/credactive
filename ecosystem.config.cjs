require('dotenv').config({ path: '/var/www/ciry-app/.env' });

module.exports = {
  apps: [{
    name: 'ciry-app',
    script: './dist/index.js',
    cwd: '/var/www/ciry-app',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: process.env,
    error_file: '/root/.pm2/logs/ciry-app-error.log',
    out_file: '/root/.pm2/logs/ciry-app-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    time: true
  }]
};
