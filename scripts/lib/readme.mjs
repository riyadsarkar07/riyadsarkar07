import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BADGE = "https://img.shields.io/badge";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeBadgeText(value) {
  return String(value).replaceAll("-", "--").replaceAll("_", "__").replaceAll(" ", "_");
}

function badge({ label, value, color = "0B1220", logo = "", logoColor = "22D3EE" }) {
  const safeLabel = escapeBadgeText(label);
  const hasValue = typeof value === "string" && value.trim().length > 0;
  const path = hasValue ? `${safeLabel}-${escapeBadgeText(value)}-${color}` : `${safeLabel}--${color}`;
  const logoPart = logo ? `&logo=${encodeURIComponent(logo)}&logoColor=${logoColor}` : "";
  return `${BADGE}/${path}?style=for-the-badge${logoPart}`;
}

function linkBadge(link) {
  return `  <a href="${link.url}"><img alt="${link.label}: ${link.value}" src="${badge({
    label: link.label,
    value: link.value,
    color: link.color,
    logo: link.logo,
    logoColor: "22D3EE"
  })}"></a>`;
}

function chip(src, label, height) {
  return `<img alt="${label}" src="${src}" height="${height}">`;
}

function skillBadges(items) {
  return items
    .map((item) => chip(badge({ label: item.label, logo: item.logo, logoColor: "22D3EE" }), item.label, 34))
    .join(" ");
}

function renderSkillGroups(groups) {
  return groups
    .map((group) => [
      `<p align="center"><sub><strong>${escapeHtml(group.name)}</strong></sub></p>`,
      `<p align="center">${skillBadges(group.items)}</p>`
    ].join("\n\n"))
    .join("\n\n");
}

function renderInterests(items) {
  return [
    "| Area | How I approach it |",
    "| --- | --- |",
    ...items.map((item) => `| **${item.name}** | ${item.description} |`)
  ].join("\n");
}

function renderProjects(projects) {
  const rows = projects.map((project) => {
    const live = project.homepage ? ` &#183; [**Live**](${project.homepage})` : "";
    return [
      `### [${project.name}](${project.url})`,
      "",
      project.summary,
      "",
      `\`${project.stack}\`${live}`
    ].join("\n");
  });
  return rows.join("\n\n");
}

function renderIdentity(identity) {
  return [
    "| Field | Detail |",
    "| --- | --- |",
    ...identity.map((row) => `| **${escapeHtml(row.label)}** | ${escapeHtml(row.value)} |`)
  ].join("\n");
}

function renderToolGroups(groups) {
  return groups
    .map((group) => [
      `<p align="center"><sub><strong>${escapeHtml(group.name)}</strong></sub></p>`,
      `<p align="center">${group.items.map((item) => `<code>${escapeHtml(item)}</code>`).join(" &#183; ")}</p>`
    ].join("\n\n"))
    .join("\n\n");
}

export function generateProfileReadmeMarkdown(config) {
  const name = config.profile.name;
  const username = config.profile.username;
  const techIcons = config.techIcons.join(",");
  const links = config.links.map(linkBadge).join("\n");
  const about = config.profile.about.join("\n\n");

  return `<!--
  Riyad Sarkar - GitHub Profile
  Generated from profile.config.json. Edit the config, then run: npm run generate
-->

<p align="center">
  <picture>
    <source media="(max-width: 760px)" srcset="./assets/banner-mobile.svg">
    <img src="./assets/banner.svg" alt="Riyad Sarkar - Cybersecurity Expert and AI Expert. Security research, applied AI and automation." width="100%">
  </picture>
</p>

<p align="center">
  <img alt="Animated typing line: Cybersecurity Expert, AI Expert, Security Researcher, Exploring the Future of AI and Cybersecurity" src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&amp;weight=600&amp;size=22&amp;pause=1200&amp;color=22D3EE&amp;center=true&amp;vCenter=true&amp;width=680&amp;lines=Cybersecurity+Expert;AI+Expert;Security+Researcher;Exploring+the+Future+of+AI+%26+Cybersecurity" width="680">
</p>

<h1 align="center">Hi, I'm Riyad Sarkar</h1>

<p align="center">
  <img alt="Cybersecurity Expert" src="${badge({ label: "Cybersecurity", value: "Expert", logo: "shield" })}">
  <img alt="AI Expert" src="${badge({ label: "AI", value: "Expert", logo: "openai", logoColor: "67E8F9" })}">
  <img alt="Security Researcher" src="${badge({ label: "Security", value: "Researcher", logo: "linux" })}">
  <img alt="AI Systems Builder" src="${badge({ label: "AI_Systems", value: "Builder", logo: "probot", logoColor: "38BDF8" })}">
</p>

<p align="center">
${links}
</p>

<p align="center">
  <img alt="Profile views" src="https://komarev.com/ghpvc/?username=${username}&amp;label=PROFILE+VIEWS&amp;style=for-the-badge&amp;color=155E75">
</p>

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## About Me

${about}

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## Professional Identity

${renderIdentity(config.identity)}

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## Cybersecurity Interests

${renderInterests(config.securityInterests)}

## Artificial Intelligence Interests

${renderInterests(config.aiInterests)}

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## Technical Skills &amp; Technologies

<p align="center">
  <img alt="TypeScript, JavaScript, Python, React, Next.js, Node.js, Tailwind CSS, Supabase, Firebase, Git, GitHub, Linux, Vercel, HTML and CSS" src="https://skillicons.dev/icons?i=${techIcons}&amp;theme=dark&amp;perline=8">
</p>

${renderSkillGroups(config.skillGroups)}

## Tools &amp; Technologies

${renderToolGroups(config.toolGroups)}

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## Featured GitHub Projects

${renderProjects(config.projects)}

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## GitHub Statistics

<p align="center">
  <img alt="GitHub statistics: total stars, commits, pull requests and issues" src="https://github-profile-summary-cards.vercel.app/api/cards/stats?username=${username}&amp;theme=tokyonight" height="180">
  <img alt="Top languages by repository" src="https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=${username}&amp;theme=tokyonight" height="180">
</p>

<p align="center">
  <img alt="GitHub contribution streak" src="https://streak-stats.demolab.com?user=${username}&amp;theme=tokyonight&amp;hide_border=true&amp;background=0B1220&amp;ring=22D3EE&amp;fire=38BDF8&amp;currStreakLabel=22D3EE" width="520">
</p>

## Contribution Activity

<p align="center">
  <img alt="Riyad Sarkar contribution heatmap for the last year" src="./assets/contributions.svg" width="100%">
</p>

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## Connect With Me

<p align="center">
${links}
</p>

<p align="center">
  Open to conversations about security research, applied AI, and automation.
</p>

<p align="center">
  <img alt="Section divider" src="./assets/divider.svg" width="100%">
</p>

## Build Secure Systems. Explore Intelligent Ones.

<p align="center">
  <img alt="Build secure systems. Explore intelligent ones. Cybersecurity and artificial intelligence." src="./assets/footer.svg" width="100%">
</p>

<p align="center">
  <sub>${config.footer} &#183; <a href="https://github.com/${username}">github.com/${username}</a></sub>
</p>
`;
}

export async function generateProfileReadme({ config, readmePath }) {
  const readme = generateProfileReadmeMarkdown(config);
  await writeFile(resolve(readmePath), readme);
  return readme;
}
