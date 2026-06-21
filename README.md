# taro-event-server

`taro-server` 已经整理为可 Docker 化部署，包含应用容器、MySQL 容器、初始化表结构，以及数据库备份/恢复脚本。

## 目录

- `Dockerfile`: Node.js 服务镜像
- `docker-compose.yml`: 应用 + MySQL 一键启动
- `.env.example`: 环境变量模板
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
