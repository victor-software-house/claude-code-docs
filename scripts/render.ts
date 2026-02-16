import { join } from "node:path";
import { Eta } from "eta";

const TEMPLATES_DIR = join(import.meta.dirname, "..", "templates");
const eta = new Eta({ views: TEMPLATES_DIR, autoTrim: false });

export function render(
	template: string,
	data: Record<string, unknown>,
): string {
	return eta.render(template, data);
}

export function writeSummary(markdown: string): void {
	const summaryPath = process.env.GITHUB_STEP_SUMMARY;
	if (!summaryPath) return;
	Bun.write(summaryPath, markdown);
}
