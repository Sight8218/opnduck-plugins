# OPNduck plugins

The plugin index for [OPNduck](https://github.com/Sight8218/OPNduck). OPNduck's **Plugins → Store** tab
reads `index.json` from this repository.

- **Verified**: the maintainer reviewed that exact commit ([REVIEW.md](REVIEW.md)).
- **Community (unverified)**: listed after the automatic checks only. OPNduck shows a warning before install.

Plugins run code on the user's computer. Permissions limit what a well-behaved plugin can ask OPNduck
to do; they are not a sandbox. Read the code first.

## Add your plugin

1. Write it: see [PLUGINS.md](https://github.com/Sight8218/OPNduck/blob/main/PLUGINS.md). Push it to a public GitHub repo with `plugin.json` at the top (or in a folder, set `subdir`).
2. Pick a commit and compute the hash of its uncompressed tar:
   ```
   curl -L https://codeload.github.com/<owner>/<name>/tar.gz/<commit> | gunzip | sha256sum
   ```
3. Open a pull request adding an entry to `index.json`:
   ```json
   {
     "id": "my-plugin",
     "name": "My Plugin",
     "version": "0.1.0",
     "author": "You",
     "description": "One or two sentences.",
     "repo": "https://github.com/you/my-plugin",
     "commit": "<40-character commit>",
     "sha256": "<hash from step 2>",
     "permissions": ["jobs", "files:read"],
     "network": [],
     "verified": false
   }
   ```
   `id`, `version` and `permissions` must match your `plugin.json`. Leave `verified` as `false`.
4. The `validate-index` check downloads the archive and tests the entry the same way OPNduck installs it.

To update a plugin, open a PR with a new `version`, `commit` and `sha256`.

## Licence

The index and scripts are GPL-3.0-or-later, like OPNduck. Listed plugins keep their own licences.
