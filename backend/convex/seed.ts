import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import { computeRiskScoreFromLoad } from "./lib/utils";

/**
 * Seed dev data: one org, one maintenance group, one template, one asset.
 * Optional helper for local development.
 */
export const seed = mutation({
  args: {},
  returns: v.object({
    orgId: v.id("orgs"),
    maintenanceGroupId: v.id("maintenanceGroups"),
    templateId: v.id("assessmentTemplates"),
    assetId: v.id("assets"),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    const orgId = await ctx.db.insert("orgs", {
      name: "Demo Org",
      createdAt: now,
    });

    const maintenanceGroupId = await ctx.db.insert("maintenanceGroups", {
      orgId,
      name: "Pump Bay A",
      createdAt: now,
    });

    const templateId = await ctx.db.insert("assessmentTemplates", {
      orgId,
      name: "Pump Inspection",
      photoDescriptions: [
        "Wide shot of asset",
        "Close-up of suspected wear area",
      ],
      additionalQuestions: [
        { key: "vibration", label: "Vibration level (1-5)", type: "number" },
        { key: "noise", label: "Unusual noise?", type: "boolean" },
      ],
      createdAt: now,
    });
    const assetId = await ctx.db.insert("assets", {
      orgId,
      maintenanceGroupId,
      templateId,
      name: "Diaphragm Pump #1",
      locationText: "Bay A, North wall",
      manufacturer: "Example Mfg",
      model: "DP-100",
      riskLoad: 0,
      riskScore: 0,
      createdAt: now,
    });

    return { orgId, maintenanceGroupId, templateId, assetId };
  },
});

const IDEA_FACTORY_ASSETS = [
  {
    groupName: "Digital Fabrication",
    name: "CNC Router",
    manufacturer: "ShopSabre",
    model: "CNC Router Pro",
    sourceFolder: "cnc_router",
    imagePaths: [
      "data/usu/idea_factory/cnc_router/20260226_121816.jpg",
      "data/usu/idea_factory/cnc_router/20260226_121854.jpg",
      "data/usu/idea_factory/cnc_router/20260226_123414.jpg",
    ],
    findings: [
      { key: "dust_collection_clogging", title: "Dust collection hose partially clogged", riskValue: 52, priorityScore: 0.71, status: "open" as const },
      { key: "spoilboard_wear", title: "Spoilboard wear pattern exceeds tolerance", riskValue: 46, priorityScore: 0.64, status: "open" as const },
      { key: "gantry_rail_cleanup", title: "Gantry rail cleaned and relubricated", riskValue: 28, priorityScore: 0.41, status: "done" as const },
    ],
  },
  {
    groupName: "Laser & Print",
    name: "Jerry Laser Engraver",
    manufacturer: "Epilog",
    model: "Fusion Edge",
    sourceFolder: "jerry_laser_engraver",
    imagePaths: [
      "data/usu/idea_factory/jerry_laser_engraver/20260226_115443.jpg",
      "data/usu/idea_factory/jerry_laser_engraver/20260226_115509.jpg",
    ],
    findings: [
      { key: "exhaust_flow_low", title: "Exhaust flow below target CFM", riskValue: 63, priorityScore: 0.8, status: "open" as const },
      { key: "lens_cleaning_required", title: "Focal lens requires cleaning", riskValue: 35, priorityScore: 0.52, status: "open" as const },
      { key: "air_assist_line_replaced", title: "Air assist line was replaced", riskValue: 18, priorityScore: 0.3, status: "done" as const },
    ],
  },
  {
    groupName: "Laser & Print",
    name: "Tom Laser Engraver",
    manufacturer: "Glowforge",
    model: "Plus",
    sourceFolder: "tom_laser_engraver",
    imagePaths: [
      "data/usu/idea_factory/tom_laser_engraver/20260226_122503.jpg",
      "data/usu/idea_factory/tom_laser_engraver/20260226_122506.jpg",
    ],
    findings: [
      { key: "head_alignment_drift", title: "Head alignment drift detected", riskValue: 44, priorityScore: 0.66, status: "open" as const },
      { key: "cooling_fan_noise", title: "Cooling fan bearing noise", riskValue: 31, priorityScore: 0.43, status: "open" as const },
    ],
  },
  {
    groupName: "3D Printing",
    name: "Atlas Prusa XL",
    manufacturer: "Prusa",
    model: "XL",
    sourceFolder: "atlas_prusa_xl",
    imagePaths: [
      "data/usu/idea_factory/atlas_prusa_xl/20260226_115548.jpg",
      "data/usu/idea_factory/atlas_prusa_xl/20260226_120855.jpg",
    ],
    findings: [
      { key: "nozzle_wear", title: "Nozzle wear causing layer inconsistency", riskValue: 41, priorityScore: 0.58, status: "open" as const },
      { key: "bed_mesh_recalibration", title: "Bed mesh was recalibrated", riskValue: 22, priorityScore: 0.24, status: "done" as const },
    ],
  },
  {
    groupName: "3D Printing",
    name: "Original Prusa XL",
    manufacturer: "Prusa",
    model: "XL",
    sourceFolder: "original_prusa_xl",
    imagePaths: ["data/usu/idea_factory/original_prusa_xl/20260226_120143.jpg"],
    findings: [
      { key: "x_axis_belt_tension", title: "X-axis belt tension needs adjustment", riskValue: 39, priorityScore: 0.57, status: "open" as const },
    ],
  },
  {
    groupName: "3D Printing",
    name: "Brenda Prusa",
    manufacturer: "Prusa",
    model: "MK4",
    sourceFolder: "brenda_prusa",
    imagePaths: [
      "data/usu/idea_factory/brenda_prusa/20260226_120049.jpg",
      "data/usu/idea_factory/brenda_prusa/20260226_120059.jpg",
    ],
    findings: [
      { key: "filament_path_debris", title: "Filament path debris accumulation", riskValue: 27, priorityScore: 0.36, status: "open" as const },
      { key: "extruder_step_test_pass", title: "Extruder step calibration completed", riskValue: 16, priorityScore: 0.2, status: "done" as const },
    ],
  },
  {
    groupName: "3D Printing",
    name: "Frank Prusa",
    manufacturer: "Prusa",
    model: "MK4",
    sourceFolder: "frank_prusa",
    imagePaths: ["data/usu/idea_factory/frank_prusa/20260226_115625.jpg"],
    findings: [{ key: "hotend_thermal_overshoot", title: "Hotend thermal overshoot on warm-up", riskValue: 34, priorityScore: 0.47, status: "open" as const }],
  },
  {
    groupName: "3D Printing",
    name: "Inigo Montoya Prusa",
    manufacturer: "Prusa",
    model: "MK3S+",
    sourceFolder: "inigo_montoya_prusa",
    imagePaths: [
      "data/usu/idea_factory/inigo_montoya_prusa/20260226_115652.jpg",
      "data/usu/idea_factory/inigo_montoya_prusa/20260226_115659.jpg",
    ],
    findings: [
      { key: "z_lead_screw_lubrication", title: "Z lead screw lubrication overdue", riskValue: 37, priorityScore: 0.54, status: "open" as const },
      { key: "build_plate_swap_done", title: "Build plate replaced", riskValue: 19, priorityScore: 0.22, status: "done" as const },
    ],
  },
  {
    groupName: "Machine Tools",
    name: "Skil Drill Press",
    manufacturer: "Skil",
    model: "DP9505",
    sourceFolder: "skil_drill_press",
    imagePaths: [
      "data/usu/idea_factory/skil_drill_press/20260226_121450.jpg",
      "data/usu/idea_factory/skil_drill_press/20260226_121541.jpg",
    ],
    findings: [
      { key: "chuck_runout_high", title: "Chuck runout exceeds 0.15mm", riskValue: 68, priorityScore: 0.88, status: "open" as const },
      { key: "table_lock_loose", title: "Table lock lever loosens under load", riskValue: 56, priorityScore: 0.76, status: "open" as const },
    ],
  },
  {
    groupName: "Machine Tools",
    name: "Craftsman Drill Press",
    manufacturer: "Craftsman",
    model: "CMDP-10",
    sourceFolder: "craftsman_drill_press",
    imagePaths: [
      "data/usu/idea_factory/craftsman_drill_press/20260226_121602.jpg",
      "data/usu/idea_factory/craftsman_drill_press/20260226_121703.jpg",
    ],
    findings: [
      { key: "belt_fraying", title: "Drive belt edge fraying", riskValue: 48, priorityScore: 0.69, status: "open" as const },
      { key: "quill_return_spring_adjusted", title: "Quill return spring adjusted", riskValue: 21, priorityScore: 0.29, status: "done" as const },
    ],
  },
  {
    groupName: "Machine Tools",
    name: "Grizzly Bandsaw",
    manufacturer: "Grizzly",
    model: "G0555",
    sourceFolder: "grizzly_bandsaw",
    imagePaths: [
      "data/usu/idea_factory/grizzly_bandsaw/20260226_121953.jpg",
      "data/usu/idea_factory/grizzly_bandsaw/20260226_122024.jpg",
    ],
    findings: [
      { key: "blade_tracking_off", title: "Blade tracking drifts at high speed", riskValue: 59, priorityScore: 0.79, status: "open" as const },
      { key: "guide_bearing_replace", title: "Guide bearing replacement completed", riskValue: 24, priorityScore: 0.28, status: "done" as const },
    ],
  },
  {
    groupName: "Machine Tools",
    name: "WEN Benchtop Belt Sander",
    manufacturer: "WEN",
    model: "6502T",
    sourceFolder: "wen_benchtop_belt_sander",
    imagePaths: ["data/usu/idea_factory/wen_benchtop_belt_sander/20260226_121722.jpg"],
    findings: [{ key: "belt_tracking_adjust", title: "Belt tracking requires adjustment", riskValue: 33, priorityScore: 0.49, status: "open" as const }],
  },
  {
    groupName: "Digital Fabrication",
    name: "Mini CNC",
    manufacturer: "Bantam",
    model: "Desktop CNC",
    sourceFolder: "mini_cnc",
    imagePaths: [
      "data/usu/idea_factory/mini_cnc/20260226_115826.jpg",
      "data/usu/idea_factory/mini_cnc/20260226_115848.jpg",
    ],
    findings: [
      { key: "spindle_temp_spike", title: "Spindle temp spike during contour pass", riskValue: 53, priorityScore: 0.74, status: "open" as const },
      { key: "tool_holder_cleaned", title: "Tool holder cleaned and reseated", riskValue: 17, priorityScore: 0.2, status: "done" as const },
    ],
  },
  {
    groupName: "Electronics",
    name: "PCB Printer",
    manufacturer: "Voltera",
    model: "V-One",
    sourceFolder: "pcb_printer",
    imagePaths: [
      "data/usu/idea_factory/pcb_printer/20260226_115905.jpg",
      "data/usu/idea_factory/pcb_printer/20260226_120019.jpg",
    ],
    findings: [
      { key: "dispense_head_clog", title: "Dispense head clogging intermittently", riskValue: 47, priorityScore: 0.67, status: "open" as const },
      { key: "bed_level_completed", title: "Bed leveling maintenance completed", riskValue: 15, priorityScore: 0.19, status: "done" as const },
    ],
  },
  {
    groupName: "Electronics",
    name: "Screen Printing Exposure Unit",
    manufacturer: "NuArc",
    model: "MSP 3140",
    sourceFolder: "screen_printing_exposure",
    imagePaths: [
      "data/usu/idea_factory/screen_printing_exposure/20260226_121245.jpg",
      "data/usu/idea_factory/screen_printing_exposure/20260226_121418.jpg",
    ],
    findings: [
      { key: "uv_intensity_drop", title: "UV intensity below baseline", riskValue: 61, priorityScore: 0.84, status: "open" as const },
      { key: "timer_knob_sticky", title: "Exposure timer knob intermittently sticky", riskValue: 25, priorityScore: 0.34, status: "open" as const },
    ],
  },
  {
    groupName: "IT & Controls",
    name: "HP Control PC",
    manufacturer: "HP",
    model: "EliteDesk",
    sourceFolder: "hp_pc",
    imagePaths: [
      "data/usu/idea_factory/hp_pc/20260226_120744.jpg",
      "data/usu/idea_factory/hp_pc/20260226_120751.jpg",
    ],
    findings: [
      { key: "ssd_health_warning", title: "SSD SMART warning observed", riskValue: 42, priorityScore: 0.59, status: "open" as const },
    ],
  },
  {
    groupName: "IT & Controls",
    name: "ThinkCentre Computer",
    manufacturer: "Lenovo",
    model: "ThinkCentre M720",
    sourceFolder: "think_centre_computer",
    imagePaths: ["data/usu/idea_factory/think_centre_computer/20260226_122104.jpg"],
    findings: [
      { key: "fan_dust_buildup", title: "Fan dust buildup restricting airflow", riskValue: 29, priorityScore: 0.4, status: "open" as const },
      { key: "os_patch_cycle_done", title: "OS patch cycle completed", riskValue: 14, priorityScore: 0.14, status: "done" as const },
    ],
  },
];

/**
 * Creates synthetic dashboard data for the USU Idea Factory image set.
 * This creates org, maintenance groups, assets, assessments, work items,
 * and maintenance records with image file paths captured in assessment metadata.
 */
export const seedIdeaFactoryDashboardData = mutation({
  args: {},
  returns: v.object({
    orgId: v.id("orgs"),
    maintenanceGroupCount: v.number(),
    assetCount: v.number(),
    assessmentCount: v.number(),
    workItemCount: v.number(),
    maintenanceRecordCount: v.number(),
  }),
  handler: async (ctx) => {
    const baseNow = Date.now();

    const orgId = await ctx.db.insert("orgs", {
      name: "USU Idea Factory (Synthetic)",
      createdAt: baseNow,
    });

    const groupIds = new Map<string, Id<"maintenanceGroups">>();
    for (const groupName of [...new Set(IDEA_FACTORY_ASSETS.map((a) => a.groupName))]) {
      const groupId = await ctx.db.insert("maintenanceGroups", {
        orgId,
        name: groupName,
        createdAt: baseNow,
      });
      groupIds.set(groupName, groupId);
    }

    const templateId = await ctx.db.insert("assessmentTemplates", {
      orgId,
      name: "Idea Factory Visual Inspection",
      photoDescriptions: [
        "Wide machine view",
        "Close-up of wear/fault area",
        "Control panel and safety elements",
      ],
      additionalQuestions: [
        { key: "is_operational", label: "Machine currently operational?", type: "boolean" },
        { key: "runtime_hours", label: "Approximate runtime hours", type: "number" },
        { key: "operator_notes", label: "Operator notes", type: "text" },
      ],
      createdAt: baseNow,
    });

    let assessmentCount = 0;
    let workItemCount = 0;
    let maintenanceRecordCount = 0;

    for (const [index, assetSeed] of IDEA_FACTORY_ASSETS.entries()) {
      const createdAt = baseNow + index * 1_000;
      const maintenanceGroupId = groupIds.get(assetSeed.groupName);
      if (!maintenanceGroupId) continue;

      const assetId = await ctx.db.insert("assets", {
        orgId,
        maintenanceGroupId,
        templateId,
        name: assetSeed.name,
        locationText: `USU Idea Factory · ${assetSeed.groupName}`,
        externalId: `idea-factory-${assetSeed.sourceFolder}`,
        externalSystem: "usu_idea_factory_images",
        manufacturer: assetSeed.manufacturer,
        model: assetSeed.model,
        riskLoad: 0,
        riskScore: 0,
        createdAt,
      });

      const assessmentId = await ctx.db.insert("assessments", {
        assetId,
        intent: "routine",
        createdByRole: "maintainer",
        createdByUserId: "synthetic-seed",
        photoStorageIds: [],
        photoDescriptions: assetSeed.imagePaths,
        answers: {
          is_operational: true,
          runtime_hours: 100 + index * 13,
          operator_notes: `Synthetic inspection using folder ${assetSeed.sourceFolder}`,
        },
        notes: `Synthetic assessment from data/usu/idea_factory/${assetSeed.sourceFolder}`,
        createdAt,
      });
      assessmentCount += 1;

      const openIds: Id<"workItems">[] = [];
      for (const [findingIndex, finding] of assetSeed.findings.entries()) {
        const seenAt = createdAt + (findingIndex + 1) * 100;
        const workItemId = await ctx.db.insert("workItems", {
          assetId,
          actionKey: finding.key,
          title: finding.title,
          status: finding.status,
          priorityScore: finding.priorityScore,
          riskValue: finding.riskValue,
          evidenceCount: 1,
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
          lastEvidenceAssessmentId: assessmentId,
        });
        workItemCount += 1;

        if (finding.status === "open") {
          openIds.push(workItemId);
        } else {
          const recordId = await ctx.db.insert("maintenanceRecords", {
            assetId,
            maintenanceGroupId,
            closedWorkItemIds: [workItemId],
            createdByUserId: "synthetic-seed",
            notes: `Synthetic maintenance closure for ${finding.title}`,
            createdAt: seenAt + 25,
          });
          maintenanceRecordCount += 1;
          await ctx.db.patch(workItemId, {
            closedAt: seenAt + 25,
            closedByUserId: "synthetic-seed",
            closedByRecordId: recordId,
          });
        }
      }

      const riskLoad = assetSeed.findings
        .filter((f) => f.status === "open")
        .reduce((sum, f) => sum + f.riskValue, 0);

      await ctx.db.patch(assetId, {
        riskLoad,
        riskScore: computeRiskScoreFromLoad(riskLoad),
        lastAssessedAt: createdAt,
      });

      if (openIds.length > 0 && index % 3 === 0) {
        const partialCloseId = openIds[0];
        if (!partialCloseId) {
          continue;
        }
        const partialCloseAt = createdAt + 900;
        const recordId = await ctx.db.insert("maintenanceRecords", {
          assetId,
          maintenanceGroupId,
          closedWorkItemIds: [partialCloseId],
          createdByUserId: "synthetic-seed",
          notes: "Synthetic partial close to provide historical maintenance records",
          createdAt: partialCloseAt,
        });
        maintenanceRecordCount += 1;

        const closedItem = await ctx.db.get(partialCloseId);
        if (closedItem) {
          await ctx.db.patch(partialCloseId, {
            status: "done",
            closedAt: partialCloseAt,
            closedByUserId: "synthetic-seed",
            closedByRecordId: recordId,
          });

          const updatedRiskLoad = Math.max(0, riskLoad - closedItem.riskValue);
          await ctx.db.patch(assetId, {
            riskLoad: updatedRiskLoad,
            riskScore: computeRiskScoreFromLoad(updatedRiskLoad),
          });
        }
      }
    }

    return {
      orgId,
      maintenanceGroupCount: groupIds.size,
      assetCount: IDEA_FACTORY_ASSETS.length,
      assessmentCount,
      workItemCount,
      maintenanceRecordCount,
    };
  },
});
