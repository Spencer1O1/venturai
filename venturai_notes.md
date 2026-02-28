VENTURAI

This is designed for Convex backend + React Native Inspector + React/Vite Dashboard and for NFC deep link https://venturai.app/a/<assetId>.

## Data model (Convex schema)

# orgs

- name: string
- createdAt: number

# maintenanceGroups

- orgId: Id<"orgs">
- name: string
- createdAt: number

# assessmentTemplates

- orgId: Id<"orgs">
- name: string
- photoDescriptions: string[]
  e.g. ["Wide shot of asset", "Close-up of suspected wear area"]
- additionalQuestions: { key: string; label: string; type: "text" | "number" | "boolean" }[]
- createdAt: number

# assets

- orgId: Id<"orgs">
- maintenanceGroupId: Id<"maintenanceGroups">
- templateId: Id<"assessmentTemplates"> (optional, but recommended)
- name: string
- type: string (e.g. "Diaphragm Pump")
- locationText?: string
- externalId?: string (legacy ID)
- externalSystem?: string (legacy system)
- manufacturer?: string
- model?: string
- serial?: string
- riskLoad: number (unbounded)
- riskScore: number (0–100; derived)
- lastAssessedAt?: number
- createdAt: number
  Indexes
- by orgId
- by maintenanceGroupId

# assessments

- assetId: Id<"assets">
- intent: "routine" | "problem"
- createdByRole: "user" | "inspector" | "maintainer"
- createdByUserId?: string (optional, even a device id)
- photoStorageIds: Id<"\_storage">[] (or store urls)
- photoDescriptions: string[] (same length as photos; for traceability)
- answers: Record<string, string | number | boolean>
- notes?: string
- aiOutput?: (store full JSON)
- createdAt: number
  Indexes
- by assetId
- by createdAt

# maintenanceRecords

- assetId
- createdByUserId
- maintenanceGroupId
- closedWorkItemIds
- notes?
- afterPhotoStorageIds?
- timeSpentMinutes?
- createdAt

# workItems

(Persistent, deduped, maintainer-facing)

- assetId: Id<"assets">
- actionKey: string (snake_case)
- title: string
- status: "open" | "done"
- priorityScore: number (0..1)
- riskValue: number (0..100) (used for riskLoad sum)
- evidenceCount: number
- firstSeenAt: number
- lastSeenAt: number
- lastEvidenceAssessmentId: Id<"assessments">
- closedAt?: number
- closedByUserId?: string
- closedByRecordId?: Id<"maintenanceRecords">
  Indexes
- unique-ish query by (assetId, actionKey) (Convex doesn’t enforce uniqueness natively; you enforce it in code)
- by assetId
- by status

## Asset Risk math

Internal (unbounded)
riskLoad = sum(open workItems.riskValue)

Display (bounded 0–100)
Saturating curve:
riskScore = round(100 \* (1 - exp(-riskLoad / 60)))
This gives stable colors and still respects “unbounded true load.”

## AI: what you send + what you require back

Input you send to the AI (per assessment)

# Asset metadata:

- assetName, assetType, manufacturer/model (if any)
- locationText
- externalId (optional)
- maintenanceGroupName (optional)

# Assessment template:

- photoDescriptions[]
- additionalQuestions[]

# Actual assessment submission:

- photos (the images)
- answers (values for questions)
- notes
- intent ("routine" or "problem")
- existingOpenActionKeys[] for this asset (so it reuses keys)

# Constraints:

- “Return max 3 actions”
- “suggested_key must be snake_case”
- “Prefer existing keys when applicable”

## Required AI output schema (JSON)

# AI returns:

```json
{
  "summary": "string",
  "overall_priority": 0.0,
  "findings": [
    {
      "type": "string",
      "severity": 0.0,
      "evidence": "string"
    }
  ],
  "actions": [
    {
      "suggested_key": "snake_case_string",
      "title": "string",
      "description": "string",
      "reason": "string",
      "priority": 0..1,
      "risk_value": 0..100,
      "recommended_parts": [
        { "name": "string", "qty": 1 }
      ],
      "estimated_cost": "number"
    }
  ]
}
```

# Constraints you enforce

- actions.length <= 3
- 0 <= overall_priority <= 1
- 0 <= priority <= 1
- 0 <= severity <= 1
- risk_value integer 0..100
- suggested*key matches: ^[a-z]a-z0-9*]{0,47}$

# Backend rules

- If risk under threshold and priority under threshold do NOT create/update work items (keeps maintainer queue clean)
- Otherwise: upsert WorkItem by (assetId, actionKey)

## End-to-end flow (what each role does)

# 0) NFC / Deep link entry

Tag contains: https://venturai.app/a/<assetId>

- If it opens web: show asset page + “Open in Inspector App”
- If it opens app directly: route to AssetScreen(assetId)

# 1) User/Inspector: “Assess” or “Report”

- Both create an Assessment with different intent.

UI steps

1. Asset screen shows 3 buttons:

- Assess (routine)
- Report a problem (problem)
- Record maintenance (maintainer)

2. For Assess/Report:

- Show required photoDescriptions (from template)
- Collect photos (N required)
- Ask additional questions
- Notes field (optional)

3. Submit

Backend steps (assessments:createWithAI)

1. Save Assessment (photos already uploaded)
2. Fetch current open work items for this asset → existingOpenActionKeys[]
3. Call AI with:

- images + metadata + answers + intent + existingOpenActionKeys

4. Validate AI JSON

- fix/slugify invalid keys if needed

5. For each action (max 3):

- if work_required=false: skip work item
- else upsert work item:
  - if open exists: lastSeenAt=now, evidenceCount++, bump priorityScore/riskValue if higher
  - else create new open work item

6. Recompute asset riskLoad and riskScore
7. Update asset lastAssessedAt
8. Save aiOutput into the Assessment
9. Return AI output to client for display

What the user sees after submit

- Summary
- Findings
- “Top Actions”
- Updated asset risk score

## 2) Maintainer: “Record maintenance”

This is a closure flow.

# UI steps

1. Maintainer taps asset
2. Sees list of open WorkItems with checkboxes
3. Checks the ones they fixed
4. Optional “after” photo + notes
5. Submit

# Backend steps

1. create maintenanceRecords entry (no ai)
2. For each selected WorkItem:

- set status="done"
- set closedAt=now
- link closedByRecordId

3. Recompute asset riskLoad/riskScore
4. Done

# 3) Dashboard (React/Vite)

Two core screens:

1. Asset list (sorted by riskScore desc, color-coded)
2. Asset detail:

- riskScore + riskLoad
- open WorkItems
- inspection/assessment history timeline
  Optional:
- WorkItems queue grouped by maintenanceGroup

# Minimal implementation checklist (so you finish)

Must

- Deep link route /a/:assetId on web + app
- Asset screen with 3 buttons
- Assessment template driving required photos
- AI action upsert logic + risk recalculation
- Dashboard list sorted by risk
  Nice-to-have
- Maintenance groups + filtering
- “Open in app” button on web
- Org registration UI
