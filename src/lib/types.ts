export type ItemKind = "Project" | "Skill";

export type DiscoveryCategory =
  | "AI Skill"
  | "MCP"
  | "Agent"
  | "CLI"
  | "Web App"
  | "Library"
  | "Template"
  | "Project";

export interface DiscoveryOwner {
  login: string;
  avatarUrl: string;
  url: string;
}

export interface DiscoveryItem {
  id: string;
  kind: ItemKind;
  category: DiscoveryCategory;
  name: string;
  fullName: string;
  repoUrl: string;
  homepageUrl?: string;
  description: string;
  summaryZh: string;
  whyUseful: string[];
  useCases: string[];
  quickStart: string[];
  installSteps: string[];
  skillIntegration?: string;
  caveats: string[];
  language: string;
  topics: string[];
  tags: string[];
  stars: number;
  forks: number;
  openIssues: number;
  starDelta24h: number;
  growthNote: "observed" | "estimated";
  score: number;
  license: string;
  owner: DiscoveryOwner;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface DiscoveryReport {
  generatedAt: string;
  date: string;
  source: string;
  queryWindow: {
    createdAfter: string;
    pushedAfter: string;
  };
  items: DiscoveryItem[];
}
