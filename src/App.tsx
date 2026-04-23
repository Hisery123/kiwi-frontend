import { useEffect, useMemo, useState } from "react";
import "./App.css";

type AssetEntry = {
  id?: number;
  name?: string;
  alias?: string;
  icon?: string;
  rarity?: string;
};

type RecommendationMetrics = {
  primary_games?: number;
  primary_weighted_games?: number;
  primary_weighted_win_rate?: number;
  primary_bayes_score?: number;

  first_item_games?: number;
  first_item_weighted_games?: number;
  first_item_weighted_win_rate?: number;
  first_item_bayes_score?: number;

  high_tier_games?: number;
  high_tier_weighted_games?: number;
  high_tier_weighted_win_rate?: number;
  high_tier_bayes_score?: number;
};

type RecommendationRow = {
  primary_rank?: number;
  first_item_rank?: number;
  high_tier_rank?: number;

  primary_augment?: AssetEntry | null;
  first_core_item?: AssetEntry | null;
  high_tier_augment?: AssetEntry | null;

  metrics?: RecommendationMetrics;
  extra?: {
    first_core_item_method_mode?: string;
    high_tier_detect_method_mode?: string;
  };
};

type HeroEntry = {
  champion: {
    id?: number;
    name?: string;
    alias?: string;
    icon?: string;
  };
  summary: {
    hero_games?: number;
    hero_weighted_games?: number;
    hero_wins?: number;
    hero_weighted_win_rate?: number;
    hero_bayes_score?: number;
  };
  recommendations: RecommendationRow[];
};

type Payload = {
  meta?: {
    asset_version?: string;
    champion_count?: number;
    item_count?: number;
    augment_count?: number;
    hero_count?: number;
    recommendation_row_count?: number;
    source_file?: string;
  };
  heroes: HeroEntry[];
};

const MIN_SHOW_HIGH_TIER_GAMES = 1;

function normalizePayload(raw: unknown): Payload {
  if (
    raw &&
    typeof raw === "object" &&
    "heroes" in raw &&
    Array.isArray((raw as Payload).heroes)
  ) {
    return raw as Payload;
  }
  return { heroes: [] };
}

function fmtPct01(v?: number) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return `${(v * 100).toFixed(2)}%`;
}

function fmtNum(v?: number) {
  if (v === null || v === undefined || Number.isNaN(v)) return "-";
  return Intl.NumberFormat("zh-CN").format(v);
}

function rarityLabel(rarity?: string) {
  switch (rarity) {
    case "kPrismatic":
      return "棱彩";
    case "kGold":
      return "金色";
    case "kSilver":
      return "银色";
    case "kBronze":
      return "铜色";
    default:
      return "";
  }
}

function rarityClass(rarity?: string) {
  switch (rarity) {
    case "kPrismatic":
      return "rarity rarity-prismatic";
    case "kGold":
      return "rarity rarity-gold";
    case "kSilver":
      return "rarity rarity-silver";
    case "kBronze":
      return "rarity rarity-bronze";
    default:
      return "rarity";
  }
}

