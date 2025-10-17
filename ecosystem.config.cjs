require('dotenv').config({ path: '/var/www/credactive/.env' });

module.exports = {
  apps: [{
    name: 'credactive',
    script: './dist/index.js',
    cwd: '/var/www/credactive',
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: process.env,
    error_file: '/root/.pm2/logs/credactive-error.log',
    out_file: '/root/.pm2/logs/credactive-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    time: true
  }]
};
