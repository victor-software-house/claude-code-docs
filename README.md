# Claude Code Docs

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/victor-software-house/claude-code-docs)

Version-tracked mirror of [Claude Code documentation](https://code.claude.com/docs).
Updated daily via GitHub Actions.

## How it works

1. Fetches the page manifest from `llms.txt`
2. Downloads all markdown pages
3. Creates conventional commits per change type (`feat:`, `fix:`, `feat!:`)
4. Bumps semver, generates `CHANGELOG.md`, and tags the release

## Semver mapping

- **patch** (`fix:`): doc content updated
- **minor** (`feat:`): new page added
- **major** (`feat!:`): page removed

## Run locally

    mise run sync        # Download latest docs
    mise run check       # Lint and format check
    mise run release     # Commit changes + bump version
    mise run all         # Sync + release

## Roadmap

- [ ] Migrate to CLI structure with `citty` + `consola` (subcommands, progress bars, colored output)
- [ ] Show content diff summary in CI logs (lines changed per file)
- [ ] GitHub Releases with changelog body on each tag
