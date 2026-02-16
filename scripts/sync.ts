import { mkdirSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import ky from "ky";

const LLMS_TXT_URL = "https://code.claude.com/docs/llms.txt";
const DOCS_DIR = join(import.meta.dirname, "..", "docs", "en");
const URL_PATTERN = /https:\/\/code\.claude\.com\/docs\/en\/[\w-]+\.md/g;

async function main() {
	console.log("Fetching llms.txt manifest...");
	const manifest = await ky(LLMS_TXT_URL, { retry: { limit: 3 } }).text();
	const urls = manifest.match(URL_PATTERN);

	if (!urls || urls.length === 0) {
		console.error("No markdown URLs found in llms.txt");
		process.exit(1);
	}

	const uniqueUrls = [...new Set(urls)];
	console.log(`Found ${uniqueUrls.length} pages`);

	mkdirSync(DOCS_DIR, { recursive: true });

	const existingFiles = new Set(
		readdirSync(DOCS_DIR).filter((f: string) => f.endsWith(".md")),
	);
	const expectedFiles = new Set(uniqueUrls.map((u: string) => basename(u)));

	let added = 0;
	let updated = 0;
	let unchanged = 0;
	const skipped: string[] = [];
	let done = 0;
	const total = uniqueUrls.length;

	const downloads = uniqueUrls.map(async (url: string) => {
		const filename = basename(url);
		const filepath = join(DOCS_DIR, filename);

		let content: string;
		const response = await ky(url, { retry: { limit: 3 } });
		const contentType = response.headers.get("content-type") ?? "";

		if (contentType.includes("text/html")) {
			// Some URLs return HTML (GitHub blob view) instead of raw markdown.
			// Follow the x-raw-download header to get the actual content.
			const rawUrl = response.headers.get("x-raw-download");
			if (rawUrl) {
				content = await ky(rawUrl, { retry: { limit: 3 } }).text();
			} else {
				skipped.push(filename);
				done++;
				process.stdout.write(
					`\r  [${done}/${total}] ${filename} (skipped: HTML, no raw URL)`,
				);
				return;
			}
		} else {
			content = await response.text();
		}

		const file = Bun.file(filepath);
		const existing = (await file.exists()) ? await file.text() : "";

		if (content === existing) {
			unchanged++;
		} else {
			await Bun.write(filepath, content);
			if (existingFiles.has(filename)) {
				updated++;
			} else {
				added++;
			}
		}

		done++;
		process.stdout.write(`\r  [${done}/${total}] ${filename}`);
	});

	await Promise.all(downloads);
	process.stdout.write("\n");

	// Remove orphaned files
	let removed = 0;
	for (const file of existingFiles) {
		if (!expectedFiles.has(file)) {
			Bun.file(join(DOCS_DIR, file)).delete();
			removed++;
		}
	}

	console.log(
		`Done: ${added} added, ${updated} updated, ${removed} removed, ${unchanged} unchanged, ${skipped.length} skipped`,
	);
	if (skipped.length > 0) {
		console.log(`Skipped (not markdown): ${skipped.join(", ")}`);
	}
}

main();
