export const BADGE_STYLE_IDS = ["1", "2", "3", "4"] as const;

export type BadgeStyleId = typeof BADGE_STYLE_IDS[number];

export type BadgeData = {
  repo: string;
  score: number;
  grade: string;
};

export type RankConfig = {
  level: "Normal" | "Rank 3" | "Rank 2" | "Rank 1";
  title: string;
  status: string;
  color: string;
  darkColor: string;
  emblem: "circle" | "shield" | "star" | "crown";
};

const CACHE_CONTROL = "public, max-age=0, s-maxage=300, stale-while-revalidate=86400";

export function getRankConfig(score: number): RankConfig {
  if (score >= 95) {
    return {
      level: "Rank 1",
      title: "Elite Maintainer",
      status: "Elite contributor health",
      color: "#E8A23D",
      darkColor: "#8A5410",
      emblem: "crown",
    };
  }

  if (score >= 85) {
    return {
      level: "Rank 2",
      title: "Silver Maintainer",
      status: "High contributor health",
      color: "#BAC7D6",
      darkColor: "#536272",
      emblem: "star",
    };
  }

  if (score >= 75) {
    return {
      level: "Rank 3",
      title: "Bronze Maintainer",
      status: "Contributor ready",
      color: "#C98243",
      darkColor: "#6E3D19",
      emblem: "shield",
    };
  }

  return {
    level: "Normal",
    title: "Standard Repo",
    status: "Needs improvement",
    color: "#8B8F9E",
    darkColor: "#434754",
    emblem: "circle",
  };
}

export function normalizeBadgeStyle(value: string | null): BadgeStyleId {
  const namedStyles: Record<string, BadgeStyleId> = {
    minimal: "1",
    shield: "2",
    metrics: "3",
    glow: "4",
  };
  const style = value ? namedStyles[value.toLowerCase()] ?? value : "1";
  return BADGE_STYLE_IDS.includes(style as BadgeStyleId) ? style as BadgeStyleId : "1";
}

export function createBadgeSvg(data: BadgeData, style: BadgeStyleId) {
  const rank = getRankConfig(data.score);

  switch (style) {
    case "2":
      return createRankShieldBadge(data, rank);
    case "3":
      return createMetricBarBadge(data, rank);
    case "4":
      return createGlowBadge(data, rank);
    default:
      return createMinimalBadge(data, rank);
  }
}

