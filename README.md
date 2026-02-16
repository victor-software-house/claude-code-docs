# Claude Code Docs

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/victor-software-house/claude-code-docs)

Version-tracked mirror of [Claude Code documentation](https://code.claude.com/docs).
Updated daily via GitHub Actions.

## How it works

1. Fetches the page manifest from `llms.txt`
2. Downloads all markdown pages
3. Commits changes with a dated version
4. Auto-generates `CHANGELOG.md` from diffs

## Run locally

    mise run sync        # Download latest docs
    mise run changelog   # Generate changelog from changes
    mise run all         # Both
