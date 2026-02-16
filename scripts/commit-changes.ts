import { execSync } from "node:child_process";
import { basename } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function run(cmd: string): string {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8" }).trim();
}

function getChanges() {
  const output = run("git status --porcelain -- docs/");
  if (!output) return { added: [], modified: [], deleted: [] };

  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  for (const line of output.split("\n")) {
    const status = line.substring(0, 2).trim();
    const filepath = line.substring(3);
    const filename = basename(filepath);

    if (status === "??" || status === "A") added.push(filename);
    else if (status === "M") modified.push(filename);
    else if (status === "D") deleted.push(filename);
  }

  return { added, modified, deleted };
}

const { added, modified, deleted } = getChanges();

if (added.length === 0 && modified.length === 0 && deleted.length === 0) {
  console.log("No doc changes to commit");
  process.exit(0);
}

// Stage and commit each change type separately so commit-and-tag-version
// can derive the correct semver bump and changelog sections.

if (deleted.length > 0) {
  for (const f of deleted) run(`git add -- docs/en/${f}`);
  const body = deleted.map((f) => `- ${f}`).join("\n");
  const count = deleted.length === 1 ? deleted[0] : `${deleted.length} pages`;
  run(`git commit -m "feat!: remove ${count}" -m "${body}"`);
  console.log(`Committed ${deleted.length} deleted`);
}

if (added.length > 0) {
  for (const f of added) run(`git add -- docs/en/${f}`);
  const body = added.map((f) => `- ${f}`).join("\n");
  const count = added.length === 1 ? added[0] : `${added.length} pages`;
  run(`git commit -m "feat: add ${count}" -m "${body}"`);
  console.log(`Committed ${added.length} added`);
}

if (modified.length > 0) {
  for (const f of modified) run(`git add -- docs/en/${f}`);
  const body = modified.map((f) => `- ${f}`).join("\n");
  const count = modified.length === 1 ? modified[0] : `${modified.length} pages`;
  run(`git commit -m "fix: update ${count}" -m "${body}"`);
  console.log(`Committed ${modified.length} modified`);
}
