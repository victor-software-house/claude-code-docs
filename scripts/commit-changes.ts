import { basename, join } from "node:path";
import { render, writeSummary } from "./render.ts";
import type { CommitSummary } from "./types.ts";

const ROOT = join(import.meta.dirname, "..");

function run(cmd: string[]): string {
	const result = Bun.spawnSync(cmd, { cwd: ROOT });
	if (!result.success) {
		throw new Error(
			`Command failed: ${cmd.join(" ")}\n${result.stderr.toString()}`,
		);
	}
	return result.stdout.toString().trim();
}

function diffStat(filepath: string): string {
	const stat = run(["git", "diff", "--numstat", "--", filepath]);
	if (!stat) return "";
	const parts = stat.split("\t");
	return `(+${parts[0]} -${parts[1]})`;
}

function getChanges(): CommitSummary {
	const output = run(["git", "status", "--porcelain", "--", "docs/"]);
	if (!output) {
		return { added: [], modified: [], deleted: [], hasChanges: false };
	}

	const added: string[] = [];
	const modified: { filename: string; stat: string }[] = [];
	const deleted: string[] = [];

	for (const line of output.split("\n")) {
		const status = line.substring(0, 2).trim();
		const filepath = line.substring(3);
		const filename = basename(filepath);

		if (status === "??" || status === "A") added.push(filename);
		else if (status === "M")
			modified.push({ filename, stat: diffStat(`docs/en/${filename}`) });
		else if (status === "D") deleted.push(filename);
	}

	return {
		added,
		modified,
		deleted,
		hasChanges: added.length > 0 || modified.length > 0 || deleted.length > 0,
	};
}

const summary = getChanges();

const markdown = render("commit-summary", summary);
writeSummary(markdown);

if (!summary.hasChanges) {
	console.log("No doc changes to commit");
	process.exit(2);
}

// Stage and commit each change type separately so commit-and-tag-version
// can derive the correct semver bump and changelog sections.

if (summary.deleted.length > 0) {
	for (const f of summary.deleted) run(["git", "add", "--", `docs/en/${f}`]);
	const label =
		summary.deleted.length === 1
			? summary.deleted[0]
			: `${summary.deleted.length} pages`;
	const body = summary.deleted.map((f) => `- ${f}`).join("\n");
	run([
		"git",
		"commit",
		"-m",
		`feat!: remove ${label}`,
		"-m",
		`BREAKING CHANGE: documentation pages removed\n\n${body}`,
	]);
	console.log(`Committed ${summary.deleted.length} deleted`);
}

if (summary.added.length > 0) {
	for (const f of summary.added) run(["git", "add", "--", `docs/en/${f}`]);
	const label =
		summary.added.length === 1
			? summary.added[0]
			: `${summary.added.length} new pages`;
	const body = summary.added.map((f) => `- ${f}`).join("\n");
	run(["git", "commit", "-m", `feat: add ${label}`, "-m", body]);
	console.log(`Committed ${summary.added.length} added`);
}

if (summary.modified.length > 0) {
	for (const m of summary.modified)
		run(["git", "add", "--", `docs/en/${m.filename}`]);
	const first = summary.modified[0];
	const label =
		summary.modified.length === 1 && first
			? first.filename
			: `${summary.modified.length} pages`;
	const body = summary.modified
		.map((m) => `- ${m.filename} ${m.stat}`)
		.join("\n");
	run(["git", "commit", "-m", `fix: update ${label}`, "-m", body]);
	console.log(`Committed ${summary.modified.length} modified`);
}
