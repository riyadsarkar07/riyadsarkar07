#!/usr/bin/env node

import { execFile } from "node:child_process";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { loadConfig, repositoryRoot } from "./lib/config.mjs";

const execFileAsync = promisify(execFile);

const REQUIRED_ASSETS = [
  "assets/banner.svg",
  "assets/banner-mobile.svg",
  "assets/footer.svg",
  "assets/divider.svg",
  "assets/contributions.svg"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function validateJavaScript() {
  const scriptDirectory = resolve(repositoryRoot, "scripts");
  const libDirectory = resolve(scriptDirectory, "lib");
  const files = [
    ...(await readdir(scriptDirectory)).filter((file) => file.endsWith(".mjs")).map((file) => resolve(scriptDirectory, file)),
    ...(await readdir(libDirectory)).filter((file) => file.endsWith(".mjs")).map((file) => resolve(libDirectory, file))
  ];
  for (const file of files) await execFileAsync(process.execPath, ["--check", file]);
  return files.length;
}

async function validateAssets() {
  for (const asset of REQUIRED_ASSETS) {
    const assetPath = resolve(repositoryRoot, asset);
    await access(assetPath);
    const svg = await readFile(assetPath, "utf8");
    assert(svg.startsWith("<svg") && svg.trimEnd().endsWith("</svg>"), `${asset} is not a complete SVG document.`);
    assert(!svg.includes("${"), `${asset} contains an unresolved template expression.`);
    assert(!/wildan|octocat|agent console/i.test(svg), `${asset} still references the original template owner.`);
  }
  return REQUIRED_ASSETS.length;
}

async function validateReadme(config) {
  const readme = await readFile(resolve(repositoryRoot, "README.md"), "utf8");

  assert(readme.includes("Hi, I'm Riyad Sarkar"), "README.md is missing the personalized greeting.");
  assert(readme.includes(config.profile.username), "README.md does not reference the configured GitHub username.");
  assert(!/wildan|wildanniam|octocat|Agent Console/i.test(readme), "README.md still references the original template owner.");

  for (const asset of REQUIRED_ASSETS) {
    assert(readme.includes(`./${asset}`), `README.md does not reference ${asset}.`);
  }

  const referenced = readme.match(/https?:\/\/[^\s")<]+/g) || [];
  const badScheme = referenced.filter((url) => /(?:^|\/\/)(?:localhost|127\.0\.0\.1|example\.com)/i.test(url));
  assert(badScheme.length === 0, `README.md contains placeholder or local URLs: ${badScheme.join(", ")}`);

  for (const project of config.projects) {
    assert(readme.includes(project.url), `README.md is missing project URL ${project.url}.`);
  }
  for (const link of config.links) {
    assert(readme.includes(link.url), `README.md is missing social link ${link.url}.`);
  }

  assert((readme.match(/<img/g) || []).length > 0, "README.md should contain images.");
  const images = readme.match(/<img\b[^>]*>/g) || [];
  const missingAlt = images.filter((tag) => !/\balt="[^"]+"/.test(tag));
  assert(missingAlt.length === 0, `README.md has ${missingAlt.length} image(s) without alt text.`);

  return readme.split("\n").length;
}

try {
  const config = await loadConfig();
  const scriptCount = await validateJavaScript();
  const assetCount = await validateAssets();
  const lineCount = await validateReadme(config);
  console.log(`Validated ${scriptCount} JavaScript modules, ${assetCount} local SVG assets, and a ${lineCount}-line README.md.`);
} catch (error) {
  console.error(`Validation failed: ${error.message}`);
  process.exitCode = 1;
}
