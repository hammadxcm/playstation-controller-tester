# Releasing

Deadzone is a static site with two deployment tracks:

| Track                     | Trigger                | What happens                                                                                                                                                                                                                             |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Continuous deployment** | every push to `main`   | [`deploy.yml`](.github/workflows/deploy.yml) runs the gate (typecheck, lint, 100 % coverage, build) and publishes `dist/` to GitHub Pages. `main` is always deployable.                                                                  |
| **Release**               | pushing a tag `vX.Y.Z` | [`release.yml`](.github/workflows/release.yml) checks the tag against `package.json` and `CHANGELOG.md`, runs the gate, builds, and creates a GitHub Release with that version's changelog section as notes and the built site attached. |

Pull requests and feature branches run [`ci.yml`](.github/workflows/ci.yml): the same gate plus a Prettier check, with the build uploaded as a downloadable artifact (GitHub Pages has no per-PR previews; open the artifact locally with `pnpm preview --outDir <folder>` or any static server).

## Branching

Trunk-based. Branch from `main`, open a pull request, squash or rebase-merge once CI is green. No long-lived release branches: a release is a tag on `main`.

`main` is protected by a repository ruleset: no deletion, no force pushes, linear history, changes arrive through a pull request with every review thread resolved and the `gate` check green on the latest commit. Merge commits are disabled (squash or rebase only) and merged branches are deleted. Repository admins can bypass the pull-request requirement, which is what the release step below relies on; everyone else goes through a pull request. Tags matching `v*` are immutable: they can be created but not moved or deleted.

## Versioning

[Semantic Versioning](https://semver.org/). For a site rather than a library, read it as:

- **major**: a change users must adapt to (a URL that stops working, a stored preference or learned layout that is dropped, a browser that stops being supported).
- **minor**: new screens, new controller support, new features, new languages.
- **patch**: fixes, copy, dependency bumps with no visible change.

The version lives in one place, `package.json`, and is shown in the app footer and on every GitHub Release.

## Cutting a release

1. Make sure `main` is green and you are on it with no local changes.
2. Move the `## [Unreleased]` entries in `CHANGELOG.md` under a new `## [X.Y.Z] - YYYY-MM-DD` heading (Keep a Changelog: Added, Changed, Deprecated, Removed, Fixed, Security). Add the compare link at the bottom.
3. Bump the version without tagging yet:
   ```sh
   pnpm version X.Y.Z --no-git-tag-version
   ```
4. Commit and tag:
   ```sh
   git commit -am "Release X.Y.Z"
   git tag -a vX.Y.Z -m "Deadzone X.Y.Z"
   git push origin main --follow-tags
   ```
5. The push to `main` deploys the site; the tag publishes the release. Both appear under **Actions**. Check the live site and the release page.

The release workflow refuses a tag whose version is not in `package.json` or has no changelog section, so a mismatch fails loudly instead of publishing wrong notes.

## Rolling back

- **Site:** revert the offending commit on `main` (`git revert <sha>`), push, and the deploy workflow republishes. For an emergency, run **Deploy to GitHub Pages** from the Actions tab with a previous tag as the ref.
- **Release:** delete the GitHub Release and tag (`gh release delete vX.Y.Z --cleanup-tag`), fix, and cut the next patch version. Never re-tag an existing version.

## Dependencies

Dependabot opens weekly grouped pull requests for npm dev dependencies and monthly ones for GitHub Actions. Every action is SHA-pinned with its version in a comment. pnpm's minimum-release-age policy refuses packages published in the last 24 hours, so a brand-new upstream release may need a day before it can be adopted.
