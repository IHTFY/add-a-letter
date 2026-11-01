# Security notes

Security stage: public.

## Accepted audit advisories

| Advisory                  | Package                                                 | Why it is accepted                                                                                                                                                      | Recheck                                                                                |
| ------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| GHSA-gcqx-w48m-w2h4 (low) | deepmerge 4.3.1, reached through the Svelte Vite plugin | No patched version exists. Build-time tool only; it is not in the built site players load. Ignored by this one ID in `pnpm-workspace.yaml` (`auditConfig.ignoreGhsas`). | When a patched deepmerge, or a plugin release that drops it, ships: remove the ignore. |

## Overrides

- `minimatch` is forced to 11.0.1 or later in `pnpm-workspace.yaml` to clear GHSA-g3hv-75wg-m249. It is reached only through eslint (build-time). Remove the override once eslint depends on a patched minimatch itself.
