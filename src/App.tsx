
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import "./App.css";

type AssetEntry = {
  id?: number;
  name?: string;
  alias?: string;
  icon?: string;
  rarity?: string;
  description_html?: string;
  description_text?: string;
};

type ItemEntry = AssetEntry & {
  total_gold?: number;
};

type HeroStats = {
  games?: number;
  weighted_games?: number;
  wins?: number;
  weighted_win_rate?: number;
  bayes_score?: number;
  confidence?: string;
};

type SupportAugmentEntry = {
  id?: number;
  name?: string;
  icon?: string;
  rarity?: string;
  description_html?: string;
  description_text?: string;
  games?: number;
  weighted_win_rate?: number;
  bayes_score?: number;
  confidence?: string;
};

type BuildEntry = {
  build_rank?: number;
  first_item?: ItemEntry | null;
  second_item?: ItemEntry | null;
  games?: number;
  weighted_games?: number;
  weighted_win_rate?: number;
  bayes_score?: number;
  confidence?: string;
  detect_method?: string;
};

type PrimaryBuildGroup = {
  primary_rank?: number;
  primary_augment?: AssetEntry | null;
  games?: number;
  weighted_games?: number;
  weighted_win_rate?: number;
  bayes_score?: number;
  confidence?: string;
  builds?: BuildEntry[];
  support_augments?: SupportAugmentEntry[];
};

type HighTierEntry = {
  high_tier_rank?: number;
  augment?: AssetEntry | null;
  games?: number;
  weighted_games?: number;
  weighted_win_rate?: number;
  bayes_score?: number;
  confidence?: string;
};

type HeroEntry = {
  champion: {
    id?: number;
    name?: string;
    alias?: string;
    icon?: string;
  };
  hero_stats?: HeroStats;
  primary_build_groups?: PrimaryBuildGroup[];
  high_tier_augments?: HighTierEntry[];
};

type Payload = {
  schema_version?: number;
  asset_version?: string;
  summary?: {
    hero_count?: number;
    primary_build_row_count?: number;
    high_tier_row_count?: number;
  };
  heroes: HeroEntry[];
};

type AssetKind = "augment" | "champion" | "item" | "generic";

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

function confidenceLabel(confidence?: string) {
  switch (confidence) {
    case "stable":
      return "稳定";
    case "medium":
      return "中样本";
    case "low_sample":
      return "低样本";
    case "empty":
      return "无数据";
    default:
      return confidence || "";
  }
}

function uniqueNonEmpty(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.filter((v): v is string => !!v && v.trim().length > 0)));
}

function buildImageCandidates(src?: string, id?: number, kind: AssetKind = "generic") {
  const candidates: string[] = [];

  if (src) {
    candidates.push(src);
  }

  if (kind === "augment" && id && id > 0) {
    candidates.push(`/augments/${id}.png`);
    candidates.push(`https://raw.githubusercontent.com/Hisery123/kiwi-frontend/main/public/augments/${id}.png`);
  }

  return uniqueNonEmpty(candidates);
}

function SmartImage({
  src,
  alt,
  id,
  kind = "generic",
  className,
}: {
  src?: string;
  alt: string;
  id?: number;
  kind?: AssetKind;
  className?: string;
}) {
  const candidates = useMemo(() => buildImageCandidates(src, id, kind), [src, id, kind]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src, id, kind]);

  const currentSrc = candidates[index];

  if (!currentSrc) {
    return null;
  }

  return (
    <img
      className={className}
      src={currentSrc}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex(index + 1);
        }
      }}
    />
  );
}

