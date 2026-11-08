import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
export const defaultConfigPath = resolve(repositoryRoot, "profile.config.json");

export function readFlag(name, args = process.argv.slice(2)) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function assert(condition, message) {
  if (!condition) throw new Error(`Invalid profile.config.json: ${message}`);
}

function assertText(value, label, maximum) {
  assert(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string.`);
  assert(value.length <= maximum, `${label} must be ${maximum} characters or fewer.`);
}

function assertUrl(value, label, { allowEmpty = false } = {}) {
  if (allowEmpty && value === "") return;
  try {
    const url = new URL(value);
    assert(["http:", "https:"].includes(url.protocol), `${label} must use http or https.`);
  } catch {
    throw new Error(`Invalid profile.config.json: ${label} must be a valid URL.`);
  }
}

function assertArray(value, label, minimum, maximum) {
  assert(Array.isArray(value) && value.length >= minimum && value.length <= maximum, `${label} must contain ${minimum} to ${maximum} items.`);
}

function assertLabeledItems(items, label) {
  items.forEach((item, index) => {
    assertText(item?.label, `${label}[${index}].label`, 40);
    assertText(item?.value ?? item?.description, `${label}[${index}].value`, 200);
  });
}

export function validateConfig(config) {
  assert(config && typeof config === "object" && !Array.isArray(config), "the root must be an object.");

  const profile = config.profile;
  assert(profile && typeof profile === "object", "profile is required.");
  assertText(profile.name, "profile.name", 40);
  assertText(profile.username, "profile.username", 39);
  assert(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(profile.username), "profile.username is not a valid GitHub username.");
  assertText(profile.headline, "profile.headline", 60);
  assertArray(profile.about, "profile.about", 1, 3);
  profile.about.forEach((paragraph, index) => assertText(paragraph, `profile.about[${index}]`, 360));

  assertArray(config.identity, "identity", 1, 6);
  assertLabeledItems(config.identity, "identity");

  for (const section of ["securityInterests", "aiInterests"]) {
    assertArray(config[section], section, 1, 8);
    config[section].forEach((item, index) => {
      assertText(item?.name, `${section}[${index}].name`, 40);
      assertText(item?.description, `${section}[${index}].description`, 200);
    });
  }

  assertArray(config.techIcons, "techIcons", 1, 24);
  config.techIcons.forEach((icon, index) => assertText(icon, `techIcons[${index}]`, 30));

  assertArray(config.skillGroups, "skillGroups", 1, 8);
  config.skillGroups.forEach((group, index) => {
    assertText(group?.name, `skillGroups[${index}].name`, 40);
    assertArray(group?.items, `skillGroups[${index}].items`, 1, 12);
    group.items.forEach((item, itemIndex) => {
      assertText(item?.label, `skillGroups[${index}].items[${itemIndex}].label`, 40);
      assertText(item?.logo, `skillGroups[${index}].items[${itemIndex}].logo`, 40);
    });
  });

  assertArray(config.toolGroups, "toolGroups", 1, 6);
  config.toolGroups.forEach((group, index) => {
    assertText(group?.name, `toolGroups[${index}].name`, 40);
    assertArray(group?.items, `toolGroups[${index}].items`, 1, 12);
    group.items.forEach((item, itemIndex) => assertText(item, `toolGroups[${index}].items[${itemIndex}]`, 40));
  });

  assertArray(config.projects, "projects", 1, 6);
  config.projects.forEach((project, index) => {
    assertText(project?.name, `projects[${index}].name`, 40);
    assertUrl(project?.url, `projects[${index}].url`);
    assertUrl(project?.homepage ?? "", `projects[${index}].homepage`, { allowEmpty: true });
    assertText(project?.stack, `projects[${index}].stack`, 160);
    assertText(project?.summary, `projects[${index}].summary`, 260);
  });

  assertArray(config.links, "links", 1, 4);
  config.links.forEach((link, index) => {
    assertText(link?.label, `links[${index}].label`, 20);
    assertText(link?.value, `links[${index}].value`, 40);
    assertUrl(link?.url, `links[${index}].url`);
    assert(typeof link?.logo === "string" && link.logo.length <= 30, `links[${index}].logo must be 30 characters or fewer.`);
    assert(/^[A-Fa-f0-9]{6}$/.test(link?.color), `links[${index}].color must be a six-character hex value without #.`);
  });

  assertText(config.footer, "footer", 140);

  return config;
}

export async function loadConfig(configPath = defaultConfigPath) {
  const resolvedPath = resolve(configPath);
  let raw;

  try {
    raw = await readFile(resolvedPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`Configuration file not found: ${resolvedPath}`);
    throw error;
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Could not parse ${resolvedPath}: ${error.message}`);
  }

  return validateConfig(config);
}
