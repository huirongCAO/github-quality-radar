export const CATEGORY_KEYWORDS = {
  "AI Skill": ["skill", "prompt", "codex", "claude", "gemini", "assistant", "workflow"],
  MCP: ["mcp", "model context protocol", "modelcontextprotocol"],
  Agent: ["agent", "multi-agent", "autonomous", "crew", "browser automation"],
  CLI: ["cli", "terminal", "command-line", "tui"],
  "Web App": ["web app", "dashboard", "nextjs", "react", "vue", "svelte"],
  Library: ["sdk", "library", "framework", "package"],
  Template: ["template", "starter", "boilerplate", "scaffold"],
};

const INSTALL_PATTERNS = [
  /\b(?:npm|pnpm|yarn|bun)\s+(?:install|add|create|dlx)\b[^\n\r`]*/gi,
  /\bnpx\s+[^\n\r`]*/gi,
  /\bpipx?\s+install\b[^\n\r`]*/gi,
  /\buvx?\s+(?:tool\s+install|pip\s+install|add|run)\b[^\n\r`]*/gi,
  /\bdocker\s+(?:run|compose)\b[^\n\r`]*/gi,
  /\bgo\s+install\b[^\n\r`]*/gi,
  /\bcargo\s+install\b[^\n\r`]*/gi,
  /\bbrew\s+install\b[^\n\r`]*/gi,
];

const QUICK_START_PATTERNS = [
  /\b(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start|serve)\b[^\n\r`]*/gi,
  /\bnpx\s+[^\n\r`]*/gi,
  /\bpython\s+[^\n\r`]*/gi,
  /\buv\s+run\b[^\n\r`]*/gi,
  /\bdocker\s+compose\s+up\b[^\n\r`]*/gi,
  /\bdocker\s+run\b[^\n\r`]*/gi,
];

const AI_WORDS = [
  "ai",
  "llm",
  "agent",
  "mcp",
  "claude",
  "codex",
  "openai",
  "gemini",
  "assistant",
  "model context protocol",
];

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from, to = new Date()) {
  const fromTime = new Date(from).getTime();
  const toTime = new Date(to).getTime();

  if (Number.isNaN(fromTime) || Number.isNaN(toTime)) {
    return 365;
  }

  return Math.max(0, (toTime - fromTime) / 86_400_000);
}

export function normalizeText(value) {
  return String(value || "").toLowerCase();
}

