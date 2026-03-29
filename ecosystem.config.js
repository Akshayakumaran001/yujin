module.exports = {
  apps: [
    {
      name: 'whatsapp-automation',
      script: 'src/app.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
    },
  ],
};
