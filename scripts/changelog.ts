import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const VERSION_FILE = join(ROOT, "VERSION");
const CHANGELOG_FILE = join(ROOT, "CHANGELOG.md");

function getChangedFiles(): { added: string[]; modified: string[]; deleted: string[] } {
  let output: string;
  try {
    output = execSync("git diff --name-status HEAD -- docs/", {
      cwd: ROOT,
      encoding: "utf-8",
    });
  } catch {
    // If HEAD doesn't exist (first commit), treat all docs as added
    output = execSync("git status --porcelain -- docs/", {
      cwd: ROOT,
      encoding: "utf-8",
    });
    // Convert porcelain format (?? docs/en/file.md) to name-status format
    return {
      added: output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => basename(line.trim().replace(/^[?AM]+\s+/, ""))),
      modified: [],
      deleted: [],
    };
  }

  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  for (const line of output.trim().split("\n")) {
    if (!line) continue;
    const parts = line.split("\t");
    const status = parts[0];
    const filepath = parts[1];
    if (!status || !filepath) continue;
    const filename = basename(filepath);
    if (status === "A") added.push(filename);
    else if (status === "M") modified.push(filename);
    else if (status === "D") deleted.push(filename);
  }

  return { added, modified, deleted };
}

function bumpVersion(): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;

  const currentVersion = readFileSync(VERSION_FILE, "utf-8").trim();

  let newVersion: string;
  if (currentVersion === dateStr) {
    newVersion = `${dateStr}.2`;
  } else if (currentVersion.startsWith(`${dateStr}.`)) {
    const suffix = parseInt(currentVersion.split(".").pop()!, 10);
    newVersion = `${dateStr}.${suffix + 1}`;
  } else {
    newVersion = dateStr;
  }

  writeFileSync(VERSION_FILE, newVersion + "\n");
  return newVersion;
}

function main() {
  const { added, modified, deleted } = getChangedFiles();
  const totalChanges = added.length + modified.length + deleted.length;

  if (totalChanges === 0) {
    console.log("No changes detected, skipping changelog update");
    return;
  }

  const version = bumpVersion();
  console.log(`Version bumped to ${version}`);

  const sections: string[] = [];

  if (added.length > 0) {
    sections.push("### Added\n" + added.map((f) => `- \`${f}\``).join("\n"));
  }
  if (modified.length > 0) {
    sections.push("### Modified\n" + modified.map((f) => `- \`${f}\``).join("\n"));
  }
  if (deleted.length > 0) {
    sections.push("### Removed\n" + deleted.map((f) => `- \`${f}\``).join("\n"));
  }

  const entry = `## ${version}\n\n${sections.join("\n\n")}`;

  const changelog = readFileSync(CHANGELOG_FILE, "utf-8");
  const insertPos = changelog.indexOf("\n");
  const newChangelog =
    changelog.slice(0, insertPos) + "\n\n" + entry + changelog.slice(insertPos);

  writeFileSync(CHANGELOG_FILE, newChangelog);
  console.log(
    `Changelog updated: ${added.length} added, ${modified.length} modified, ${deleted.length} removed`
  );
}

main();
