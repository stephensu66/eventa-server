# taro-event-server

`taro-server` 已经整理为可 Docker 化部署，包含：

- 本地一键联调的 `app + mysql`
- 云服务器复用现有 MariaDB 容器的 `app only` 部署
- 数据库备份/恢复脚本

## 目录

- `Dockerfile`: Node.js 服务镜像
- `Dockerfile.mysql`: 本地联调用 MySQL 镜像，内置初始化 SQL
- `docker-compose.yml`: 应用 + MySQL 一键启动
- `docker-compose.cloud.yml`: 只启动应用，接入现有外部 Docker network
- `.env.example`: 环境变量模板
- `.env.cloud.example`: 云服务器复用现有 MariaDB 的环境变量模板
- `sql/docker-init.sql`: Docker 首次启动时自动初始化数据库
- `scripts/backup-db.sh`: 导出当前 MySQL 数据
- `scripts/restore-db.sh`: 导入 SQL 备份

## 首次启动

1. 复制环境变量模板

```bash
cp .env.example .env
```

2. 按实际情况修改 `.env`

至少要改这些值：

- `APPID`
- `APPSECRET`
- `JWT_SECRET`
- `COS_SECRET_ID`
- `COS_SECRET_KEY`
- `DB_PASSWORD`
- `MYSQL_ROOT_PASSWORD`

3. 构建并启动

```bash
docker compose up -d --build
```

4. 查看状态

```bash
docker compose ps
docker compose logs -f app
```

如果你修改了 `sql/docker-init.sql`，注意它只会在 MySQL 数据卷首次创建时执行一次。需要重新初始化库时，用：

```bash
docker compose down -v
docker compose up -d --build
```

服务默认地址：

- API: `http://localhost:3300`
- 健康检查: `http://localhost:3300/health`
- MySQL: `localhost:3306`

## 常用命令

停止服务：

```bash
docker compose down
```

停止并删除数据库卷：

```bash
docker compose down -v
```

重建应用镜像：

```bash
docker compose up -d --build app
```

## 云服务器部署

适用于：云服务器上已经有 MariaDB 容器在运行，不再启动本项目自己的 `mysql` 服务。

1. 复制云环境模板

```bash
cp .env.cloud.example .env.cloud
```

2. 按云服务器实际情况修改 `.env.cloud`

重点检查这两个值：

- `EXTERNAL_DB_NETWORK`
- `DB_HOST`

你当前环境可以先按下面的猜测值填写：

- `EXTERNAL_DB_NETWORK=pterodactyl_default`
- `DB_HOST=pterodactyl-database-1`

建议在云服务器先确认：

```bash
docker inspect pterodactyl-database-1 --format '{{json .NetworkSettings.Networks}}'
```

如果输出里有 `pterodactyl_default`，说明 network 名基本正确。

3. 只启动应用容器

```bash
docker compose -f docker-compose.cloud.yml --env-file .env.cloud up -d --build
```

4. 查看状态

```bash
docker compose -f docker-compose.cloud.yml --env-file .env.cloud ps
docker compose -f docker-compose.cloud.yml --env-file .env.cloud logs -f app
```

5. 验证接口

```bash
curl http://127.0.0.1:3300/health
```

## 数据迁移

导出数据库：

```bash
./scripts/backup-db.sh
```

也可以指定输出文件：

```bash
./scripts/backup-db.sh backups/prod.sql
```

导入数据库：

```bash
./scripts/restore-db.sh backups/prod.sql
```

迁移到新机器的最小步骤：

1. 复制 `taro-server/` 目录
2. 复制 `.env`
3. 复制你的 SQL 备份
4. 执行 `docker compose up -d`
5. 执行 `./scripts/restore-db.sh <备份文件>`

## 非 Docker 本地运行

```bash
npm install
npm start
```

本地运行同样读取 `.env`。
