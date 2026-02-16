import { basename, join } from "node:path";

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
	// Get insertions/deletions for a modified file
	const stat = run(["git", "diff", "--numstat", "--", filepath]);
	if (!stat) return "";
	const parts = stat.split("\t");
	const ins = parts[0];
	const del = parts[1];
	return `(+${ins} -${del})`;
}

function getChanges() {
	const output = run(["git", "status", "--porcelain", "--", "docs/"]);
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
	for (const f of deleted) run(["git", "add", "--", `docs/en/${f}`]);
	const label = deleted.length === 1 ? deleted[0] : `${deleted.length} pages`;
	const body = deleted.map((f) => `- ${f}`).join("\n");
	run([
		"git",
		"commit",
		"-m",
		`feat!: remove ${label}`,
		"-m",
		`BREAKING CHANGE: documentation pages removed\n\n${body}`,
	]);
	console.log(`Committed ${deleted.length} deleted`);
}

if (added.length > 0) {
	for (const f of added) run(["git", "add", "--", `docs/en/${f}`]);
	const label = added.length === 1 ? added[0] : `${added.length} new pages`;
	const body = added.map((f) => `- ${f}`).join("\n");
	run(["git", "commit", "-m", `feat: add ${label}`, "-m", body]);
	console.log(`Committed ${added.length} added`);
}

if (modified.length > 0) {
	for (const f of modified) run(["git", "add", "--", `docs/en/${f}`]);
	const label =
		modified.length === 1 ? modified[0] : `${modified.length} pages`;
	const body = modified
		.map((f) => `- ${f} ${diffStat(`docs/en/${f}`)}`)
		.join("\n");
	run(["git", "commit", "-m", `fix: update ${label}`, "-m", body]);
	console.log(`Committed ${modified.length} modified`);
}
