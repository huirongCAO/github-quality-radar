import {
  ArrowDownUp,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  ExternalLink,
  Filter,
  Github,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { loadDiscoveryReport } from "./lib/data";
import type { DiscoveryCategory, DiscoveryItem, DiscoveryReport } from "./lib/types";

const categories: Array<"All" | DiscoveryCategory> = [
  "All",
  "Skill",
  "MCP",
  "Agent",
  "CLI",
  "DevOps",
  "Security",
  "Data",
  "Productivity",
  "Learning",
  "Web App",
  "Library",
  "Template",
  "Project",
];

const categoryLabels: Record<"All" | DiscoveryCategory, string> = {
  All: "全部",
  Skill: "Skill",
  "AI Skill": "AI Skill",
  MCP: "MCP",
  Agent: "Agent",
  CLI: "CLI",
  DevOps: "DevOps",
  Security: "安全",
  Data: "数据",
  Productivity: "效率",
  Learning: "学习",
  "Web App": "Web App",
  Library: "Library",
  Template: "Template",
  Project: "Project",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function getStoredFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem("favoriteRepos") || "[]") as string[];
  } catch {
    return [];
  }
}

function saveFavorites(ids: string[]) {
  localStorage.setItem("favoriteRepos", JSON.stringify(ids));
}

function App() {
  const [report, setReport] = useState<DiscoveryReport | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"All" | DiscoveryCategory>("All");
  const [favorites, setFavorites] = useState<string[]>(() => getStoredFavorites());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadDiscoveryReport().then((nextReport) => {
      setReport(nextReport);
      setSelectedId(nextReport.items[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const items = report?.items ?? [];
  const selectedItem = selectedId ? items.find((item) => item.id === selectedId) : undefined;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => activeCategory === "All" || item.category === activeCategory)
      .filter((item) => !showFavoritesOnly || favorites.includes(item.id))
      .filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        const text = [
          item.name,
          item.fullName,
          item.description,
          item.summaryZh,
          item.category,
          item.kind,
          ...item.topics,
          ...item.tags,
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(normalizedQuery);
      })
      .sort((a, b) => b.score - a.score || b.starDelta24h - a.starDelta24h);
  }, [activeCategory, favorites, items, query, showFavoritesOnly]);

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id],
    );
  }

  if (!report) {
    return (
      <main className="app-shell loading-shell">
        <Sparkles aria-hidden="true" />
        <p>正在载入今日精选</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="top-band">
        <div className="brand-row">
          <div className="brand-lockup">
            <div className="brand-mark">
              <Github aria-hidden="true" size={22} />
            </div>
            <div>
              <p className="eyebrow">每日 09:00 北京时间</p>
              <h1>GitHub 优质项目雷达</h1>
            </div>
          </div>
          <a className="icon-link" href="https://github.com" target="_blank" rel="noreferrer" aria-label="打开 GitHub">
            <ExternalLink aria-hidden="true" size={18} />
          </a>
        </div>

        <div className="status-strip" aria-label="日报状态">
          <span>
            <CalendarClock aria-hidden="true" size={16} />
            {formatDate(report.generatedAt)}
          </span>
          <span>
            <Sparkles aria-hidden="true" size={16} />
            精选 {items.length} 个
          </span>
          <span>
            <ArrowDownUp aria-hidden="true" size={16} />
            实用增长排序
          </span>
        </div>
      </section>

      <section className="control-band">
        <label className="search-box">
          <Search aria-hidden="true" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索项目、skill、MCP、CLI"
          />
        </label>

        <div className="filter-row" aria-label="分类筛选">
          <Filter aria-hidden="true" size={16} />
          {categories.map((category) => (
            <button
              key={category}
              className={category === activeCategory ? "segment active" : "segment"}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {categoryLabels[category]}
            </button>
          ))}
          <button
            className={showFavoritesOnly ? "segment active favorite-filter" : "segment favorite-filter"}
            onClick={() => setShowFavoritesOnly((value) => !value)}
            type="button"
            aria-label={showFavoritesOnly ? "显示全部项目" : "只看收藏项目"}
          >
            <BookmarkCheck aria-hidden="true" size={15} />
            收藏
          </button>
        </div>
      </section>

      <section className="content-grid">
        <div className="list-column" aria-label="今日精选列表">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <p>没有匹配的项目。</p>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <RepoCard
                key={item.id}
                item={item}
                rank={index + 1}
                selected={item.id === selectedItem?.id}
                favorite={favorites.includes(item.id)}
                onOpen={() => setSelectedId(item.id)}
                onFavorite={() => toggleFavorite(item.id)}
              />
            ))
          )}
        </div>

        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            favorite={favorites.includes(selectedItem.id)}
            onClose={() => setSelectedId(null)}
            onFavorite={() => toggleFavorite(selectedItem.id)}
          />
        )}
      </section>
    </main>
  );
}

