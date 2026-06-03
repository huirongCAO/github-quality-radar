import { describe, expect, it } from "vitest";
import {
  buildDiscoveryItem,
  buildSummary,
  classifyRepository,
  dedupeRepositories,
  extractUsageNotes,
  scoreRepository,
} from "../scripts/discovery-core.mjs";

const baseRepo = {
  name: "demo-mcp-server",
  full_name: "example/demo-mcp-server",
  html_url: "https://github.com/example/demo-mcp-server",
  homepage: "",
  description: "A Model Context Protocol server for useful AI agent tools.",
  stargazers_count: 250,
  forks_count: 12,
  open_issues_count: 4,
  language: "TypeScript",
  topics: ["mcp", "agent", "tools"],
  created_at: "2026-05-20T00:00:00Z",
  updated_at: "2026-06-02T00:00:00Z",
  pushed_at: "2026-06-02T00:00:00Z",
  license: { spdx_id: "MIT" },
  owner: {
    login: "example",
    avatar_url: "https://github.com/example.png",
    html_url: "https://github.com/example",
  },
};

describe("discovery core", () => {
  it("classifies MCP and AI skill repositories", () => {
    expect(classifyRepository(baseRepo, "# MCP Server")).toBe("MCP");
  });

  it("classifies broad non-AI skill repositories", () => {
    expect(
      classifyRepository(
        {
          ...baseRepo,
          name: "awesome-terminal-skills",
          full_name: "example/awesome-terminal-skills",
          description: "Curated cheatsheets and workflow recipes for terminal productivity.",
          topics: ["awesome", "cheatsheet", "productivity"],
        },
        "# Terminal productivity",
      ),
    ).toBe("Productivity");
  });

  it("extracts install and quick-start commands from README content", () => {
    const readme = [
      "# Demo",
      "npm install demo-mcp-server",
      "pnpm run dev",
      "docker compose up",
    ].join("\n");

    const notes = extractUsageNotes(readme);

    expect(notes.installSteps).toContain("npm install demo-mcp-server");
    expect(notes.quickStart).toContain("pnpm run dev");
  });

  it("keeps generated explanation and usage fields populated", () => {
    const readme = "# Demo\nnpm install demo-mcp-server\nnpm run dev\n".repeat(80);
    const item = buildDiscoveryItem(baseRepo, readme, { stars: 240 }, new Date("2026-06-03T00:00:00Z"));

    expect(item.kind).toBe("Skill");
    expect(item.summaryZh.length).toBeGreaterThan(20);
    expect(item.whyUseful.length).toBeGreaterThan(0);
    expect(item.useCases.length).toBeGreaterThan(0);
    expect(item.installSteps.length).toBeGreaterThan(0);
    expect(item.quickStart.length).toBeGreaterThan(0);
    expect(item.caveats.length).toBeGreaterThan(0);
    expect(item.starDelta24h).toBe(10);
  });

  it("generates a detailed plain-language summary", () => {
    const summary = buildSummary(baseRepo, "Productivity");

    expect(summary).toContain("它主要解决的问题是");
    expect(summary).toContain("适合");
    expect(summary.length).toBeGreaterThan(80);
  });

  it("deduplicates repositories by full name", () => {
    const repos = dedupeRepositories([baseRepo, { ...baseRepo }, { ...baseRepo, full_name: "example/other" }]);

    expect(repos).toHaveLength(2);
  });

  it("scores richer active repositories higher than sparse ones", () => {
    const rich = scoreRepository(baseRepo, "# Demo\nnpm install demo\nnpm run dev\n".repeat(80), undefined, new Date("2026-06-03T00:00:00Z"));
    const sparse = scoreRepository(
      {
        ...baseRepo,
        description: "",
        stargazers_count: 2,
        topics: [],
        license: null,
        pushed_at: "2024-01-01T00:00:00Z",
      },
      "",
      undefined,
      new Date("2026-06-03T00:00:00Z"),
    );

    expect(rich).toBeGreaterThan(sparse);
  });
});
