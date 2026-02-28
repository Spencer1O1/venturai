import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../../lib/theme";

type Asset = {
  _id: Id<"assets">;
  name: string;
  locationText?: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  riskScore: number;
  riskLoad: number;
  lastAssessedAt?: number;
};

type Assessment = {
  _id: Id<"assessments">;
  intent: "routine" | "problem";
  photoStorageIds: Id<"_storage">[];
  notes?: string;
  aiAnalysis?: { summary: string };
  createdAt: number;
};

/**
 * Asset dashboard - /a/<assetId>.
 * Two views: org members see full history + data + actions; everyone else sees basic info only.
 */
export default function AssetDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const asset = useQuery(
    api.assets.queries.getById,
    id ? { assetId: id as Id<"assets"> } : "skip",
  );
  const adminOrgs = useQuery(api.org_members.getOrgsUserIsAdminOf);
  const isMemberOfOrg = useQuery(
    api.auth_helpers.isMemberOfAssetOrg,
    id ? { assetId: id as Id<"assets"> } : "skip",
  );

  if (asset === undefined || isMemberOfOrg === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (asset === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Asset not found</Text>
        <Text style={styles.subtitle}>
          The tag may point to a deleted asset or be unprogrammed.
        </Text>
        {adminOrgs?.length ? (
          <Pressable
            style={styles.button}
            onPress={() => router.push("/register" as never)}
          >
            <Text style={styles.buttonTextPrimary}>Register new asset</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (isMemberOfOrg) {
    return (
      <AssetOrgView
        assetId={asset._id as Id<"assets">}
        asset={asset as Asset}
        router={router}
      />
    );
  }

  return <AssetPublicView asset={asset as Asset} router={router} />;
}

/** Assessment card for org view history. */
function AssessmentCard({
  assessment,
}: {
  assessment: Assessment;
}) {
  const photoUrls = useQuery(
    api.storage.getUrls,
    assessment.photoStorageIds.length > 0
      ? { storageIds: assessment.photoStorageIds }
      : "skip",
  );

  const intentLabel =
    assessment.intent === "routine" ? "Inspection" : "Problem report";
  const date = new Date(assessment.createdAt).toLocaleDateString();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{intentLabel}</Text>
        <Text style={styles.cardDate}>{date}</Text>
      </View>
      {photoUrls && photoUrls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photos}
        >
          {photoUrls.map(
            (url, i) =>
              url && (
                <Image
                  key={`${i}-${url.slice(-24)}`}
                  source={{ uri: url }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ),
          )}
        </ScrollView>
      )}
      {assessment.aiAnalysis?.summary ? (
        <Text style={styles.notes}>{assessment.aiAnalysis.summary}</Text>
      ) : null}
      {assessment.notes ? (
        <Text style={styles.notes}>{assessment.notes}</Text>
      ) : null}
    </View>
  );
}

/** Full view for org members: all data fields, history, and actions. */
function AssetOrgView({
  assetId,
  asset,
  router,
}: {
  assetId: Id<"assets">;
  asset: Asset;
  router: ReturnType<typeof useRouter>;
}) {
  const isMaintenanceWorker = useQuery(
    api.auth_helpers.isMaintenanceWorkerForAsset,
    { assetId },
  );
  const assessments = useQuery(
    api.assessments.queries.listByAsset,
    { assetId },
  );
  const showMaintenance = isMaintenanceWorker ?? false;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{asset.name}</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>

      {!showMaintenance && (
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push("/sign-in" as never)}
        >
          <Text style={styles.buttonTitleSecondary}>Sign in for maintenance</Text>
          <Text style={styles.buttonHintSecondary}>
            Inspect, report problems, and record maintenance
          </Text>
        </Pressable>
      )}

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/inspection/${assetId}` as never)}
      >
        <Text style={styles.buttonTitle}>Inspect</Text>
        <Text style={styles.buttonHint}>
          Take photos, enter information, routine check
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/report/${assetId}` as never)}
      >
        <Text style={styles.buttonTitle}>Report a problem</Text>
        <Text style={styles.buttonHint}>
          Take photo of problem, enter details
        </Text>
      </Pressable>

      {showMaintenance && (
        <>
          <Pressable
            style={[styles.button, styles.buttonMaintenance]}
            onPress={() =>
              router.push(`/maintenance/${assetId}` as Parameters<typeof router.push>[0])
            }
          >
            <Text style={styles.buttonTitle}>Report maintenance</Text>
            <Text style={styles.buttonHint}>
              Update status of work items, record work done
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={() =>
              router.push(`/view/${assetId}` as Parameters<typeof router.push>[0])
            }
          >
            <Text style={styles.buttonTitleSecondary}>View full history</Text>
            <Text style={styles.buttonHintSecondary}>
              See all assessments with photos
            </Text>
          </Pressable>
        </>
      )}

      <Text style={styles.sectionLabel}>Asset details</Text>
      <View style={styles.detailsCard}>
        <DetailRow label="Manufacturer" value={asset.manufacturer} />
        <DetailRow label="Model" value={asset.model} />
        <DetailRow label="Serial" value={asset.serial} />
        <DetailRow label="Location" value={asset.locationText} />
        <DetailRow label="Risk score" value={String(asset.riskScore)} />
        <DetailRow label="Risk load" value={String(asset.riskLoad)} />
        {asset.lastAssessedAt && (
          <DetailRow
            label="Last assessed"
            value={new Date(asset.lastAssessedAt).toLocaleDateString()}
          />
        )}
      </View>

      <Text style={styles.sectionLabel}>Assessment history</Text>
      {assessments === undefined ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : assessments.length === 0 ? (
        <Text style={styles.empty}>No inspections or problem reports yet.</Text>
      ) : (
        assessments.map((a) => (
          <AssessmentCard key={a._id} assessment={a as Assessment} />
        ))
      )}
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (value == null || value === "") return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/** Minimal view for non-org users: basic info and latest assessment summary. */
function AssetPublicView({
  asset,
  router,
}: {
  asset: Asset;
  router: ReturnType<typeof useRouter>;
}) {
  const assessments = useQuery(
    api.assessments.queries.listByAsset,
    { assetId: asset._id },
  );
  const latest = assessments && assessments.length > 0 ? assessments[0] : null;
  const photoUrls = useQuery(
    api.storage.getUrls,
    latest && latest.photoStorageIds.length > 0
      ? { storageIds: latest.photoStorageIds }
      : "skip",
  );
  const assetImageUrl = photoUrls?.[0] ?? null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{asset.name}</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>

      <Pressable
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.push("/sign-in" as never)}
      >
        <Text style={styles.buttonTitleSecondary}>Sign in for more</Text>
        <Text style={styles.buttonHintSecondary}>
          View full history, inspect, and report problems
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/inspection/${asset._id}` as never)}
      >
        <Text style={styles.buttonTitle}>Inspect</Text>
        <Text style={styles.buttonHint}>
          Take photos and submit a routine inspection
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/report/${asset._id}` as never)}
      >
        <Text style={styles.buttonTitle}>Report a problem</Text>
        <Text style={styles.buttonHint}>
          Take photo of issue and submit a report
        </Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Asset overview</Text>
      <View style={styles.publicCard}>
        {assetImageUrl ? (
          <Image
            source={{ uri: assetImageUrl }}
            style={styles.assetImage}
            resizeMode="cover"
          />
        ) : null}
        {asset.manufacturer ? (
          <DetailRow label="Manufacturer" value={asset.manufacturer} />
        ) : null}
        {asset.model ? (
          <DetailRow label="Model" value={asset.model} />
        ) : null}
        {asset.locationText ? (
          <DetailRow label="Location" value={asset.locationText} />
        ) : null}
        {latest?.aiAnalysis?.summary ? (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>
              {latest.intent === "routine" ? "Latest inspection" : "Latest report"}
            </Text>
            <Text style={styles.summaryText}>
              {latest.aiAnalysis.summary}
            </Text>
            <Text style={styles.summaryDate}>
              {new Date(latest.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ) : latest?.notes ? (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Latest notes</Text>
            <Text style={styles.summaryText}>{latest.notes}</Text>
            <Text style={styles.summaryDate}>
              {new Date(latest.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
        {!latest && (
          <Text style={styles.empty}>No inspections or reports yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.background,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.textMuted,
    marginTop: 24,
    marginBottom: 8,
  },
  detailsCard: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  publicCard: {
    backgroundColor: theme.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  assetImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 8,
    backgroundColor: theme.background,
    marginBottom: 16,
  },
  detailRow: { marginBottom: 12 },
  detailLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 2,
  },
  detailValue: { fontSize: 15, color: theme.text },
  summarySection: { marginTop: 12 },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textMuted,
    marginBottom: 4,
  },
  summaryText: { fontSize: 15, color: theme.text, lineHeight: 22 },
  summaryDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 8,
  },
  empty: { fontSize: 14, color: theme.textMuted },
  card: {
    backgroundColor: theme.backgroundElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  cardDate: { fontSize: 13, color: theme.textMuted },
  photos: { marginBottom: 12 },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: theme.backgroundCard,
  },
  notes: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
  },
  button: {
    backgroundColor: theme.buttonPrimary,
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  buttonMaintenance: {
    backgroundColor: theme.success,
    borderColor: "transparent",
  },
  buttonSecondary: {
    backgroundColor: theme.backgroundCard,
    borderWidth: 1,
    borderColor: theme.border,
  },
  buttonTitle: {
    color: theme.buttonTextOnPrimary,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  buttonHint: {
    color: "rgba(13, 17, 23, 0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  buttonTitleSecondary: {
    color: theme.text,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  buttonHintSecondary: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  buttonText: {
    color: theme.text,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  buttonTextPrimary: {
    color: theme.buttonTextOnPrimary,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
});
