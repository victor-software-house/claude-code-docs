# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 1.0.0 (2026-02-16)

Initial release: 57 documentation pages synced from [code.claude.com/docs](https://code.claude.com/docs).

### Tooling

- Automated daily sync via GitHub Actions (cron 06:00 UTC)
- Semver versioning with conventional commits (`commit-and-tag-version`)
- Commit linting with `commitlint` + `husky` (commit-msg hook)
- Biome for linting and formatting with pre-commit auto-fix
- Custom GritQL plugins enforcing Bun native APIs over Node.js equivalents
- `ky` for HTTP requests with retry/exponential backoff

### Pages

agent-teams, amazon-bedrock, analytics, authentication, best-practices,
changelog, checkpointing, chrome, claude-code-on-the-web, cli-reference,
common-workflows, costs, data-usage, desktop, desktop-quickstart, devcontainer,
discover-plugins, fast-mode, features-overview, github-actions, gitlab-ci-cd,
google-vertex-ai, headless, hooks, hooks-guide, how-claude-code-works,
interactive-mode, jetbrains, keybindings, legal-and-compliance, llm-gateway,
mcp, memory, microsoft-foundry, model-config, monitoring-usage, network-config,
output-styles, overview, permissions, plugin-marketplaces, plugins,
plugins-reference, quickstart, sandboxing, security, server-managed-settings,
settings, setup, skills, slack, statusline, sub-agents, terminal-config,
third-party-integrations, troubleshooting, vs-code
