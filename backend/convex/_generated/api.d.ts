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
import type * as ai_provider_adapter_asset_suggestion_schema from "../ai_provider_adapter/asset_suggestion_schema.js";
import type * as ai_provider_adapter_index from "../ai_provider_adapter/index.js";
import type * as ai_provider_adapter_openai_analyze from "../ai_provider_adapter/openai/analyze.js";
import type * as ai_provider_adapter_openai_index from "../ai_provider_adapter/openai/index.js";
import type * as ai_provider_adapter_openai_suggest_asset from "../ai_provider_adapter/openai/suggest_asset.js";
import type * as ai_provider_adapter_parse_raw_ai_response from "../ai_provider_adapter/parse_raw_ai_response.js";
import type * as ai_provider_adapter_suggest_asset from "../ai_provider_adapter/suggest_asset.js";
import type * as ai_provider_adapter_types from "../ai_provider_adapter/types.js";
import type * as assessments_actions from "../assessments/actions.js";
import type * as assessments_helpers from "../assessments/helpers.js";
import type * as assessments_internal_mutations from "../assessments/internal_mutations.js";
import type * as assessments_internal_queries from "../assessments/internal_queries.js";
import type * as assessments_queries from "../assessments/queries.js";
import type * as assets_actions from "../assets/actions.js";
import type * as assets_helpers from "../assets/helpers.js";
import type * as assets_mutations from "../assets/mutations.js";
import type * as assets_queries from "../assets/queries.js";
import type * as auth from "../auth.js";
import type * as auth_helpers from "../auth_helpers.js";
import type * as http from "../http.js";
import type * as lib_ai_output_validator from "../lib/ai_output_validator.js";
import type * as lib_utils from "../lib/utils.js";
import type * as maintenance_groups from "../maintenance_groups.js";
import type * as maintenance_records from "../maintenance_records.js";
import type * as org_members from "../org_members.js";
import type * as orgs from "../orgs.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as templates from "../templates.js";
import type * as types from "../types.js";
import type * as users from "../users.js";
import type * as work_items from "../work_items.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai_provider_adapter/ai_output_schema": typeof ai_provider_adapter_ai_output_schema;
  "ai_provider_adapter/analyze": typeof ai_provider_adapter_analyze;
  "ai_provider_adapter/asset_suggestion_schema": typeof ai_provider_adapter_asset_suggestion_schema;
  "ai_provider_adapter/index": typeof ai_provider_adapter_index;
  "ai_provider_adapter/openai/analyze": typeof ai_provider_adapter_openai_analyze;
  "ai_provider_adapter/openai/index": typeof ai_provider_adapter_openai_index;
  "ai_provider_adapter/openai/suggest_asset": typeof ai_provider_adapter_openai_suggest_asset;
  "ai_provider_adapter/parse_raw_ai_response": typeof ai_provider_adapter_parse_raw_ai_response;
  "ai_provider_adapter/suggest_asset": typeof ai_provider_adapter_suggest_asset;
  "ai_provider_adapter/types": typeof ai_provider_adapter_types;
  "assessments/actions": typeof assessments_actions;
  "assessments/helpers": typeof assessments_helpers;
  "assessments/internal_mutations": typeof assessments_internal_mutations;
  "assessments/internal_queries": typeof assessments_internal_queries;
  "assessments/queries": typeof assessments_queries;
  "assets/actions": typeof assets_actions;
  "assets/helpers": typeof assets_helpers;
  "assets/mutations": typeof assets_mutations;
  "assets/queries": typeof assets_queries;
  auth: typeof auth;
  auth_helpers: typeof auth_helpers;
  http: typeof http;
  "lib/ai_output_validator": typeof lib_ai_output_validator;
  "lib/utils": typeof lib_utils;
  maintenance_groups: typeof maintenance_groups;
  maintenance_records: typeof maintenance_records;
  org_members: typeof org_members;
  orgs: typeof orgs;
  seed: typeof seed;
  storage: typeof storage;
  templates: typeof templates;
  types: typeof types;
  users: typeof users;
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
