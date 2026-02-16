# Claude Code Docs

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/victor-software-house/claude-code-docs)

Version-tracked mirror of [Claude Code documentation](https://code.claude.com/docs).
Updated daily via GitHub Actions.

## How it works

1. Fetches the page manifest from `llms.txt`
2. Downloads all markdown pages
3. Creates conventional commits per change type (`feat:`, `fix:`, `feat!:`)
4. Bumps semver, generates `CHANGELOG.md`, and tags the release

## Run locally

    mise run sync        # Download latest docs
    mise run release     # Commit changes + bump version
    mise run all         # Both
