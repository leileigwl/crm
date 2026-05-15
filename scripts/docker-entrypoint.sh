#!/bin/sh
set -eu

echo "等待数据库连接..."
until node -e "const { Client } = require('pg'); const c = new Client({ connectionString: process.env.DATABASE_URL }); c.connect().then(() => c.end()).catch(() => process.exit(1));"; do
  sleep 2
done

echo "初始化数据库结构..."
pnpm exec tsx scripts/bootstrap-db.ts

echo "初始化管理员..."
pnpm exec tsx scripts/init-admin.ts

echo "启动应用..."
exec bash ./scripts/start.sh
