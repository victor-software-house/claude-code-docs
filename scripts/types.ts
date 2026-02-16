export type SyncResult =
	| { status: "added" | "updated" | "unchanged"; filename: string }
	| { status: "skipped"; filename: string; reason: string };

export type SyncSummary = {
	readonly total: number;
	readonly added: readonly string[];
	readonly updated: readonly string[];
	readonly removed: readonly string[];
	readonly unchanged: number;
	readonly skipped: readonly { filename: string; reason: string }[];
	readonly hasChanges: boolean;
};

export type CommitSummary = {
	readonly added: readonly string[];
	readonly modified: readonly { filename: string; stat: string }[];
	readonly deleted: readonly string[];
	readonly hasChanges: boolean;
};