interface RepoCardProps {
  item: DiscoveryItem;
  rank: number;
  selected: boolean;
  favorite: boolean;
  onOpen: () => void;
  onFavorite: () => void;
}

function RepoCard({ item, rank, selected, favorite, onOpen, onFavorite }: RepoCardProps) {
  return (
    <article className={selected ? "repo-card selected" : "repo-card"}>
      <button className="card-main" type="button" onClick={onOpen}>
        <div className="rank-badge">{rank}</div>
        <img className="owner-avatar" src={item.owner.avatarUrl} alt={`${item.owner.login} avatar`} loading="lazy" />
        <div className="card-copy">
          <div className="card-title-row">
            <h2>{item.name}</h2>
            <span className={item.kind === "Skill" ? "kind-pill skill" : "kind-pill"}>{item.kind}</span>
          </div>
          <p className="repo-name">{item.fullName}</p>
          <p className="summary-line">{item.summaryZh}</p>
          <div className="metric-row">
            <span>
              <Star aria-hidden="true" size={15} />
              {formatNumber(item.stars)}
            </span>
            <span>+{formatNumber(item.starDelta24h)}</span>
            <span>{item.category}</span>
            <span>{item.language}</span>
          </div>
        </div>
      </button>
      <button
        className={favorite ? "icon-button saved" : "icon-button"}
        type="button"
        onClick={onFavorite}
        aria-label={favorite ? "取消收藏" : "收藏项目"}
      >
        {favorite ? <BookmarkCheck aria-hidden="true" size={18} /> : <Bookmark aria-hidden="true" size={18} />}
      </button>
    </article>
  );
}

interface DetailPanelProps {
  item: DiscoveryItem;
  favorite: boolean;
  onClose: () => void;
  onFavorite: () => void;
}

function DetailPanel({ item, favorite, onClose, onFavorite }: DetailPanelProps) {
  return (
    <aside className="detail-panel" aria-label={`${item.name} 详情`}>
      <div className="detail-actions">
        <button
          className={favorite ? "icon-button saved" : "icon-button"}
          type="button"
          onClick={onFavorite}
          aria-label={favorite ? "取消收藏当前项目" : "收藏当前项目"}
        >
          {favorite ? <BookmarkCheck aria-hidden="true" size={18} /> : <Bookmark aria-hidden="true" size={18} />}
          <span>{favorite ? "已收藏" : "收藏"}</span>
        </button>
        <button className="icon-button close-button" type="button" onClick={onClose} aria-label="关闭详情">
          <X aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="detail-hero">
        <img className="detail-avatar" src={item.owner.avatarUrl} alt={`${item.owner.login} avatar`} />
        <div>
          <p className="eyebrow">{item.category}</p>
          <h2>{item.name}</h2>
          <a href={item.repoUrl} target="_blank" rel="noreferrer">
            {item.fullName}
            <ExternalLink aria-hidden="true" size={15} />
          </a>
        </div>
      </div>

      <div className="score-grid">
        <div>
          <span>质量分</span>
          <strong>{item.score}</strong>
        </div>
        <div>
          <span>Stars</span>
          <strong>{formatNumber(item.stars)}</strong>
        </div>
        <div>
          <span>24h</span>
          <strong>+{formatNumber(item.starDelta24h)}</strong>
        </div>
      </div>

      <section className="detail-section">
        <h3>项目讲解</h3>
        <p>{item.summaryZh}</p>
      </section>

      <InfoList title="为什么值得看" items={item.whyUseful} />
      <InfoList title="适合场景" items={item.useCases} />
      <InfoList title="安装或接入" items={item.installSteps} code />
      <InfoList title="快速使用" items={item.quickStart} code />

      {item.skillIntegration && (
        <section className="detail-section">
          <h3>Skill 接入</h3>
          <p>{item.skillIntegration}</p>
        </section>
      )}

      <InfoList title="注意事项" items={item.caveats} />

      <div className="tag-row">
        {item.tags.slice(0, 6).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </aside>
  );
}

function InfoList({ title, items, code = false }: { title: string; items: string[]; code?: boolean }) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      <ul className={code ? "code-list" : undefined}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default App;
