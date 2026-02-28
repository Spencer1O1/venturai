import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";

import { theme } from "../../lib/theme";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * View history and most recent report (maintenance workers).
 * Shows assessments with photos.
 */
function AssessmentCard({
  assessment,
}: {
  assessment: {
    _id: Id<"assessments">;
    intent: "routine" | "problem";
    photoStorageIds: Id<"_storage">[];
    notes?: string;
    createdAt: number;
  };
}) {
  const photoUrls = useQuery(
    api.storage.getUrls,
    assessment.photoStorageIds.length > 0
      ? { storageIds: assessment.photoStorageIds }
      : "skip",
  );

  const intentLabel = assessment.intent === "routine" ? "Inspection" : "Problem report";
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
      {assessment.notes ? (
        <Text style={styles.notes}>{assessment.notes}</Text>
      ) : null}
    </View>
  );
}

export default function ViewHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = id as Id<"assets">;

  const asset = useQuery(
    api.assets.queries.getById,
    id ? { assetId } : "skip",
  );
  const assessments = useQuery(
    api.assessments.queries.listByAsset,
    id ? { assetId } : "skip",
  );

  if (asset === undefined || assessments === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (asset === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Asset not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{asset.name}</Text>
      <Text style={styles.subtitle}>Assessment history</Text>

      {assessments.length === 0 ? (
        <Text style={styles.empty}>No inspections or problem reports yet.</Text>
      ) : (
        assessments.map((a) => (
          <AssessmentCard key={a._id} assessment={a} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.background,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 20,
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
});
