# Assessments module

AI-driven asset inspections and problem reports.

## Structure

- **actions.ts** – `createWithAI` – public action (no auth required)
- **queries.ts** – `listByAsset` – public query
- **internal_mutations.ts** – `createPlaceholder`, `finalizeWithAI`
- **internal_queries.ts** – `loadContext`, `getAssetRisk`
- **helpers.ts** – shared validators (e.g. `assessmentDocValidator`)

## API paths

- `api.assessments.actions.createWithAI`
- `api.assessments.queries.listByAsset`

## storage.ts

`storage.ts` stays at the convex root. It provides:

- `api.storage.generateUploadUrl` – used by assessments and maintenance records
- `internal.storage.getImageUrls` – used by the assessment AI pipeline

Storage is a cross-cutting facility, not assessment-specific.