function HoverInfo({
  title,
  subtitle,
  description,
  children,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const desc = (description || "").trim();

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <div>{children}</div>

      {open && desc ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "calc(100% + 10px)",
            zIndex: 999,
            width: 320,
            maxWidth: "min(320px, 70vw)",
            padding: 12,
            borderRadius: 14,
            background: "rgba(2,6,23,0.96)",
            border: "1px solid rgba(148,163,184,0.18)",
            boxShadow: "0 18px 42px rgba(0,0,0,0.45)",
            color: "#e2e8f0",
            textAlign: "left",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 8 }}>{subtitle}</div>
          ) : null}
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              color: "#cbd5e1",
            }}
          >
            {desc}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IconBox({
  src,
  alt,
  rarity,
  id,
  kind = "generic",
}: {
  src?: string;
  alt: string;
  rarity?: string;
  id?: number;
  kind?: AssetKind;
}) {
  return (
    <div className={`icon-box ${rarityClass(rarity)}`}>
      {buildImageCandidates(src, id, kind).length > 0 ? (
        <SmartImage src={src} alt={alt} id={id} kind={kind} />
      ) : (
        <div className="icon-fallback">{alt?.slice(0, 1) || "-"}</div>
      )}
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

function Badge({
  text,
  rarity,
}: {
  text: string;
  rarity?: string;
}) {
  return (
    <span
      className={rarity ? rarityClass(rarity) : "rarity"}
      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
    >
      {text}
    </span>
  );
}

function SupportAugmentChip({ item }: { item: SupportAugmentEntry }) {
  return (
    <HoverInfo
      title={item.name || "后续符文"}
      subtitle={`样本 ${fmtNum(item.games)} · 胜率 ${fmtPct01(item.weighted_win_rate)}`}
      description={item.description_text}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 10px",
          borderRadius: 12,
          background: "rgba(15,23,42,0.45)",
          border: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        <IconBox
          src={item.icon}
          alt={item.name || "后续符文"}
          rarity={item.rarity}
          id={item.id}
          kind="augment"
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name || "-"}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            样本 {fmtNum(item.games)} · 胜率 {fmtPct01(item.weighted_win_rate)} ·{" "}
            {confidenceLabel(item.confidence)}
          </div>
        </div>
      </div>
    </HoverInfo>
  );
}

function BuildRow({ build }: { build: BuildEntry }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        background: "rgba(15,23,42,0.38)",
        border: "1px solid rgba(148,163,184,0.15)",
      }}
    >
      <HoverInfo
        title={build.first_item?.name || "第一件大件"}
        subtitle={`总价 ${fmtNum(build.first_item?.total_gold)} · 样本 ${fmtNum(build.games)}`}
        description={build.first_item?.description_text}
      >
        <div>
          <div className="block-kicker">第一件大件 #{build.build_rank ?? "-"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <IconBox
              src={build.first_item?.icon}
              alt={build.first_item?.name || "第一件大件"}
              id={build.first_item?.id}
              kind="item"
            />
            <div>
              <div className="block-title" style={{ fontSize: 16 }}>
                {build.first_item?.name || "-"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                总价 {fmtNum(build.first_item?.total_gold)}
              </div>
            </div>
          </div>
        </div>
      </HoverInfo>

      <HoverInfo
        title={build.second_item?.name || "第二件大件"}
        subtitle={`总价 ${fmtNum(build.second_item?.total_gold)}`}
        description={build.second_item?.description_text}
      >
        <div>
          <div className="block-kicker">第二件大件</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <IconBox
              src={build.second_item?.icon}
              alt={build.second_item?.name || "第二件大件"}
              id={build.second_item?.id}
              kind="item"
            />
            <div>
              <div className="block-title" style={{ fontSize: 16 }}>
                {build.second_item?.name || "-"}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>
                总价 {fmtNum(build.second_item?.total_gold)}
              </div>
            </div>
          </div>
        </div>
      </HoverInfo>

      <div style={{ minWidth: 180 }}>
        <div className="stat-grid">
          <Stat label="样本" value={fmtNum(build.games)} />
          <Stat label="胜率" value={fmtPct01(build.weighted_win_rate)} />
          <Stat label="贝叶斯" value={fmtPct01(build.bayes_score)} />
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#94a3b8",
            textAlign: "right",
          }}
        >
          {confidenceLabel(build.confidence)}
        </div>
      </div>
    </div>
  );
}

