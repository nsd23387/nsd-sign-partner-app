/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_adminImages from "../actions/adminImages.js";
import type * as actions_analyticsQMS from "../actions/analyticsQMS.js";
import type * as actions_companyFiles from "../actions/companyFiles.js";
import type * as actions_customerEmails from "../actions/customerEmails.js";
import type * as actions_designStudio from "../actions/designStudio.js";
import type * as actions_email from "../actions/email.js";
import type * as actions_followup from "../actions/followup.js";
import type * as actions_gmailSimple from "../actions/gmailSimple.js";
import type * as actions_gmailTest from "../actions/gmailTest.js";
import type * as actions_gmailWorking from "../actions/gmailWorking.js";
import type * as actions_ingestMockupToMediaIntelligence from "../actions/ingestMockupToMediaIntelligence.js";
import type * as actions_maintenance from "../actions/maintenance.js";
import type * as actions_mockup from "../actions/mockup.js";
import type * as actions_odsEvents from "../actions/odsEvents.js";
import type * as actions_payment from "../actions/payment.js";
import type * as actions_quo from "../actions/quo.js";
import type * as actions_quote from "../actions/quote.js";
import type * as actions_salesInquiry from "../actions/salesInquiry.js";
import type * as actions_salesScript from "../actions/salesScript.js";
import type * as actions_sceneRender from "../actions/sceneRender.js";
import type * as actions_teamSync from "../actions/teamSync.js";
import type * as actions_trello from "../actions/trello.js";
import type * as adminAccess from "../adminAccess.js";
import type * as adminImageUploads from "../adminImageUploads.js";
import type * as adminSetup from "../adminSetup.js";
import type * as assignmentRules from "../assignmentRules.js";
import type * as campaigns from "../campaigns.js";
import type * as companyFiles from "../companyFiles.js";
import type * as config from "../config.js";
import type * as crons from "../crons.js";
import type * as customerDirectory from "../customerDirectory.js";
import type * as dashboard from "../dashboard.js";
import type * as dashboardCache from "../dashboardCache.js";
import type * as debug from "../debug.js";
import type * as emails from "../emails.js";
import type * as featureFlags from "../featureFlags.js";
import type * as fixTimestamps from "../fixTimestamps.js";
import type * as followup from "../followup.js";
import type * as fulfillment from "../fulfillment.js";
import type * as gmailBareTest from "../gmailBareTest.js";
import type * as health from "../health.js";
import type * as highValueEscalation from "../highValueEscalation.js";
import type * as http from "../http.js";
import type * as intakeFailures from "../intakeFailures.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_businessHours from "../lib/businessHours.js";
import type * as lib_config from "../lib/config.js";
import type * as lib_gmail from "../lib/gmail.js";
import type * as lib_pricing from "../lib/pricing.js";
import type * as lib_quoteStatus from "../lib/quoteStatus.js";
import type * as lib_rushOrderAvailability from "../lib/rushOrderAvailability.js";
import type * as lib_sceneBackgrounds from "../lib/sceneBackgrounds.js";
import type * as lib_sms from "../lib/sms.js";
import type * as lib_validators from "../lib/validators.js";
import type * as marginAnalytics from "../marginAnalytics.js";
import type * as migrations_addEmailLogo from "../migrations/addEmailLogo.js";
import type * as migrations_addWeekendAssignmentRule from "../migrations/addWeekendAssignmentRule.js";
import type * as migrations_backfillCampaignQuotes from "../migrations/backfillCampaignQuotes.js";
import type * as migrations_backfillMockupSlaTracking from "../migrations/backfillMockupSlaTracking.js";
import type * as migrations_backfillPaymentFollowups from "../migrations/backfillPaymentFollowups.js";
import type * as migrations_checkEmailTimestamps from "../migrations/checkEmailTimestamps.js";
import type * as migrations_cleanupLegacyTeamFields from "../migrations/cleanupLegacyTeamFields.js";
import type * as migrations_clearStuckRevision from "../migrations/clearStuckRevision.js";
import type * as migrations_createOriginalVariations from "../migrations/createOriginalVariations.js";
import type * as migrations_fixBreakdownSchema from "../migrations/fixBreakdownSchema.js";
import type * as migrations_initializePricingConfig from "../migrations/initializePricingConfig.js";
import type * as migrations_migrateEmailTimestamps from "../migrations/migrateEmailTimestamps.js";
import type * as migrations_nullifyLegacyRoles from "../migrations/nullifyLegacyRoles.js";
import type * as migrations_removeCreatedAtField from "../migrations/removeCreatedAtField.js";
import type * as migrations_sceneRenderBackfill from "../migrations/sceneRenderBackfill.js";
import type * as migrations_syncAssigneeEmailsToTeam from "../migrations/syncAssigneeEmailsToTeam.js";
import type * as mockupReviews from "../mockupReviews.js";
import type * as mockupSlaMirror from "../mockupSlaMirror.js";
import type * as node_analyticsEmitter from "../node/analyticsEmitter.js";
import type * as node_analyticsNode from "../node/analyticsNode.js";
import type * as notifications from "../notifications.js";
import type * as partnerQuotes from "../partnerQuotes.js";
import type * as partners from "../partners.js";
import type * as passwordAuth from "../passwordAuth.js";
import type * as pricingConfig from "../pricingConfig.js";
import type * as pricingConfigAdmin from "../pricingConfigAdmin.js";
import type * as productionAssignments from "../productionAssignments.js";
import type * as quoteEngagement from "../quoteEngagement.js";
import type * as quoteHistory from "../quoteHistory.js";
import type * as quoteUploads from "../quoteUploads.js";
import type * as quoteVariations from "../quoteVariations.js";
import type * as quotes from "../quotes.js";
import type * as rateLimit from "../rateLimit.js";
import type * as sceneBackgrounds from "../sceneBackgrounds.js";
import type * as sceneEngine from "../sceneEngine.js";
import type * as scheduledCleanup from "../scheduledCleanup.js";
import type * as shipmentTracking from "../shipmentTracking.js";
import type * as sms from "../sms.js";
import type * as storageTracking from "../storageTracking.js";
import type * as suppliers from "../suppliers.js";
import type * as team from "../team.js";
import type * as teamAuth from "../teamAuth.js";
import type * as teamMirror from "../teamMirror.js";
import type * as teamRoles from "../teamRoles.js";
import type * as testNode from "../testNode.js";
import type * as tidio from "../tidio.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/adminImages": typeof actions_adminImages;
  "actions/analyticsQMS": typeof actions_analyticsQMS;
  "actions/companyFiles": typeof actions_companyFiles;
  "actions/customerEmails": typeof actions_customerEmails;
  "actions/designStudio": typeof actions_designStudio;
  "actions/email": typeof actions_email;
  "actions/followup": typeof actions_followup;
  "actions/gmailSimple": typeof actions_gmailSimple;
  "actions/gmailTest": typeof actions_gmailTest;
  "actions/gmailWorking": typeof actions_gmailWorking;
  "actions/ingestMockupToMediaIntelligence": typeof actions_ingestMockupToMediaIntelligence;
  "actions/maintenance": typeof actions_maintenance;
  "actions/mockup": typeof actions_mockup;
  "actions/odsEvents": typeof actions_odsEvents;
  "actions/payment": typeof actions_payment;
  "actions/quo": typeof actions_quo;
  "actions/quote": typeof actions_quote;
  "actions/salesInquiry": typeof actions_salesInquiry;
  "actions/salesScript": typeof actions_salesScript;
  "actions/sceneRender": typeof actions_sceneRender;
  "actions/teamSync": typeof actions_teamSync;
  "actions/trello": typeof actions_trello;
  adminAccess: typeof adminAccess;
  adminImageUploads: typeof adminImageUploads;
  adminSetup: typeof adminSetup;
  assignmentRules: typeof assignmentRules;
  campaigns: typeof campaigns;
  companyFiles: typeof companyFiles;
  config: typeof config;
  crons: typeof crons;
  customerDirectory: typeof customerDirectory;
  dashboard: typeof dashboard;
  dashboardCache: typeof dashboardCache;
  debug: typeof debug;
  emails: typeof emails;
  featureFlags: typeof featureFlags;
  fixTimestamps: typeof fixTimestamps;
  followup: typeof followup;
  fulfillment: typeof fulfillment;
  gmailBareTest: typeof gmailBareTest;
  health: typeof health;
  highValueEscalation: typeof highValueEscalation;
  http: typeof http;
  intakeFailures: typeof intakeFailures;
  "lib/auth": typeof lib_auth;
  "lib/businessHours": typeof lib_businessHours;
  "lib/config": typeof lib_config;
  "lib/gmail": typeof lib_gmail;
  "lib/pricing": typeof lib_pricing;
  "lib/quoteStatus": typeof lib_quoteStatus;
  "lib/rushOrderAvailability": typeof lib_rushOrderAvailability;
  "lib/sceneBackgrounds": typeof lib_sceneBackgrounds;
  "lib/sms": typeof lib_sms;
  "lib/validators": typeof lib_validators;
  marginAnalytics: typeof marginAnalytics;
  "migrations/addEmailLogo": typeof migrations_addEmailLogo;
  "migrations/addWeekendAssignmentRule": typeof migrations_addWeekendAssignmentRule;
  "migrations/backfillCampaignQuotes": typeof migrations_backfillCampaignQuotes;
  "migrations/backfillMockupSlaTracking": typeof migrations_backfillMockupSlaTracking;
  "migrations/backfillPaymentFollowups": typeof migrations_backfillPaymentFollowups;
  "migrations/checkEmailTimestamps": typeof migrations_checkEmailTimestamps;
  "migrations/cleanupLegacyTeamFields": typeof migrations_cleanupLegacyTeamFields;
  "migrations/clearStuckRevision": typeof migrations_clearStuckRevision;
  "migrations/createOriginalVariations": typeof migrations_createOriginalVariations;
  "migrations/fixBreakdownSchema": typeof migrations_fixBreakdownSchema;
  "migrations/initializePricingConfig": typeof migrations_initializePricingConfig;
  "migrations/migrateEmailTimestamps": typeof migrations_migrateEmailTimestamps;
  "migrations/nullifyLegacyRoles": typeof migrations_nullifyLegacyRoles;
  "migrations/removeCreatedAtField": typeof migrations_removeCreatedAtField;
  "migrations/sceneRenderBackfill": typeof migrations_sceneRenderBackfill;
  "migrations/syncAssigneeEmailsToTeam": typeof migrations_syncAssigneeEmailsToTeam;
  mockupReviews: typeof mockupReviews;
  mockupSlaMirror: typeof mockupSlaMirror;
  "node/analyticsEmitter": typeof node_analyticsEmitter;
  "node/analyticsNode": typeof node_analyticsNode;
  notifications: typeof notifications;
  partnerQuotes: typeof partnerQuotes;
  partners: typeof partners;
  passwordAuth: typeof passwordAuth;
  pricingConfig: typeof pricingConfig;
  pricingConfigAdmin: typeof pricingConfigAdmin;
  productionAssignments: typeof productionAssignments;
  quoteEngagement: typeof quoteEngagement;
  quoteHistory: typeof quoteHistory;
  quoteUploads: typeof quoteUploads;
  quoteVariations: typeof quoteVariations;
  quotes: typeof quotes;
  rateLimit: typeof rateLimit;
  sceneBackgrounds: typeof sceneBackgrounds;
  sceneEngine: typeof sceneEngine;
  scheduledCleanup: typeof scheduledCleanup;
  shipmentTracking: typeof shipmentTracking;
  sms: typeof sms;
  storageTracking: typeof storageTracking;
  suppliers: typeof suppliers;
  team: typeof team;
  teamAuth: typeof teamAuth;
  teamMirror: typeof teamMirror;
  teamRoles: typeof teamRoles;
  testNode: typeof testNode;
  tidio: typeof tidio;
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
