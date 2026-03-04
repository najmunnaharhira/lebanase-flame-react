// PM2 process manager config for the backend
// Usage: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "lebanese-flames-api",
      script: "index.js",
      cwd: "./backend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
