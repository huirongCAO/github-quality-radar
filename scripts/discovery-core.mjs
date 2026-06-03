export const CATEGORY_KEYWORDS = {
  Security: [
    "security",
    "cybersecurity",
    "vulnerability",
    "pentest",
    "malware",
    "forensics",
    "threat",
    "owasp",
    "security-tools",
  ],
  DevOps: [
    "devops",
    "kubernetes",
    "docker",
    "terraform",
    "observability",
    "monitoring",
    "prometheus",
    "grafana",
    "ci/cd",
    "infrastructure",
  ],
  Data: [
    "data-engineering",
    "data engineering",
    "analytics",
    "etl",
    "database",
    "warehouse",
    "postgres",
    "mysql",
    "duckdb",
    "pipeline",
  ],
  Productivity: [
    "productivity",
    "note",
    "notes",
    "knowledge",
    "automation",
    "workflow",
    "shortcut",
    "task",
    "todo",
  ],
  Learning: ["roadmap", "course", "tutorial", "learn", "learning", "guide", "cheatsheet", "cheat sheet"],
  MCP: ["mcp", "model context protocol", "modelcontextprotocol"],
  Agent: ["agent", "multi-agent", "autonomous", "crew", "browser automation"],
  Skill: [
    "skill",
    "skills",
    "awesome",
    "cheatsheet",
    "cheat sheet",
    "playbook",
    "workflow",
    "roadmap",
    "tutorial",
    "guide",
    "examples",
    "recipes",
    "productivity",
    "automation",
  ],
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
  /\bpython3?\s+(?:-m|[\w./-]+\.py)\b[^\n\r`]*/gi,
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

const BROAD_SKILL_WORDS = [
  "skill",
  "skills",
  "awesome",
  "cheatsheet",
  "cheat sheet",
  "playbook",
  "workflow",
  "roadmap",
  "tutorial",
  "guide",
  "examples",
  "recipes",
  "productivity",
  "automation",
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

export function collectRepoMetadataText(repo) {
  return [repo.name, repo.full_name, repo.description, repo.language, ...(repo.topics || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifyRepository(repo, readme = "") {
  const metadataText = collectRepoMetadataText(repo);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => metadataText.includes(keyword))) {
      return category;
    }
  }

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
    category === "Skill" ||
    category === "AI Skill" ||
    category === "MCP" ||
    (category === "Agent" && AI_WORDS.some((word) => text.includes(word))) ||
    BROAD_SKILL_WORDS.some((word) => text.includes(word))
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
    Skill: "实用技能",
    "AI Skill": "AI 助手技能",
    MCP: "MCP 工具",
    Agent: "Agent 项目",
    CLI: "命令行工具",
    DevOps: "DevOps 技能",
    Security: "安全技能",
    Data: "数据技能",
    Productivity: "效率工具",
    Learning: "学习路线",
    "Web App": "Web 应用",
    Library: "开发库",
    Template: "项目模板",
    Project: "开源项目",
  };

  return names[category] || "开源项目";
}

export function buildPlainProblem(category) {
  const problems = {
    Skill: "帮你把某类经验、工具清单或实践方法快速整理成可复用的日常流程。",
    "AI Skill": "帮你把 AI 助手能力扩展到更具体的任务，而不是每次从零写提示词。",
    MCP: "帮 AI 助手连接外部工具、数据源或本地能力，让 agent 可以真正执行任务。",
    Agent: "把多步骤任务拆成可自动执行的流程，适合研究、编码、资料整理和自动化操作。",
    CLI: "把高频操作放进终端完成，适合每天需要快速处理文件、代码、接口或系统任务的人。",
    DevOps: "提升部署、监控、自动化运维或基础设施管理效率。",
    Security: "用于安全检查、风险识别、攻防学习或把安全工具纳入日常排查。",
    Data: "用于数据采集、清洗、调度、分析或数据管道建设。",
    Productivity: "减少重复操作，改善知识管理、任务流转、自动化和协作效率。",
    Learning: "提供路线图、示例、速查表或系统资料，适合长期学习和查漏补缺。",
    "Web App": "提供可以直接体验的网页产品，也适合借鉴交互和产品实现方式。",
    Library: "作为现有项目里的基础能力接入，减少自己重复造轮子。",
    Template: "快速启动一个新项目，复用目录结构、配置和最佳实践。",
    Project: "作为近期活跃的开源项目观察、试用或借鉴实现方式。",
  };

  return problems[category] || problems.Project;
}

export function buildAudience(category, repo) {
  const hasLanguage = Boolean(repo.language);
  const language = repo.language || "相关资料或工具";
  const audiences = {
    Skill: hasLanguage
      ? `适合想把 ${language} 或相关工具经验变成固定工作流的人。`
      : "适合想把资料清单、工具集合或实践方法变成固定工作流的人。",
    MCP: "适合正在使用 Codex、Claude、Cursor 或其他支持工具调用/上下文扩展的 AI 助手用户。",
    Agent: "适合希望把调研、编码、资料整理等多步骤任务交给 agent 的用户。",
    CLI: "适合每天使用终端、脚本或自动化命令提升效率的开发者。",
    Productivity: "适合想减少重复劳动、整理知识库、优化个人效率或团队协作的人。",
    Learning: "适合想系统学习一个方向，或者需要一份随时查阅资料清单的人。",
    "Web App": "适合想直接体验产品能力，或寻找可借鉴 Web 产品实现方式的人。",
    Library: `适合正在做 ${language} 项目，想把成熟能力接入自己代码的人。`,
    Template: "适合准备开新项目，希望少花时间搭脚手架的人。",
    DevOps: "适合负责部署、监控、CI/CD、容器或基础设施的人。",
    Security: "适合需要做安全学习、审计、排查或工具储备的人。",
    Data: "适合需要处理数据管道、分析、调度、ETL 或数据产品的人。",
    Project: "适合想发现近期活跃工具、判断是否值得收藏或试用的人。",
  };

  return audiences[category] || audiences.Project;
}

export function buildSummary(repo, category) {
  const description = repo.description || "官方暂未提供清晰描述";
  return `这是一个${zhCategoryName(category)}。它主要解决的问题是：${buildPlainProblem(category)} 官方简介：${description}。${buildAudience(category, repo)}`;
}

export function buildUseCases(repo, category) {
  const topics = (repo.topics || []).slice(0, 3).join("、");
  const base = {
    Skill: ["学习或复用某类实用技能", "把成熟方法整理进个人工作流"],
    "AI Skill": ["给 AI 助手补充可复用能力", "沉淀个人或团队的 agent 工作流"],
    MCP: ["把外部工具接入支持 MCP 的 AI 客户端", "为 agent 提供标准化工具调用"],
    Agent: ["搭建自动化研究、编码或浏览器任务", "验证多步骤 agent 工作流"],
    CLI: ["在终端中完成高频开发任务", "集成进脚本或 CI 流程"],
    DevOps: ["提升部署、监控或基础设施管理效率", "把运维流程沉淀成可重复执行的工具链"],
    Security: ["补充安全检测、攻防或审计技能", "把安全工具纳入日常检查流程"],
    Data: ["搭建数据采集、清洗、分析或可视化流程", "复用成熟的数据工程实践"],
    Productivity: ["优化个人效率、知识管理或自动化流程", "把重复任务整理成可执行工作流"],
    Learning: ["系统学习某个技术方向", "把路线图、示例或速查表加入日常练习"],
    "Web App": ["快速体验完整产品形态", "借鉴前端交互和数据流设计"],
    Library: ["接入现有应用作为基础能力", "学习 API 设计和工程组织"],
    Template: ["快速启动新项目", "复用成熟的目录结构和默认配置"],
    Project: ["评估新工具是否适合个人工作流", "学习近期活跃项目的实现方式"],
  };

  return unique([
    ...(base[category] || base.Project),
    topics ? `围绕 ${topics} 方向做二次开发或收藏为参考资料` : "阅读源码和 README 判断可复用部分",
    "先用一个小任务试运行，确认它真的能节省时间，再放进长期工具箱",
  ]).slice(0, 5);
}

export function buildWhyUseful(repo, category, readme) {
  const reasons = [];
  const pushedDays = daysBetween(repo.pushed_at);

  if (isSkillLike(category, repo, readme)) {
    reasons.push(`它不是单纯的代码仓库，更像一个可以拆解进日常工作的${zhCategoryName(category)}：先理解它解决什么问题，再挑一个场景试用。`);
  }

  if ((repo.topics || []).length >= 3) {
    reasons.push(`项目 topics 比较完整，能快速看出它和 ${repo.topics.slice(0, 4).join("、")} 等方向相关，减少你点进去后才发现不相关的时间。`);
  }

  if (readme.length > 1600) {
    reasons.push("README 内容比较充分，通常能找到安装、示例、配置或使用边界，比只有一句简介的项目更适合真正试用。");
  }

  if (pushedDays <= 7) {
    reasons.push("最近 7 天内还有更新，说明不是沉睡项目；如果你要投入时间学习或接入，维护活跃度更值得信任。");
  }

  if (repo.stargazers_count >= 100) {
    reasons.push(`已有 ${repo.stargazers_count.toLocaleString("en")} 个 stars，说明它至少经过了一批用户筛选，适合作为候选工具进入收藏或试用清单。`);
  }

  reasons.push("建议你先花 3-5 分钟看 README 的 examples、docs 或 screenshots，再决定是否收藏；不要一上来就完整接入。");

  return reasons.length > 0 ? reasons.slice(0, 5) : ["项目信号完整度一般，但近期活跃度值得关注。"];
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

  if (["Skill", "DevOps", "Security", "Data", "Productivity", "Learning"].includes(category)) {
    return installSteps.some((step) => step.includes("官方未提供明确"))
      ? "优先阅读 README 的 guide、examples、recipes 或 docs 章节，把可复用步骤整理到自己的工作流。"
      : "先按安装步骤跑通项目，再从 examples、recipes 或 docs 中挑一个场景改成自己的日常流程。";
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
