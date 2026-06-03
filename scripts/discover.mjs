import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  buildDiscoveryItem,
  dedupeRepositories,
  scoreRepository,
  toDateOnly,
} from "./discovery-core.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(rootDir, "public/data/latest.json");
const token = process.env.DISCOVERY_GITHUB_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const now = new Date();
const createdAfter = toDateOnly(new Date(now.getTime() - 21 * 86_400_000));
const pushedAfter = toDateOnly(new Date(now.getTime() - 10 * 86_400_000));

const queries = [
  `topic:awesome pushed:>${pushedAfter} stars:>100 archived:false`,
  `topic:cheatsheet pushed:>${pushedAfter} stars:>50 archived:false`,
  `topic:productivity pushed:>${pushedAfter} stars:>50 archived:false`,
  `topic:automation pushed:>${pushedAfter} stars:>50 archived:false`,
  `topic:devops pushed:>${pushedAfter} stars:>50 archived:false`,
  `topic:security-tools pushed:>${pushedAfter} stars:>20 archived:false`,
  `topic:data-engineering pushed:>${pushedAfter} stars:>20 archived:false`,
  `topic:cli pushed:>${pushedAfter} stars:>100 archived:false`,
  `developer tools pushed:>${pushedAfter} stars:>100 archived:false`,
  `learning roadmap pushed:>${pushedAfter} stars:>50 archived:false`,
  `workflow automation pushed:>${pushedAfter} stars:>50 archived:false`,
  `topic:mcp pushed:>${pushedAfter} stars:>5 archived:false`,
  `mcp server pushed:>${pushedAfter} stars:>5 archived:false`,
  `agent ai pushed:>${pushedAfter} stars:>20 archived:false`,
  `ai skill pushed:>${pushedAfter} stars:>5 archived:false`,
  `claude codex assistant pushed:>${pushedAfter} stars:>5 archived:false`,
  `llm cli pushed:>${pushedAfter} stars:>20 archived:false`,
  `developer tools ai pushed:>${pushedAfter} stars:>20 archived:false`,
  `topic:ai created:>${createdAfter} stars:>5 archived:false`,
  `topic:llm created:>${createdAfter} stars:>5 archived:false`,
  `template fullstack created:>${createdAfter} stars:>10 archived:false`,
  `react nextjs tool pushed:>${pushedAfter} stars:>50 archived:false`,
];

const AI_HEAVY_WORDS = [
  "ai",
  "llm",
  "agent",
  "mcp",
  "claude",
  "codex",
  "openai",
  "gemini",
  "chatgpt",
  "rag",
];

function isAiHeavyItem(item) {
  const text = [item.category, item.fullName, item.description, ...item.topics, ...item.tags]
    .join(" ")
    .toLowerCase();
  return AI_HEAVY_WORDS.some((word) => text.includes(word));
}

function selectDiverseItems(items, limit = 10) {
  const sortedItems = [...items].sort((a, b) => b.score - a.score || b.starDelta24h - a.starDelta24h);
  const selected = [];
  const selectedIds = new Set();
  const categoryCounts = new Map();

  function add(item) {
    selected.push(item);
    selectedIds.add(item.id);
    categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
  }

  for (const category of ["DevOps", "Security", "Data", "Productivity", "Learning", "CLI", "Skill"]) {
    const candidate = sortedItems.find((item) => item.category === category && !selectedIds.has(item.id));
    if (candidate && selected.length < limit) {
      add(candidate);
    }
  }

  for (const item of sortedItems) {
    if (selected.length >= limit || selectedIds.has(item.id)) {
      continue;
    }

    const aiHeavyCount = selected.filter(isAiHeavyItem).length;
    const categoryCount = categoryCounts.get(item.category) || 0;

    if (isAiHeavyItem(item) && aiHeavyCount >= 4) {
      continue;
    }

    if (categoryCount >= 2) {
      continue;
    }

    add(item);
  }

  for (const item of sortedItems) {
    if (selected.length >= limit) {
      break;
    }

    if (!selectedIds.has(item.id)) {
      add(item);
    }
  }

  return selected.sort((a, b) => b.score - a.score || b.starDelta24h - a.starDelta24h);
}

async function githubFetch(url, accept = "application/vnd.github+json") {
  const headers = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "github-quality-radar",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GitHub request failed: ${response.status} ${response.statusText} ${body.slice(0, 180)}`);
  }

  return response;
}

async function searchRepositories(query) {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "stars");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "18");

  const response = await githubFetch(url);
  const payload = await response.json();
  return payload.items || [];
}

async function fetchReadme(repository) {
  const url = `https://api.github.com/repos/${repository.full_name}/readme`;

  try {
    const response = await githubFetch(url, "application/vnd.github.raw+json");
    return await response.text();
  } catch (error) {
    console.warn(`README not available for ${repository.full_name}: ${error.message}`);
    return "";
  }
}

async function loadPreviousItems() {
  try {
    const report = JSON.parse(await readFile(outputPath, "utf8"));
    return new Map((report.items || []).map((item) => [item.fullName.toLowerCase(), item]));
  } catch {
    return new Map();
  }
}

async function discover() {
  const previousItems = await loadPreviousItems();
  const repositories = [];

  for (const query of queries) {
    try {
      const items = await searchRepositories(query);
      repositories.push(...items);
      console.log(`Found ${items.length} repositories for: ${query}`);
    } catch (error) {
      console.warn(`Search skipped for "${query}": ${error.message}`);
    }
  }

  const uniqueRepositories = dedupeRepositories(repositories)
    .filter((repo) => !repo.fork && !repo.archived)
    .slice(0, 80);

  const scoredPreview = uniqueRepositories
    .map((repo) => ({
      repo,
      previewScore: scoreRepository(repo, "", previousItems.get(repo.full_name.toLowerCase()), now),
    }))
    .sort((a, b) => b.previewScore - a.previewScore)
    .slice(0, 80);

  const items = [];

  for (const { repo } of scoredPreview) {
    const readme = await fetchReadme(repo);
    items.push(buildDiscoveryItem(repo, readme, previousItems.get(repo.full_name.toLowerCase()), now));
  }

  const report = {
    generatedAt: now.toISOString(),
    date: toDateOnly(now),
    source: "github-search-api",
    queryWindow: {
      createdAfter,
      pushedAfter,
    },
    items: selectDiverseItems(items, 10),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${report.items.length} items to ${outputPath}`);
}

discover().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