function IconBox({
  src,
  alt,
  rarity,
}: {
  src?: string;
  alt: string;
  rarity?: string;
}) {
  return (
    <div className={`icon-box ${rarityClass(rarity)}`}>
      {src ? <img src={src} alt={alt} /> : <div className="icon-fallback">-</div>}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="stat-pill">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function hasHighTierRecommendation(row: RecommendationRow) {
  const games = row.metrics?.high_tier_games ?? 0;
  return !!(
    row.high_tier_augment?.id &&
    row.high_tier_augment?.name &&
    games >= MIN_SHOW_HIGH_TIER_GAMES
  );
}

function RecommendationCard({ row }: { row: RecommendationRow }) {
  const metrics = row.metrics || {};
  const showHighTier = hasHighTierRecommendation(row);

  return (
    <div className="recommend-card">
      <div className="recommend-block">
        <div className="block-head">
          <IconBox
            src={row.primary_augment?.icon}
            alt={row.primary_augment?.name || "主海克斯"}
            rarity={row.primary_augment?.rarity}
          />
          <div className="block-text">
            <div className="block-kicker">主海克斯 #{row.primary_rank ?? "-"}</div>
            <div className="block-title">{row.primary_augment?.name || "-"}</div>
            {row.primary_augment?.rarity ? (
              <span className={rarityClass(row.primary_augment.rarity)}>
                {rarityLabel(row.primary_augment.rarity)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="stat-grid">
          <Stat label="样本" value={fmtNum(metrics.primary_games)} />
          <Stat label="胜率" value={fmtPct01(metrics.primary_weighted_win_rate)} />
          <Stat label="贝叶斯" value={fmtPct01(metrics.primary_bayes_score)} />
        </div>
      </div>

      <div className="recommend-block">
        <div className="block-head">
          <IconBox
            src={row.first_core_item?.icon}
            alt={row.first_core_item?.name || "第一件核心装备"}
          />
          <div className="block-text">
            <div className="block-kicker">第一件核心装备 #{row.first_item_rank ?? "-"}</div>
            <div className="block-title">{row.first_core_item?.name || "-"}</div>
          </div>
        </div>
        <div className="stat-grid">
          <Stat label="样本" value={fmtNum(metrics.first_item_games)} />
          <Stat label="胜率" value={fmtPct01(metrics.first_item_weighted_win_rate)} />
          <Stat label="贝叶斯" value={fmtPct01(metrics.first_item_bayes_score)} />
        </div>
      </div>

      <div className="recommend-block">
        {showHighTier ? (
          <>
            <div className="block-head">
              <IconBox
                src={row.high_tier_augment?.icon}
                alt={row.high_tier_augment?.name || "高级海克斯"}
                rarity={row.high_tier_augment?.rarity}
              />
              <div className="block-text">
                <div className="block-kicker">高级海克斯 #{row.high_tier_rank ?? "-"}</div>
                <div className="block-title">{row.high_tier_augment?.name || "-"}</div>
                {row.high_tier_augment?.rarity ? (
                  <span className={rarityClass(row.high_tier_augment.rarity)}>
                    {rarityLabel(row.high_tier_augment.rarity)}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="stat-grid">
              <Stat label="样本" value={fmtNum(metrics.high_tier_games)} />
              <Stat label="胜率" value={fmtPct01(metrics.high_tier_weighted_win_rate)} />
              <Stat label="贝叶斯" value={fmtPct01(metrics.high_tier_bayes_score)} />
            </div>
          </>
        ) : (
          <div
            style={{
              minHeight: 154,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <div className="block-kicker">高级海克斯</div>
            <div className="block-title">暂无稳定高阶推荐</div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              当前这条组合没有足够样本形成高阶海克斯结论，
              先优先参考左侧的主海克斯和第一件核心装备。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [payload, setPayload] = useState<Payload>({ heroes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");
  const [selectedHeroName, setSelectedHeroName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/recommendations_visual.json", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`加载 recommendations_visual.json 失败：${res.status}`);
        }

        const raw = await res.json();
        const normalized = normalizePayload(raw);
        setPayload(normalized);

        if (normalized.heroes.length > 0) {
          setSelectedHeroName(normalized.heroes[0].champion?.name || "");
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("加载失败");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const heroes = useMemo(() => {
    const list = [...payload.heroes];
    list.sort(
      (a, b) =>
        (b.summary?.hero_bayes_score ?? 0) - (a.summary?.hero_bayes_score ?? 0)
    );
    return list;
  }, [payload]);

  const filteredHeroes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return heroes;
    return heroes.filter((h) =>
      (h.champion?.name || "").toLowerCase().includes(q)
    );
  }, [heroes, query]);

  const selectedHero = useMemo(() => {
    return (
      filteredHeroes.find((h) => h.champion?.name === selectedHeroName) ||
      heroes.find((h) => h.champion?.name === selectedHeroName) ||
      filteredHeroes[0] ||
      heroes[0] ||
      null
    );
  }, [filteredHeroes, heroes, selectedHeroName]);

  return (
    <div className="page">
      <div className="shell">
        <div className="hero-banner">
          <div>
            <div className="banner-kicker">KIWI 推荐助手 · 本地可视化</div>
            <h1>主海克斯 · 第一件核心装备 · 高级海克斯</h1>
            <p>现在这版已经按 recommendations_visual.json 的真实结构读取了。</p>
          </div>

          <div className="banner-stats">
            <Stat label="英雄数" value={fmtNum(payload.meta?.hero_count)} />
            <Stat label="版本" value={payload.meta?.asset_version || "-"} />
            <Stat label="来源" value={payload.meta?.source_file || "-"} />
          </div>
        </div>

        {loading ? (
          <div className="panel">正在加载 recommendations_visual.json ...</div>
        ) : error ? (
          <div className="panel error">{error}</div>
        ) : (
          <div className="layout">
            <aside className="sidebar">
              <div className="sidebar-head">
                <h2>英雄列表</h2>
                <input
                  className="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索英雄名..."
                />
              </div>

              <div className="hero-list">
                {filteredHeroes.map((hero) => {
                  const active =
                    selectedHero?.champion?.name === hero.champion?.name;

                  return (
                    <button
                      key={hero.champion?.id || hero.champion?.name}
                      className={`hero-item ${active ? "active" : ""}`}
                      onClick={() => setSelectedHeroName(hero.champion?.name || "")}
                    >
                      <div className="hero-avatar">
                        {hero.champion?.icon ? (
                          <img
                            src={hero.champion.icon}
                            alt={hero.champion?.name || ""}
                          />
                        ) : null}
                      </div>

                      <div className="hero-meta">
                        <div className="hero-name">{hero.champion?.name || "-"}</div>
                        <div className="hero-sub">
                          样本 {fmtNum(hero.summary?.hero_games)} · 胜率{" "}
                          {fmtPct01(hero.summary?.hero_weighted_win_rate)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="content">
              {selectedHero ? (
                <>
                  <div className="panel hero-summary">
                    <div className="hero-summary-left">
                      <div className="hero-summary-avatar">
                        {selectedHero.champion?.icon ? (
                          <img
                            src={selectedHero.champion.icon}
                            alt={selectedHero.champion?.name || ""}
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="summary-kicker">英雄详情</div>
                        <h2>{selectedHero.champion?.name || "-"}</h2>
                      </div>
                    </div>

                    <div className="hero-summary-stats">
                      <Stat
                        label="总样本"
                        value={fmtNum(selectedHero.summary?.hero_games)}
                      />
                      <Stat
                        label="加权样本"
                        value={fmtNum(selectedHero.summary?.hero_weighted_games)}
                      />
                      <Stat
                        label="加权胜率"
                        value={fmtPct01(
                          selectedHero.summary?.hero_weighted_win_rate
                        )}
                      />
                      <Stat
                        label="贝叶斯"
                        value={fmtPct01(selectedHero.summary?.hero_bayes_score)}
                      />
                    </div>
                  </div>

                  <div className="recommend-list">
                    {selectedHero.recommendations.map((row, idx) => (
                      <RecommendationCard
                        key={`${selectedHero.champion?.name || "hero"}-${idx}`}
                        row={row}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="panel">没有可显示的英雄数据。</div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}