function PrimaryGroupCard({ group }: { group: PrimaryBuildGroup }) {
  const builds = group.builds || [];
  const supportAugments = group.support_augments || [];

  return (
    <div className="recommend-card" style={{ display: "block" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <HoverInfo
          title={group.primary_augment?.name || "主海克斯"}
          subtitle={`样本 ${fmtNum(group.games)} · 胜率 ${fmtPct01(group.weighted_win_rate)}`}
          description={group.primary_augment?.description_text}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconBox
              src={group.primary_augment?.icon}
              alt={group.primary_augment?.name || "主海克斯"}
              rarity={group.primary_augment?.rarity}
              id={group.primary_augment?.id}
              kind="augment"
            />
            <div>
              <div className="block-kicker">主海克斯 #{group.primary_rank ?? "-"}</div>
              <div className="block-title">{group.primary_augment?.name || "-"}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {group.primary_augment?.rarity ? (
                  <Badge
                    text={rarityLabel(group.primary_augment.rarity)}
                    rarity={group.primary_augment.rarity}
                  />
                ) : null}
                <Badge text={confidenceLabel(group.confidence)} />
              </div>
            </div>
          </div>
        </HoverInfo>

        <div className="stat-grid">
          <Stat label="样本" value={fmtNum(group.games)} />
          <Stat label="胜率" value={fmtPct01(group.weighted_win_rate)} />
          <Stat label="贝叶斯" value={fmtPct01(group.bayes_score)} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {builds.length > 0 ? (
          builds.map((build) => (
            <BuildRow
              key={`${group.primary_rank || 0}-${build.build_rank || 0}-${build.first_item?.id || 0}-${build.second_item?.id || 0}`}
              build={build}
            />
          ))
        ) : (
          <div className="panel">这个主海克斯暂时没有可展示的大件路线。</div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <div className="block-kicker" style={{ marginBottom: 10 }}>
          适配后续符文
        </div>
        {supportAugments.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 10,
            }}
          >
            {supportAugments.map((item) => (
              <SupportAugmentChip
                key={`${group.primary_rank || 0}-${item.id || 0}`}
                item={item}
              />
            ))}
          </div>
        ) : (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            暂时没有明显更优的后续符文组合。
          </div>
        )}
      </div>
    </div>
  );
}

function HighTierCard({ item }: { item: HighTierEntry }) {
  return (
    <HoverInfo
      title={item.augment?.name || "高级海克斯"}
      subtitle={`样本 ${fmtNum(item.games)} · 胜率 ${fmtPct01(item.weighted_win_rate)}`}
      description={item.augment?.description_text}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          padding: 14,
          borderRadius: 16,
          background: "rgba(15,23,42,0.38)",
          border: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconBox
            src={item.augment?.icon}
            alt={item.augment?.name || "高级海克斯"}
            rarity={item.augment?.rarity}
            id={item.augment?.id}
            kind="augment"
          />
          <div>
            <div className="block-kicker">高级海克斯 #{item.high_tier_rank ?? "-"}</div>
            <div className="block-title" style={{ fontSize: 18 }}>
              {item.augment?.name || "-"}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {item.augment?.rarity ? (
                <Badge
                  text={rarityLabel(item.augment.rarity)}
                  rarity={item.augment.rarity}
                />
              ) : null}
              <Badge text={confidenceLabel(item.confidence)} />
            </div>
          </div>
        </div>

        <div className="stat-grid">
          <Stat label="样本" value={fmtNum(item.games)} />
          <Stat label="胜率" value={fmtPct01(item.weighted_win_rate)} />
          <Stat label="贝叶斯" value={fmtPct01(item.bayes_score)} />
        </div>
      </div>
    </HoverInfo>
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

        const res = await fetch("/recommendations_visual_v2.json", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`加载 recommendations_visual_v2.json 失败：${res.status}`);
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
    list.sort((a, b) => (b.hero_stats?.bayes_score ?? 0) - (a.hero_stats?.bayes_score ?? 0));
    return list;
  }, [payload]);

  const filteredHeroes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return heroes;
    return heroes.filter((h) => (h.champion?.name || "").toLowerCase().includes(q));
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
            <div className="banner-kicker">KIWI 推荐助手 · 本地可视化 v2</div>
            <h1>主海克斯路线 · 后续符文 · 英雄级高级海克斯</h1>
            <p>鼠标悬停在海克斯或装备上，可以查看完整描述。</p>
          </div>

          <div className="banner-stats">
            <Stat label="英雄数" value={fmtNum(payload.summary?.hero_count)} />
            <Stat label="主路线行数" value={fmtNum(payload.summary?.primary_build_row_count)} />
            <Stat label="高级海克斯行数" value={fmtNum(payload.summary?.high_tier_row_count)} />
          </div>
        </div>

        {loading ? (
          <div className="panel">正在加载 recommendations_visual_v2.json ...</div>
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  placeholder="搜索英雄名..."
                />
              </div>

              <div className="hero-list">
                {filteredHeroes.map((hero) => {
                  const active = selectedHero?.champion?.name === hero.champion?.name;

                  return (
                    <button
                      key={hero.champion?.id || hero.champion?.name}
                      className={`hero-item ${active ? "active" : ""}`}
                      onClick={() => setSelectedHeroName(hero.champion?.name || "")}
                    >
                      <div className="hero-avatar">
                        {hero.champion?.icon ? (
                          <SmartImage
                            src={hero.champion.icon}
                            alt={hero.champion?.name || ""}
                            id={hero.champion?.id}
                            kind="champion"
                          />
                        ) : null}
                      </div>

                      <div className="hero-meta">
                        <div className="hero-name">{hero.champion?.name || "-"}</div>
                        <div className="hero-sub">
                          样本 {fmtNum(hero.hero_stats?.games)} · 胜率{" "}
                          {fmtPct01(hero.hero_stats?.weighted_win_rate)}
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
                          <SmartImage
                            src={selectedHero.champion.icon}
                            alt={selectedHero.champion?.name || ""}
                            id={selectedHero.champion?.id}
                            kind="champion"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="summary-kicker">英雄详情</div>
                        <h2>{selectedHero.champion?.name || "-"}</h2>
                        <div style={{ marginTop: 8 }}>
                          <Badge text={confidenceLabel(selectedHero.hero_stats?.confidence)} />
                        </div>
                      </div>
                    </div>

                    <div className="hero-summary-stats">
                      <Stat label="总样本" value={fmtNum(selectedHero.hero_stats?.games)} />
                      <Stat label="加权样本" value={fmtNum(selectedHero.hero_stats?.weighted_games)} />
                      <Stat label="加权胜率" value={fmtPct01(selectedHero.hero_stats?.weighted_win_rate)} />
                      <Stat label="贝叶斯" value={fmtPct01(selectedHero.hero_stats?.bayes_score)} />
                    </div>
                  </div>

                  <div className="panel" style={{ marginBottom: 16 }}>
                    <div className="summary-kicker" style={{ marginBottom: 10 }}>
                      主海克斯路线推荐
                    </div>
                    <div style={{ display: "grid", gap: 14 }}>
                      {(selectedHero.primary_build_groups || []).length > 0 ? (
                        (selectedHero.primary_build_groups || []).map((group) => (
                          <PrimaryGroupCard
                            key={`${selectedHero.champion?.name || "hero"}-${group.primary_rank || 0}-${group.primary_augment?.id || 0}`}
                            group={group}
                          />
                        ))
                      ) : (
                        <div className="panel">这个英雄暂时没有主海克斯路线数据。</div>
                      )}
                    </div>
                  </div>

                  <div className="panel">
                    <div className="summary-kicker" style={{ marginBottom: 10 }}>
                      英雄级高级海克斯
                    </div>
                    <div style={{ display: "grid", gap: 12 }}>
                      {(selectedHero.high_tier_augments || []).length > 0 ? (
                        (selectedHero.high_tier_augments || []).map((item) => (
                          <HighTierCard
                            key={`${selectedHero.champion?.name || "hero"}-high-${item.high_tier_rank || 0}-${item.augment?.id || 0}`}
                            item={item}
                          />
                        ))
                      ) : (
                        <div className="panel">这个英雄暂时没有可展示的高级海克斯数据。</div>
                      )}
                    </div>
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
