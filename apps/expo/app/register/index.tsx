import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";

type Step = "photo" | "suggesting" | "edit" | "creating" | "template" | "done";

/**
 * Register a new asset.
 * Flow: 1) Take photo 2) AI suggests details 3) User edits 4) Create 5) Optional template
 * After creation, write venturai.app/a/<assetId> to the NFC tag.
 */
export default function RegisterAssetScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("photo");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    maintenanceGroupId: "",
    manufacturer: "",
    model: "",
    serial: "",
  });
  const [createdAssetId, setCreatedAssetId] = useState<string | null>(null);

  const adminOrgs = useQuery(api.org_members.getOrgsUserIsAdminOf);
  const maintenanceGroups = useQuery(
    api.maintenance_groups.listByOrg,
    selectedOrgId ? { orgId: selectedOrgId as Id<"orgs"> } : "skip",
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const suggestFromPhoto = useAction(api.assets.actions.suggestFromPhoto);
  const createAsset = useMutation(api.assets.mutations.create);
  const createTemplate = useMutation(api.templates.create);
  const updateAssetTemplate = useMutation(api.assets.mutations.updateTemplate);

  if (adminOrgs === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!adminOrgs?.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cannot register</Text>
        <Text style={styles.subtitle}>
          Sign in and create an org, or have an admin add you to one.
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "photo") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Register asset</Text>
        <Text style={styles.subtitle}>
          Take a photo of the asset. AI will suggest details.
        </Text>
        <Text style={styles.placeholder}>
          Take a photo, upload to storage, then AI suggests details. (Camera +
          storage upload coming soon.)
        </Text>
        <Pressable
          style={styles.button}
          onPress={async () => {
            const orgId = adminOrgs[0]?._id;
            if (!orgId) return;
            setSelectedOrgId(orgId);
            try {
              const url = await generateUploadUrl();
              const blob = new Blob(["x"], { type: "image/jpeg" });
              const resp = await fetch(url, { method: "POST", body: blob });
              const { storageId } = (await resp.json()) as { storageId: string };
              if (storageId) {
                setStep("suggesting");
                const result = await suggestFromPhoto({
                  orgId,
                  photoStorageId: storageId as Id<"_storage">,
                });
                setForm({
                  name: result.name,
                  maintenanceGroupId: result.maintenanceGroupId,
                  manufacturer: result.manufacturer ?? "",
                  model: result.model ?? "",
                  serial: result.serial ?? "",
                });
                setStep("edit");
              }
            } catch {
              setStep("photo");
            }
          }}
        >
          <Text style={styles.buttonText}>Take photo & get AI suggestion</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => {
            const orgId = adminOrgs[0]?._id;
            if (!orgId) return;
            setSelectedOrgId(orgId);
            setStep("edit");
            setForm({
              name: "New Asset",
              maintenanceGroupId: "",
              manufacturer: "",
              model: "",
              serial: "",
            });
          }}
        >
          <Text style={styles.buttonText}>Skip: enter manually</Text>
        </Pressable>
      </View>
    );
  }

  if (step === "suggesting") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>AI is analyzing the photo...</Text>
      </View>
    );
  }

  if (step === "edit") {
    const groups = maintenanceGroups ?? [];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Edit asset details</Text>
        <Text style={styles.subtitle}>Review and adjust AI suggestions.</Text>

        {groups.length > 0 && !form.maintenanceGroupId && (
          <>
            <Text style={styles.label}>Maintenance group</Text>
            <View style={styles.groupList}>
              {groups.map((g) => (
                <Pressable
                  key={g._id}
                  style={[
                    styles.groupOption,
                    (form.maintenanceGroupId || groups[0]?._id) === g._id &&
                      styles.groupOptionSelected,
                  ]}
                  onPress={() =>
                    setForm((f) => ({ ...f, maintenanceGroupId: g._id }))
                  }
                >
                  <Text style={styles.groupName}>{g.name}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Asset name"
        />
        <Text style={styles.label}>Manufacturer</Text>
        <TextInput
          style={styles.input}
          value={form.manufacturer}
          onChangeText={(v) => setForm((f) => ({ ...f, manufacturer: v }))}
          placeholder="Optional"
        />
        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          value={form.model}
          onChangeText={(v) => setForm((f) => ({ ...f, model: v }))}
          placeholder="Optional"
        />
        <Text style={styles.label}>Serial</Text>
        <TextInput
          style={styles.input}
          value={form.serial}
          onChangeText={(v) => setForm((f) => ({ ...f, serial: v }))}
          placeholder="Optional"
        />

        <Pressable
          style={styles.button}
          disabled={!form.maintenanceGroupId && !groups[0]?._id}
          onPress={async () => {
            if (!selectedOrgId) return;
            const mgId = form.maintenanceGroupId || groups[0]?._id;
            if (!mgId) return;
            setStep("creating");
            try {
              const assetId = await createAsset({
                orgId: selectedOrgId as Id<"orgs">,
                maintenanceGroupId: mgId as Id<"maintenanceGroups">,
                name: form.name,
                manufacturer: form.manufacturer || undefined,
                model: form.model || undefined,
                serial: form.serial || undefined,
              });
              setCreatedAssetId(assetId);
              setStep("template");
            } catch {
              setStep("edit");
            }
          }}
        >
          <Text style={styles.buttonText}>Create asset</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (step === "creating") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Creating asset...</Text>
      </View>
    );
  }

  if (step === "template") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Assessment template</Text>
        <Text style={styles.subtitle}>
          Optionally define photo descriptions and questions for inspections.
          Skip to use defaults (at least 1 photo, optional notes).
        </Text>
        <Pressable
          style={styles.button}
          onPress={async () => {
            if (!selectedOrgId || !createdAssetId) return;
            const templateId = await createTemplate({
              orgId: selectedOrgId as Id<"orgs">,
              name: `Template for ${form.name}`,
              photoDescriptions: ["Wide shot", "Close-up of area of concern"],
              additionalQuestions: [
                {
                  key: "condition",
                  label: "Overall condition (1-5)",
                  type: "number",
                },
              ],
            });
            await updateAssetTemplate({
              assetId: createdAssetId as Id<"assets">,
              templateId,
            });
            setStep("done");
          }}
        >
          <Text style={styles.buttonText}>Create template (recommended)</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setStep("done")}
        >
          <Text style={styles.buttonText}>Skip for now</Text>
        </Pressable>
      </View>
    );
  }

  const url = createdAssetId
    ? `venturai.app/a/${createdAssetId}`
    : "venturai.app/a/<assetId>";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset registered</Text>
      <Text style={styles.subtitle}>
        Write this URL to the NFC tag: {url}
      </Text>
      <Pressable
        style={styles.button}
        onPress={() =>
          router.replace(
            (createdAssetId ? `/a/${createdAssetId}` : "/") as never,
          )
        }
      >
        <Text style={styles.buttonText}>Open asset dashboard</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: { flex: 1, padding: 24 },
  pad: { paddingBottom: 48 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  placeholder: { fontSize: 14, color: "#94a3b8", marginBottom: 16 },
  hint: { marginTop: 12, fontSize: 14, color: "#64748b" },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonSecondary: { backgroundColor: "#64748b" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  groupList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  groupOption: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  groupOptionSelected: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  groupName: { fontSize: 14 },
});
