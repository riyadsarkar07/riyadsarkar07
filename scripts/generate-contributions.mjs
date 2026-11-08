#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig, repositoryRoot } from "./lib/config.mjs";

const API_USERNAME = process.env.PROFILE_USERNAME;
const SOURCE = "https://github.com/users";
const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 56;
const TOP = 80;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LEVELS = ["#0B1626", "#0E4E5C", "#0E7490", "#0891B2", "#22D3EE"];

function escapeXml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function parseContributions(html) {
  const tooltips = new Map();
  for (const match of html.matchAll(/<tool-tip[^>]*for="(contribution-day-component-[^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    tooltips.set(match[1], decodeEntities(match[2].replace(/<[^>]+>/g, "")).trim());
  }

  const days = new Map();
  for (const match of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"/g)) {
    const tagStart = html.lastIndexOf("<", match.index);
    const tagEnd = html.indexOf(">", match.index);
    const tag = html.slice(tagStart, tagEnd);
    const cellId = /id="(contribution-day-component-[^"]+)"/.exec(tag)?.[1];
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? -1);
    const tooltip = cellId ? tooltips.get(cellId) : "";
    const count = tooltip && !tooltip.startsWith("No ")
      ? Number(/^(\d+)\s+contribution/.exec(tooltip)?.[1] ?? 0)
      : 0;
    days.set(match[1], { date: match[1], count, level });
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildWeeks(contributions) {
  const weeks = [];
  let current = null;
  for (const day of contributions) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const weekday = date.getUTCDay();
    if (!current || weekday === 0) {
      current = { days: new Array(7).fill(null), month: date.getUTCMonth(), firstDay: date.getUTCDate() };
      weeks.push(current);
    }
    current.days[weekday] = day;
  }
  return weeks;
}

function levelFor(day) {
  if (day.count <= 0) return 0;
  return Math.min(4, Math.max(1, day.level || 1));
}

function renderHeatmap({ contributions, total, weeks, username, period }) {
  const width = LEFT + weeks.length * STEP + 16;
  const height = TOP + 7 * STEP + 38;

  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    if (week.month === lastMonth) return;
    const x = LEFT + index * STEP;
    if (x + 24 > width - 90) return;
    monthLabels.push(`<text x="${x}" y="${TOP - 18}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="8.5" letter-spacing="0.8" fill="#64748B">${MONTH_LABELS[week.month]}</text>`);
    lastMonth = week.month;
  });

  const weekdayLabels = ["Mon", "", "Wed", "", "Fri", "", ""]
    .map((label, index) => label
      ? `<text x="${LEFT - 9}" y="${TOP + index * STEP + CELL - 1.5}" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="8" fill="#475569">${label}</text>`
      : "")
    .filter(Boolean)
    .join("\n");

  const cells = [];
  weeks.forEach((week, weekIndex) => {
    week.days.forEach((day, dayIndex) => {
      if (!day) return;
      const level = levelFor(day);
      const tooltip = `${day.date}: ${day.count} contribution${day.count === 1 ? "" : "s"}`;
      cells.push(`<rect x="${LEFT + weekIndex * STEP}" y="${TOP + dayIndex * STEP}" width="${CELL}" height="${CELL}" rx="2.5" fill="${LEVELS[level]}"><title>${escapeXml(tooltip)}</title></rect>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="heatmap-title heatmap-desc">
  <title id="heatmap-title">${escapeXml(username)} contribution activity: ${total} contributions ${period}</title>
  <desc id="heatmap-desc">A dark-themed calendar heatmap of public GitHub contributions, generated from the live GitHub contribution calendar.</desc>
  <defs>
    <linearGradient id="heatmap-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#030712"/>
      <stop offset="1" stop-color="#07101F"/>
    </linearGradient>
    <filter id="heatmap-glow" x="-20%" y="-200%" width="140%" height="500%">
      <feGaussianBlur stdDeviation="2.6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect x="0.75" y="0.75" width="${width - 1.5}" height="${height - 1.5}" rx="14" fill="url(#heatmap-bg)" stroke="#164E63"/>

  <circle cx="24" cy="25" r="3.2" fill="#22D3EE" filter="url(#heatmap-glow)">
    <animate attributeName="opacity" values="1;0.2;1" dur="2.8s" repeatCount="indefinite"/>
  </circle>
  <text x="36" y="29" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="10" letter-spacing="2" fill="#67E8F9">CONTRIBUTION ACTIVITY</text>
  <text x="${width - 18}" y="29" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="9.5" letter-spacing="0.6" fill="#475569">${total} contributions ${escapeXml(period)}</text>

${monthLabels.join("\n")}
${weekdayLabels}
${cells.join("\n")}

  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="8.5" letter-spacing="0.8" fill="#475569">
    <text x="${LEFT}" y="${height - 16}">LESS</text>
    ${LEVELS.map((color, index) => `<rect x="${LEFT + 34 + index * (CELL + 4)}" y="${height - 26}" width="${CELL}" height="${CELL}" rx="2.5" fill="${color}"/>`).join("\n    ")}
    <text x="${LEFT + 34 + LEVELS.length * (CELL + 4) + 2}" y="${height - 16}">MORE</text>
    <text x="${width - 18}" y="${height - 16}" text-anchor="end">github.com/${escapeXml(username)}</text>
  </g>
</svg>
`;
}

try {
  const config = await loadConfig();
  const username = API_USERNAME || config.profile.username;
  const response = await fetch(`${SOURCE}/${encodeURIComponent(username)}/contributions`, {
    headers: {
      Accept: "text/html",
      "User-Agent": `${username}-profile-heatmap`,
      "Accept-Language": "en-US,en;q=0.9"
    }
  });
  if (!response.ok) throw new Error(`GitHub contribution calendar returned ${response.status} ${response.statusText}.`);

  const contributions = parseContributions(await response.text());
  if (!contributions.length) throw new Error("Could not parse any contribution days from the GitHub calendar.");

  const total = contributions.reduce((sum, day) => sum + day.count, 0);
  const weeks = buildWeeks(contributions);
  const period = "in the last year";
  const svg = renderHeatmap({ contributions, total, weeks, username, period });
  await resolve(repositoryRoot, "assets");
  await writeFile(resolve(repositoryRoot, "assets/contributions.svg"), svg);
  console.log(`Generated assets/contributions.svg from ${contributions.length} days (${total} contributions).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
