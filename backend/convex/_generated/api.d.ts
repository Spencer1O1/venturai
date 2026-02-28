/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_provider_adapter_ai_output_schema from "../ai_provider_adapter/ai_output_schema.js";
import type * as ai_provider_adapter_analyze from "../ai_provider_adapter/analyze.js";
import type * as ai_provider_adapter_index from "../ai_provider_adapter/index.js";
import type * as ai_provider_adapter_openai_analyze from "../ai_provider_adapter/openai/analyze.js";
import type * as ai_provider_adapter_openai_index from "../ai_provider_adapter/openai/index.js";
import type * as ai_provider_adapter_parse_raw_ai_response from "../ai_provider_adapter/parse_raw_ai_response.js";
import type * as ai_provider_adapter_types from "../ai_provider_adapter/types.js";
import type * as assessments from "../assessments.js";
import type * as assessments_actions from "../assessments_actions.js";
import type * as assessments_internal from "../assessments_internal.js";
import type * as assets from "../assets.js";
import type * as lib_utils from "../lib/utils.js";
import type * as maintenance_groups from "../maintenance_groups.js";
import type * as maintenance_records from "../maintenance_records.js";
import type * as orgs from "../orgs.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as templates from "../templates.js";
import type * as types from "../types.js";
import type * as work_items from "../work_items.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai_provider_adapter/ai_output_schema": typeof ai_provider_adapter_ai_output_schema;
  "ai_provider_adapter/analyze": typeof ai_provider_adapter_analyze;
  "ai_provider_adapter/index": typeof ai_provider_adapter_index;
  "ai_provider_adapter/openai/analyze": typeof ai_provider_adapter_openai_analyze;
  "ai_provider_adapter/openai/index": typeof ai_provider_adapter_openai_index;
  "ai_provider_adapter/parse_raw_ai_response": typeof ai_provider_adapter_parse_raw_ai_response;
  "ai_provider_adapter/types": typeof ai_provider_adapter_types;
  assessments: typeof assessments;
  assessments_actions: typeof assessments_actions;
  assessments_internal: typeof assessments_internal;
  assets: typeof assets;
  "lib/utils": typeof lib_utils;
  maintenance_groups: typeof maintenance_groups;
  maintenance_records: typeof maintenance_records;
  orgs: typeof orgs;
  seed: typeof seed;
  storage: typeof storage;
  templates: typeof templates;
  types: typeof types;
  work_items: typeof work_items;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
