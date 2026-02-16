import ky from "ky";
import PQueue from "p-queue";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

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
    readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"))
  );
  const expectedFiles = new Set(uniqueUrls.map((u: string) => basename(u)));

  const queue = new PQueue({ concurrency: 10 });
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  const downloads = uniqueUrls.map((url) =>
    queue.add(async () => {
      const filename = basename(url);
      const filepath = join(DOCS_DIR, filename);

      const content = await ky(url, { retry: { limit: 3 } }).text();

      let existing = "";
      if (existsSync(filepath)) {
        existing = readFileSync(filepath, "utf-8");
      }

      if (content === existing) {
        unchanged++;
      } else if (existingFiles.has(filename)) {
        writeFileSync(filepath, content);
        updated++;
      } else {
        writeFileSync(filepath, content);
        added++;
      }
    })
  );

  await Promise.all(downloads);

  // Remove orphaned files
  let removed = 0;
  for (const file of existingFiles) {
    if (!expectedFiles.has(file)) {
      unlinkSync(join(DOCS_DIR, file));
      removed++;
    }
  }

  console.log(
    `Done: ${added} added, ${updated} updated, ${removed} removed, ${unchanged} unchanged`
  );
}

main();
