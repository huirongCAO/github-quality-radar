# GitHub 优质项目雷达

一个移动端优先的每日 GitHub 项目和 Skill 看板。它会按“实用增长”筛选项目，并为每个条目生成中文讲解、适用场景、安装或接入方式、快速使用步骤和注意事项。

## 本地运行

```bash
npm install
npm run discover
npm run dev
```

## 自动更新

GitHub Actions 会在每天北京时间 09:00 运行，也可以在 Actions 页面手动触发 `Daily GitHub Discovery`。

建议在仓库设置中添加 Secret：

```text
DISCOVERY_GITHUB_TOKEN=你的 GitHub Token
```

没有该 Secret 时，工作流会回退到 Actions 自带的 `GITHUB_TOKEN`。

## 日常手机使用

推荐把项目部署到 GitHub Pages。部署成功后，手机每天打开同一个公开链接即可查看最新日报。

### 1. 登录 GitHub CLI

```bash
gh auth login
```

登录完成后检查：

```bash
gh auth status
```

### 2. 创建 GitHub 仓库并推送

如果你想用当前目录名做仓库名，可以运行：

```bash
git add -A
git commit -m "feat: add daily GitHub discovery dashboard"
gh repo create github-quality-radar --public --source=. --remote=origin --push
```

如果你想用自己的仓库名，把 `github-quality-radar` 改成你喜欢的英文名字。

### 3. 开启 GitHub Pages

进入 GitHub 仓库：

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

### 4. 配置 Token

进入：

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

添加：

```text
Name: DISCOVERY_GITHUB_TOKEN
Value: 你的 GitHub Token
```

Token 只需要能读取公开仓库即可；如果不配置，也能运行，但更容易遇到 GitHub API 限流。

### 5. 手动生成第一次日报

进入：

```text
Actions -> Daily GitHub Discovery -> Run workflow
```

运行成功后，在 Pages 页面会看到公开访问地址，格式通常是：

```text
https://你的用户名.github.io/github-quality-radar/
```

把这个链接添加到手机浏览器书签，或添加到主屏幕，就可以日常使用。

## 数据生成规则

- 搜索近期创建、近期活跃、增长快、文档完整的 GitHub 项目。
- 每天展示 30 个项目，优先覆盖通用 Skill、效率、学习、MCP、Agent、CLI、Web App、Library、Template 和通用 Project。
- DevOps、安全、数据工程项目仍会进入候选池，但默认降权，避免占用太多日常推荐位。
- 讲解会说明项目解决什么问题、适合谁、为什么值得看、怎么先小范围试用。
- 优先从 README 提取安装和快速启动命令。
- 如果官方文档没有明确步骤，会写入“官方未提供明确安装步骤”，避免编造命令。

## 常用命令

```bash
npm run discover
npm test
npm run build
```
