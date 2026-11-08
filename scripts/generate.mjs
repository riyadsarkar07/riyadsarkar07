#!/usr/bin/env node

import { resolve } from "node:path";
import { loadConfig, readFlag, repositoryRoot } from "./lib/config.mjs";
import { generateProfileReadme } from "./lib/readme.mjs";

try {
  const config = await loadConfig(readFlag("--config"));
  const readmePath = resolve(repositoryRoot, "README.md");
  const readme = await generateProfileReadme({ config, readmePath });
  console.log(`Profile README generated from profile.config.json (${readme.split("\n").length} lines).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
