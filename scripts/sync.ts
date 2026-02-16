import { mkdirSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import ky from "ky";

const LLMS_TXT_URL = "https://code.claude.com/docs/llms.txt";
const DOCS_DIR = join(import.meta.dirname, "..", "docs", "en");
const URL_PATTERN = /https:\/\/code\.claude\.com\/docs\/en\/[\w-]+\.md/g;
const client = ky.create({ retry: { limit: 3 } });

type SyncResult =
	| { status: "added" | "updated" | "unchanged"; filename: string }
	| { status: "skipped"; filename: string; reason: string };

async function fetchMarkdown(url: string): Promise<string | null> {
	const response = await client(url);
	const contentType = response.headers.get("content-type") ?? "";

	if (!contentType.includes("text/html")) return response.text();

	// HTML response (e.g. GitHub blob view) -- follow x-raw-download header
	const rawUrl = response.headers.get("x-raw-download");
	return rawUrl ? client(rawUrl).text() : null;
}

async function syncPage(
	url: string,
	existingFiles: ReadonlySet<string>,
): Promise<SyncResult> {
	const filename = basename(url);
	const filepath = join(DOCS_DIR, filename);
	const content = await fetchMarkdown(url);

	if (content === null) {
		return { status: "skipped", filename, reason: "HTML without raw URL" };
	}

	const file = Bun.file(filepath);
	const existing = (await file.exists()) ? await file.text() : "";

	if (content === existing) return { status: "unchanged", filename };

	await Bun.write(filepath, content);
	const status = existingFiles.has(filename) ? "updated" : "added";
	return { status, filename } as const;
}

async function main() {
	console.log("Fetching llms.txt manifest...");
	const manifest = await client(LLMS_TXT_URL).text();
	const urls = manifest.match(URL_PATTERN);

	if (!urls || urls.length === 0) {
		console.error("No markdown URLs found in llms.txt");
		process.exit(1);
	}

	const uniqueUrls = [...new Set(urls)];
	console.log(`Found ${uniqueUrls.length} pages`);

	mkdirSync(DOCS_DIR, { recursive: true });

	const existingFiles: ReadonlySet<string> = new Set(
		readdirSync(DOCS_DIR).filter((f: string) => f.endsWith(".md")),
	);
	const expectedFiles: ReadonlySet<string> = new Set(
		uniqueUrls.map((u: string) => basename(u)),
	);

	let done = 0;
	const total = uniqueUrls.length;

	const results = await Promise.all(
		uniqueUrls.map(async (url: string) => {
			const result = await syncPage(url, existingFiles);
			done++;
			const suffix =
				result.status === "skipped" ? ` (skipped: ${result.reason})` : "";
			process.stdout.write(
				`\r  [${done}/${total}] ${result.filename}${suffix}`,
			);
			return result;
		}),
	);
	process.stdout.write("\n");

	// Remove orphaned files
	const orphans = [...existingFiles].filter((f) => !expectedFiles.has(f));
	for (const file of orphans) {
		Bun.file(join(DOCS_DIR, file)).delete();
	}

	const count = (status: SyncResult["status"]) =>
		results.filter((r) => r.status === status).length;
	const skipped = results.filter((r) => r.status === "skipped");

	console.log(
		`Done: ${count("added")} added, ${count("updated")} updated, ${orphans.length} removed, ${count("unchanged")} unchanged, ${skipped.length} skipped`,
	);
	if (skipped.length > 0) {
		console.log(`Skipped: ${skipped.map((r) => r.filename).join(", ")}`);
	}
}

main();
