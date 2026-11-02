# How a plugin becomes Verified

A plugin is **Verified** when the maintainer has read the code at the pinned commit and set
`"verified": true` in the merge. Everything else is listed as Community (unverified): OPNduck warns
before install and the plugin runs with the permissions the user approves.

A review is a person reading the code, not a guarantee. A plugin can still have bugs.

## Checklist

1. The pinned commit is the code in the PR; `scripts/validate-index.mjs` passes (hash, manifest, no links).
2. Every permission asked for is used, and the README says why.
   - `exec:any`, `network` to wide host lists and `files:write` get extra attention.
3. The backend and the card do nothing beyond what the description says:
   - no obfuscated or minified-only code, no `eval`/`new Function` on fetched text;
   - cards run in a sandboxed frame with no network, but still look for attempts to break out of it
     (odd `postMessage` use, `eval`, navigating the frame);
   - no data sent to hosts that are not in `network`, and nothing sent that the user did not choose.
4. No dependencies pulled in at run time; anything bundled is readable or comes with its source.
5. The repo has a licence, and the author is reachable (issues enabled).
6. An update gets the same review for the diff since the last verified commit. A new permission means a
   full review.

## Taking a plugin down

Remove its entry from `index.json`. Installed copies keep running until the user removes them, so a
serious problem should also be announced in the OPNduck release notes.