export function collectRepoText(repo, readme = "") {
  return [
    repo.name,
    repo.full_name,
    repo.description,
    repo.language,
    ...(repo.topics || []),
    readme.slice(0, 5000),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifyRepository(repo, readme = "") {
  const text = collectRepoText(repo, readme);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "Project";
}

export function isSkillLike(category, repo, readme = "") {
  const text = collectRepoText(repo, readme);
  return (
    category === "AI Skill" ||
    category === "MCP" ||
    (category === "Agent" && AI_WORDS.some((word) => text.includes(word)))
  );
}

export function unique(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
}

export function extractCommands(readme, patterns, limit = 4) {
  const commands = [];

  for (const pattern of patterns) {
    const matches = readme.match(pattern) || [];
    for (const match of matches) {
      const cleaned = match.replace(/^\$+\s*/, "").replace(/\s+/g, " ").trim();
      if (cleaned.length > 3 && cleaned.length < 160) {
        commands.push(cleaned);
      }
    }
  }

  return unique(commands).slice(0, limit);
}

export function extractUsageNotes(readme) {
  const installSteps = extractCommands(readme, INSTALL_PATTERNS, 4);
  const quickStart = extractCommands(readme, QUICK_START_PATTERNS, 4).filter(
    (command) => !installSteps.includes(command),
  );

  return {
    installSteps:
      installSteps.length > 0
        ? installSteps
        : ["官方未提供明确安装步骤，请先查看 README、docs 或 release 说明。"],
    quickStart:
      quickStart.length > 0
        ? quickStart
        : ["官方未提供明确快速开始命令，请按 README 的安装章节继续配置。"],
  };
}

export function inferTags(repo, category) {
  const topicTags = (repo.topics || []).slice(0, 5);
  return unique([category, repo.language, ...topicTags]).slice(0, 8);
}

export function zhCategoryName(category) {
  const names = {
    "AI Skill": "AI 助手技能",
    MCP: "MCP 工具",
    Agent: "Agent 项目",
    CLI: "命令行工具",
    "Web App": "Web 应用",
    Library: "开发库",
    Template: "项目模板",
    Project: "开源项目",
  };

  return names[category] || "开源项目";
}

export function buildSummary(repo, category) {
  const description = repo.description || "官方暂未提供清晰描述";
  return `这是一个 ${zhCategoryName(category)}，官方描述为：${description}`;
}

export function buildUseCases(repo, category) {
  const topics = (repo.topics || []).slice(0, 3).join("、");
  const base = {
    "AI Skill": ["给 AI 助手补充可复用能力", "沉淀个人或团队的 agent 工作流"],
    MCP: ["把外部工具接入支持 MCP 的 AI 客户端", "为 agent 提供标准化工具调用"],
    Agent: ["搭建自动化研究、编码或浏览器任务", "验证多步骤 agent 工作流"],
    CLI: ["在终端中完成高频开发任务", "集成进脚本或 CI 流程"],
    "Web App": ["快速体验完整产品形态", "借鉴前端交互和数据流设计"],
    Library: ["接入现有应用作为基础能力", "学习 API 设计和工程组织"],
    Template: ["快速启动新项目", "复用成熟的目录结构和默认配置"],
    Project: ["评估新工具是否适合个人工作流", "学习近期活跃项目的实现方式"],
  };

  return unique([...(base[category] || base.Project), topics ? `围绕 ${topics} 方向做二次开发` : "阅读源码和 README 判断可复用部分"]).slice(0, 4);
}

export function buildWhyUseful(repo, category, readme) {
  const reasons = [];
  const pushedDays = daysBetween(repo.pushed_at);

  if (isSkillLike(category, repo, readme)) {
    reasons.push("和 AI 助手、agent 或 MCP 工作流直接相关，适合优先试用。");
  }

  if ((repo.topics || []).length >= 3) {
    reasons.push("topics 较完整，便于判断项目定位和生态关联。");
  }

  if (readme.length > 1600) {
    reasons.push("README 内容较充分，具备较好的上手线索。");
  }

  if (pushedDays <= 7) {
    reasons.push("最近 7 天内仍有更新，短期维护活跃。");
  }

  if (repo.stargazers_count >= 100) {
    reasons.push("已有一定社区关注度，值得进一步评估。");
  }

  return reasons.length > 0 ? reasons.slice(0, 4) : ["项目信号完整度一般，但近期活跃度值得关注。"];
}

export function buildCaveats(repo, readme, installSteps) {
  const caveats = [];

  if (!repo.license?.spdx_id) {
    caveats.push("未识别到明确 license，商用或二次分发前需要人工确认。");
  }

  if (installSteps.some((step) => step.includes("官方未提供明确"))) {
    caveats.push("README 中缺少可直接提取的安装命令，需要进入项目文档核对。");
  }

  if (daysBetween(repo.created_at) < 14) {
    caveats.push("项目创建时间较近，API、文档和稳定性可能变化较快。");
  }

  if (!readme || readme.length < 800) {
    caveats.push("README 信息偏少，建议先看 issue、release 和示例目录。");
  }

  return caveats.length > 0 ? caveats : ["未发现明显上手风险，仍建议先在隔离环境试运行。"];
}

export function buildSkillIntegration(repo, category, installSteps) {
  if (category === "MCP") {
    return "按 README 提供的 server 启动命令，将 command、args 和所需环境变量写入支持 MCP 的客户端配置。";
  }

  if (category === "AI Skill") {
    return "先阅读项目提供的 skill、prompt 或 workflow 目录，再按目标 AI 助手的扩展格式复制配置。";
  }

  if (category === "Agent") {
    return installSteps.some((step) => step.includes("官方未提供明确"))
      ? "官方未提供明确 agent 接入命令，建议先阅读 examples 或 docs 后再接入。"
      : "先完成依赖安装，再把示例任务改成自己的目标、工具权限和模型配置。";
  }

  return undefined;
}

export function calculateStarDelta(repo, previousItem, now = new Date()) {
  if (previousItem && Number.isFinite(previousItem.stars)) {
    return {
      starDelta24h: Math.max(0, repo.stargazers_count - previousItem.stars),
      growthNote: "observed",
    };
  }

  const ageDays = Math.max(1, daysBetween(repo.created_at, now));
  return {
    starDelta24h: Math.max(0, Math.round(repo.stargazers_count / Math.min(ageDays, 30))),
    growthNote: "estimated",
  };
}

export function scoreRepository(repo, readme = "", previousItem, now = new Date()) {
  const category = classifyRepository(repo, readme);
  const pushedDays = daysBetween(repo.pushed_at, now);
  const createdDays = daysBetween(repo.created_at, now);
  const { starDelta24h } = calculateStarDelta(repo, previousItem, now);
  const commandCount = extractCommands(readme, [...INSTALL_PATTERNS, ...QUICK_START_PATTERNS], 6).length;
  const hasHomepage = Boolean(repo.homepage);
  const topicCount = (repo.topics || []).length;
  const skillBoost = isSkillLike(category, repo, readme) ? 11 : 0;

  const popularity = clamp(Math.log10((repo.stargazers_count || 0) + 1) * 10, 0, 24);
  const growth = clamp(Math.log2(starDelta24h + 1) * 8, 0, 22);
  const freshness = clamp(18 - pushedDays * 1.7, 0, 18) + (createdDays <= 30 ? 6 : 0);
  const docs = clamp(readme.length / 380, 0, 14) + clamp(commandCount * 2.3, 0, 8);
  const metadata = clamp(topicCount * 1.8, 0, 8) + (repo.license?.spdx_id ? 4 : 0) + (hasHomepage ? 3 : 0);

  return Math.round(clamp(popularity + growth + freshness + docs + metadata + skillBoost, 0, 100));
}

export function buildDiscoveryItem(repo, readme = "", previousItem, now = new Date()) {
  const category = classifyRepository(repo, readme);
  const { installSteps, quickStart } = extractUsageNotes(readme);
  const { starDelta24h, growthNote } = calculateStarDelta(repo, previousItem, now);
  const tags = inferTags(repo, category);

  return {
    id: repo.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    kind: isSkillLike(category, repo, readme) ? "Skill" : "Project",
    category,
    name: repo.name,
    fullName: repo.full_name,
    repoUrl: repo.html_url,
    homepageUrl: repo.homepage || undefined,
    description: repo.description || "",
    summaryZh: buildSummary(repo, category),
    whyUseful: buildWhyUseful(repo, category, readme),
    useCases: buildUseCases(repo, category),
    quickStart,
    installSteps,
    skillIntegration: buildSkillIntegration(repo, category, installSteps),
    caveats: buildCaveats(repo, readme, installSteps),
    language: repo.language || "Unknown",
    topics: repo.topics || [],
    tags,
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    openIssues: repo.open_issues_count || 0,
    starDelta24h,
    growthNote,
    score: scoreRepository(repo, readme, previousItem, now),
    license: repo.license?.spdx_id || "unknown",
    owner: {
      login: repo.owner?.login || "unknown",
      avatarUrl: repo.owner?.avatar_url || `https://github.com/${repo.owner?.login || ""}.png`,
      url: repo.owner?.html_url || `https://github.com/${repo.owner?.login || ""}`,
    },
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
  };
}

export function dedupeRepositories(repositories) {
  const seen = new Set();
  const uniqueRepositories = [];

  for (const repository of repositories) {
    const key = repository.full_name?.toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueRepositories.push(repository);
  }

  return uniqueRepositories;
}
