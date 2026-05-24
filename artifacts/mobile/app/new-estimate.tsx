import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContractorProfile } from "@/context/ContractorProfileContext";
import { useEstimates, type Estimate, type LaborEstimate, type MaterialItem } from "@/context/EstimatesContext";
import { useColors } from "@/hooks/useColors";

const EXAMPLE_JOBS = [
  "Replace 200 sq ft of damaged drywall in a basement",
  "Build a 12x16 ft wood deck with pressure treated lumber",
  "Install ceramic tile flooring in a 150 sq ft bathroom",
  "Repaint the interior of a 1,200 sq ft house (walls only)",
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export default function NewEstimateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addEstimate } = useEstimates();
  const { profile, isProfileSet, totalYearsExperience } = useContractorProfile();

  const [jobDescription, setJobDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleGenerate = async () => {
    const desc = jobDescription.trim();
    if (desc.length < 10) {
      Alert.alert("Too short", "Please describe the job in a bit more detail.");
      return;
    }

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    setLoadingStep("Analyzing job description...");

    try {
      setLoadingStep(isProfileSet ? "Generating material & labor estimates..." : "Generating material list...");

      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const base = domain ? `https://${domain}` : "";

      const body: Record<string, unknown> = {
        jobDescription: desc,
        location: location.trim() || null,
      };
      if (isProfileSet) {
        body.hourlyRate = parseFloat(profile.hourlyRate);
        body.yearsExperience = totalYearsExperience;
      }

      const response = await fetch(`${base}/api/estimates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setLoadingStep("Looking up current prices...");

      if (!response.ok) {
        const err = (await response.json()) as { message?: string };
        throw new Error(err.message ?? "Request failed");
      }

      const data = (await response.json()) as {
        jobSummary: string;
        materials: MaterialItem[];
        grandTotal: number;
        laborEstimate: LaborEstimate | null;
        disclaimer: string;
      };

      const estimate: Estimate = {
        id: generateId(),
        jobDescription: desc,
        jobSummary: data.jobSummary,
        materials: data.materials,
        grandTotal: data.grandTotal,
        laborEstimate: data.laborEstimate ?? null,
        markup: 0,
        disclaimer: data.disclaimer,
        createdAt: new Date().toISOString(),
      };

      await addEstimate(estimate);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/estimate/${estimate.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      Alert.alert("Error", `Failed to generate estimate: ${msg}`);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleExample = (text: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setJobDescription(text);
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.navyDeep }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>New Estimate</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Contractor profile strip */}
        <Pressable
          onPress={() => router.push("/profile")}
          style={({ pressed }) => [
            styles.profileStrip,
            {
              backgroundColor: isProfileSet ? colors.accent : colors.muted,
              borderColor: isProfileSet ? colors.orangeLight : colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.profileIconWrap, { backgroundColor: isProfileSet ? colors.primary : colors.mutedForeground }]}>
            <Feather name="user" size={14} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            {isProfileSet ? (
              <>
                <Text style={[styles.profileStripTitle, { color: colors.foreground }]}>
                  Labor estimate included
                </Text>
                <Text style={[styles.profileStripSub, { color: colors.mutedForeground }]}>
                  ${parseFloat(profile.hourlyRate).toFixed(0)}/hr · {
                    totalYearsExperience < 1
                      ? `${Math.round(totalYearsExperience * 12)} months exp.`
                      : `${Math.round(totalYearsExperience * 10) / 10} yrs exp.`
                  }
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.profileStripTitle, { color: colors.foreground }]}>
                  No profile set — materials only
                </Text>
                <Text style={[styles.profileStripSub, { color: colors.mutedForeground }]}>
                  Tap to add your rate & experience for labor estimates
                </Text>
              </>
            )}
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        {/* Job description */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Describe the job</Text>
          <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>
            Be specific — include dimensions, materials, and scope for better accuracy
          </Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.textarea,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="e.g. Replace rotted wood siding on the north side of a 2,000 sq ft house with Hardie board cement siding…"
            placeholderTextColor={colors.mutedForeground}
            value={jobDescription}
            onChangeText={setJobDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Location{" "}
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              (optional)
            </Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="e.g. Texas, California, New York"
            placeholderTextColor={colors.mutedForeground}
            value={location}
            onChangeText={setLocation}
            editable={!loading}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Helps with regional price adjustments
          </Text>
        </View>

        {/* Example jobs */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Example jobs</Text>
          {EXAMPLE_JOBS.map((ex) => (
            <Pressable
              key={ex}
              onPress={() => handleExample(ex)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: colors.card,
                  borderColor: pressed ? colors.primary : colors.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather name="chevron-right" size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{ex}</Text>
            </Pressable>
          ))}
        </View>

        {/* Generate button */}
        <Pressable
          onPress={handleGenerate}
          disabled={loading || jobDescription.trim().length < 10}
          style={({ pressed }) => [
            styles.generateBtn,
            {
              backgroundColor: jobDescription.trim().length < 10 ? colors.muted : colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {loading ? (
            <View style={styles.btnRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.generateBtnText}>{loadingStep}</Text>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Feather name="zap" size={18} color="#fff" />
              <Text style={styles.generateBtnText}>
                {isProfileSet ? "Generate Material & Labor Estimate" : "Generate Estimate"}
              </Text>
            </View>
          )}
        </Pressable>

        {!loading && (
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
            {isProfileSet
              ? "AI-powered estimate with personalized labor costs"
              : "AI-powered estimate using current Home Depot & Lowe's pricing"}
          </Text>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 22,
  },
  profileStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  profileIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  profileStripTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  profileStripSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  section: { gap: 8 },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sublabel: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: 48,
  },
  hint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  chipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  generateBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  generateBtnText: { color: "#ffffff", fontSize: 16, fontFamily: "Inter_700Bold" },
  footerNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    marginTop: -8,
  },
});
