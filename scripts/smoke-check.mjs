import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "dist/public/index.html",
  "dist/public/assets",
  "dist/index.js",
  "client/src/data/stream-health.json",
];

for (const relative of requiredFiles) {
  if (!existsSync(resolve(root, relative))) {
    throw new Error(`Required release artifact is missing: ${relative}`);
  }
}

const health = JSON.parse(readFileSync(resolve(root, "client/src/data/stream-health.json"), "utf8"));
if (!health || !Array.isArray(health.results)) throw new Error("stream-health.json must contain a results array");
if (!health.results.length) throw new Error("stream-health.json results cannot be empty");
if (!health.summary || health.summary.total_unique !== health.results.length) {
  throw new Error("stream-health summary does not match the result count");
}

const invalid = health.results.filter((item) => !item || typeof item.url !== "string" || !/^https?:\/\//.test(item.url));
if (invalid.length) throw new Error(`${invalid.length} stream health records have invalid URLs`);

const urls = new Set(health.results.map((item) => item.url));
if (urls.size !== health.results.length) throw new Error("stream-health.json contains duplicate URLs");

const indexHtml = readFileSync(resolve(root, "dist/public/index.html"), "utf8");
if (!indexHtml.includes("NOVA PLAY")) throw new Error("Production HTML is missing NOVA PLAY title");

console.log(`Smoke check passed: ${health.results.length} unique stream records and production artifacts are present.`);
