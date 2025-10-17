module.exports = {
  apps: [{
    name: 'credactive',
    script: './dist/index.js',
    cwd: '/var/www/credactive',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '/var/www/credactive/.env',
    error_file: '/root/.pm2/logs/credactive-error.log',
    out_file: '/root/.pm2/logs/credactive-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    time: true
  }]
};
