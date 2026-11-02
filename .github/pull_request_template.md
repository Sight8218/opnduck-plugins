## Plugin

- Name / id:
- Repo (public GitHub):
- Version:
- Commit (full 40-character hash):

## Checklist

- [ ] `plugin.json` in the repo matches the entry (id, version, permissions)
- [ ] `sha256` is the hash of the uncompressed tar: `curl -L https://codeload.github.com/<owner>/<name>/tar.gz/<commit> | gunzip | sha256sum`
- [ ] The plugin asks only for permissions it uses
- [ ] The repo has a licence and a README
- [ ] I left `"verified"` as `false` (the maintainer sets it after review)

What does the plugin do, and why does it need each permission?