export function badgeResponse(svg: string, status = 200) {
  return new Response(svg, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function createErrorBadgeSvg(label = "Repo not found") {
  return wrapSvg(300, 52, `
    <rect width="300" height="52" rx="8" fill="#1B1E29" stroke="#303543"/>
    <text x="150" y="31" text-anchor="middle" class="muted" font-size="14">${escapeXml(label)}</text>
  `);
}

function createMinimalBadge(data: BadgeData, rank: RankConfig) {
  const width = 270;
  const leftWidth = 130;
  const repo = compactRepo(data.repo, 22);

  return wrapSvg(width, 32, `
    <defs>
      <linearGradient id="sheen" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".13"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="pill"><rect width="${width}" height="32" rx="6"/></clipPath>
    </defs>
    <g clip-path="url(#pill)">
      <rect width="${leftWidth}" height="32" fill="#252936"/>
      <rect x="${leftWidth}" width="${width - leftWidth}" height="32" fill="${rank.color}"/>
      <rect width="${width}" height="32" fill="url(#sheen)"/>
    </g>
    <text x="12" y="14" class="label" font-size="9" letter-spacing="1.2">WELCOMESCORE</text>
    <text x="12" y="26" class="muted" font-size="10">${escapeXml(repo)}</text>
    ${emblemSvg(rank, 143, 8, 16, "#12141C")}
    <text x="166" y="21" fill="#12141C" font-size="14" font-weight="700">${data.score}/100</text>
    <text x="246" y="21" fill="#12141C" font-size="12" font-weight="700">${escapeXml(data.grade)}</text>
  `);
}

function createRankShieldBadge(data: BadgeData, rank: RankConfig) {
  const repo = compactRepo(data.repo, 34);

  return wrapSvg(420, 92, `
    <defs>
      <linearGradient id="rankBorder" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${rank.color}"/>
        <stop offset="1" stop-color="${rank.darkColor}"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="418" height="90" rx="10" fill="#1B1E29" stroke="url(#rankBorder)" stroke-width="2"/>
    <rect x="14" y="14" width="64" height="64" rx="9" fill="${rank.darkColor}" stroke="${rank.color}"/>
    ${emblemSvg(rank, 30, 30, 32, rank.color)}
    <text x="96" y="27" class="label" font-size="10" letter-spacing="1.5">${rank.level.toUpperCase()}</text>
    <text x="96" y="48" class="text" font-size="18" font-weight="700">${escapeXml(rank.title)}</text>
    <text x="96" y="68" class="muted" font-size="12">${escapeXml(repo)}</text>
    <text x="382" y="46" text-anchor="end" fill="${rank.color}" font-size="30" font-weight="700">${data.score}</text>
    <text x="382" y="66" text-anchor="end" class="muted" font-size="11">${escapeXml(data.grade)} grade · 100 max</text>
  `);
}

function createMetricBarBadge(data: BadgeData, rank: RankConfig) {
  return wrapSvg(520, 54, `
    <rect x="1" y="1" width="518" height="52" rx="8" fill="#1B1E29" stroke="#303543"/>
    <rect x="1" y="1" width="8" height="52" rx="4" fill="${rank.color}"/>
    <text x="24" y="19" class="label" font-size="9" letter-spacing="1.2">WELCOMESCORE</text>
    <text x="24" y="38" class="text" font-size="14" font-weight="700">${data.score}/100</text>
    <line x1="150" y1="11" x2="150" y2="43" stroke="#303543"/>
    <text x="168" y="19" class="label" font-size="9" letter-spacing="1.2">GRADE</text>
    <text x="168" y="38" fill="${rank.color}" font-size="14" font-weight="700">${escapeXml(data.grade)}</text>
    <line x1="244" y1="11" x2="244" y2="43" stroke="#303543"/>
    <text x="262" y="19" class="label" font-size="9" letter-spacing="1.2">RANK</text>
    <text x="262" y="38" class="text" font-size="14" font-weight="700">${escapeXml(rank.title)}</text>
  `);
}

function createGlowBadge(data: BadgeData, rank: RankConfig) {
  const repo = compactRepo(data.repo, 36);

  return wrapSvg(430, 104, `
    <defs>
      <radialGradient id="glow" cx="74%" cy="45%" r="55%">
        <stop offset="0" stop-color="${rank.color}" stop-opacity=".34"/>
        <stop offset="1" stop-color="${rank.color}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="edge" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="${rank.color}"/>
        <stop offset="1" stop-color="#303543"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="428" height="102" rx="11" fill="#12141C" stroke="url(#edge)" stroke-width="2"/>
    <rect x="2" y="2" width="426" height="100" rx="10" fill="url(#glow)"/>
    <text x="20" y="26" fill="${rank.color}" font-size="10" font-weight="700" letter-spacing="1.5">WELCOMESCORE .JS.ORG</text>
    <text x="20" y="47" class="text" font-size="15" font-weight="700">${escapeXml(repo)}</text>
    <text x="20" y="72" class="muted" font-size="12">${escapeXml(rank.level)} · ${escapeXml(rank.status)}</text>
    <!-- The rank chip and score block occupy separate vertical zones so an emblem never reads as part of a three-digit score. -->
    <rect x="342" y="14" width="68" height="24" rx="6" fill="${rank.darkColor}" stroke="${rank.color}" stroke-opacity=".65"/>
    ${emblemSvg(rank, 349, 19, 14, rank.color)}
    <text x="402" y="29" text-anchor="end" fill="${rank.color}" font-size="9" font-weight="700" letter-spacing=".9">${escapeXml(rank.level.toUpperCase())}</text>
    <text x="404" y="76" text-anchor="end" fill="${rank.color}" font-size="40" font-weight="700">${data.score}</text>
    <text x="404" y="93" text-anchor="end" class="muted" font-size="11">${escapeXml(data.grade)} grade / 100</text>
  `);
}

function emblemSvg(rank: RankConfig, x: number, y: number, size: number, fill: string) {
  const scale = size / 32;
  const open = `<g transform="translate(${x} ${y}) scale(${scale})" fill="${fill}">`;

  switch (rank.emblem) {
    case "crown":
      return `${open}<path d="M2 26 5 8l8 7L16 4l3 11 8-7 3 18H2Zm3 3h22v3H5v-3Z"/></g>`;
    case "star":
      return `${open}<path d="m16 3 4.1 8.3 9.2 1.3-6.7 6.5 1.6 9.1-8.2-4.3-8.2 4.3 1.6-9.1-6.7-6.5 9.2-1.3L16 3Z"/></g>`;
    case "shield":
      return `${open}<path d="M16 3 28 8v8c0 7.1-4.8 11.9-12 14-7.2-2.1-12-6.9-12-14V8l12-5Zm0 5.4-6 2.5v5.2c0 3.9 2.2 6.9 6 8.6 3.8-1.7 6-4.7 6-8.6v-5.2l-6-2.5Z"/></g>`;
    default:
      return `${open}<circle cx="16" cy="16" r="11"/></g>`;
  }
}

function wrapSvg(width: number, height: number, content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="WelcomeScore contributor health badge"><style>.text{fill:#F2EEE6;font-family:IBM Plex Mono,ui-monospace,SFMono-Regular,Menlo,monospace}.muted{fill:#8B8F9E;font-family:IBM Plex Mono,ui-monospace,SFMono-Regular,Menlo,monospace}.label{fill:#8B8F9E;font-family:IBM Plex Mono,ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:700}</style>${content}</svg>`;
}

function compactRepo(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, Math.max(1, maxLength - 1))}…`;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character] ?? character);
}
