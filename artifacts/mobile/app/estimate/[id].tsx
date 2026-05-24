import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialRow } from "@/components/MaterialRow";
import { useEstimates, type LaborEstimate } from "@/context/EstimatesContext";
import { useColors } from "@/hooks/useColors";

function LaborSection({ labor }: { labor: LaborEstimate }) {
  const colors = useColors();
  const speedPct = Math.round(Math.abs(1 - labor.experienceMultiplier) * 100);
  const isFaster = labor.experienceMultiplier < 1;

  return (
    <View style={[laborStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[laborStyles.header, { backgroundColor: colors.navyDeep }]}>
        <View style={laborStyles.headerLeft}>
          <Feather name="clock" size={16} color="#fff" />
          <Text style={laborStyles.headerTitle}>Labor Estimate</Text>
        </View>
        <Text style={laborStyles.headerTotal}>
          ${labor.totalLaborCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Experience note */}
      <View style={[laborStyles.noteRow, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
        <Feather name="award" size={13} color={colors.primary} />
        <Text style={[laborStyles.noteText, { color: colors.foreground }]}>
          {labor.experienceNote}
        </Text>
      </View>

      {/* Hours summary */}
      <View style={[laborStyles.hoursRow, { borderBottomColor: colors.border }]}>
        <View style={laborStyles.hoursCell}>
          <Text style={[laborStyles.hoursCellLabel, { color: colors.mutedForeground }]}>Base hours</Text>
          <Text style={[laborStyles.hoursCellVal, { color: colors.foreground }]}>
            {labor.baseHours.toFixed(1)}h
          </Text>
        </View>
        <View style={[laborStyles.hoursDivider, { backgroundColor: colors.border }]} />
        <View style={laborStyles.hoursCell}>
          <Text style={[laborStyles.hoursCellLabel, { color: colors.mutedForeground }]}>
            Experience adjustment
          </Text>
          <Text style={[laborStyles.hoursCellVal, { color: isFaster ? colors.success : colors.destructive }]}>
            {isFaster ? `-${speedPct}%` : `+${speedPct}%`}
          </Text>
        </View>
        <View style={[laborStyles.hoursDivider, { backgroundColor: colors.border }]} />
        <View style={laborStyles.hoursCell}>
          <Text style={[laborStyles.hoursCellLabel, { color: colors.mutedForeground }]}>Your hours</Text>
          <Text style={[laborStyles.hoursCellVal, { color: colors.primary }]}>
            {labor.adjustedHours.toFixed(1)}h
          </Text>
        </View>
      </View>

      {/* Task breakdown */}
      <View style={laborStyles.breakdown}>
        <Text style={[laborStyles.breakdownTitle, { color: colors.mutedForeground }]}>
          TASK BREAKDOWN
        </Text>
        {labor.breakdown.map((task, idx) => (
          <View
            key={idx}
            style={[
              laborStyles.taskRow,
              idx < labor.breakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[laborStyles.taskName, { color: colors.foreground }]}>
              {task.task}
            </Text>
            <Text style={[laborStyles.taskHours, { color: colors.mutedForeground }]}>
              {task.hours.toFixed(1)}h
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getEstimate, removeMaterialFromEstimate } = useEstimates();

  const estimateData = getEstimate(id ?? "");
  const [materials, setMaterials] = useState(estimateData?.materials ?? []);
  const [grandTotal, setGrandTotal] = useState(estimateData?.grandTotal ?? 0);

  useEffect(() => {
    if (estimateData) {
      setMaterials(estimateData.materials);
      setGrandTotal(estimateData.grandTotal);
    }
  }, [estimateData]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!estimateData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.navyDeep }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Estimate</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Estimate not found</Text>
        </View>
      </View>
    );
  }

  const handleRemoveMaterial = (materialId: string) => {
    Alert.alert("Remove Item", "Remove this material from the estimate?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (Platform.OS !== "web")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await removeMaterialFromEstimate(id!, materialId);
          const updated = materials.filter((m) => m.id !== materialId);
          const newTotal =
            Math.round(updated.reduce((sum, m) => sum + m.totalPrice, 0) * 100) / 100;
          setMaterials(updated);
          setGrandTotal(newTotal);
        },
      },
    ]);
  };

  const grouped = materials.reduce<Record<string, typeof materials>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const formattedDate = new Date(estimateData.createdAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const labor = estimateData.laborEstimate;
  const combinedTotal = grandTotal + (labor?.totalLaborCost ?? 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.navyDeep }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Estimate</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Job summary card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.navyDeep }]}>
          <Text style={styles.summaryDate}>{formattedDate}</Text>
          <Text style={styles.summaryJob} numberOfLines={3}>{estimateData.jobDescription}</Text>
          <Text style={styles.summaryText} numberOfLines={4}>{estimateData.jobSummary}</Text>
        </View>

        {/* Total banner */}
        {labor ? (
          /* Split view: materials + labor + combined */
          <View style={styles.totalsRow}>
            <View style={[styles.totalCard, { backgroundColor: colors.secondary }]}>
              <Text style={styles.totalCardLabel}>Materials</Text>
              <Text style={styles.totalCardAmount}>
                ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.totalCardSub}>{materials.length} items</Text>
            </View>
            <View style={[styles.totalCard, { backgroundColor: colors.navyMid }]}>
              <Text style={styles.totalCardLabel}>Labor</Text>
              <Text style={styles.totalCardAmount}>
                ${labor.totalLaborCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={styles.totalCardSub}>{labor.adjustedHours.toFixed(1)} hrs</Text>
            </View>
            <View style={[styles.totalCombined, { backgroundColor: colors.primary }]}>
              <Text style={styles.combinedLabel}>Total Quote</Text>
              <Text style={styles.combinedAmount}>
                ${combinedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        ) : (
          /* Materials only banner */
          <View style={[styles.totalBanner, { backgroundColor: colors.primary }]}>
            <View>
              <Text style={styles.totalLabel}>Estimated Materials Total</Text>
              <Text style={styles.totalAmount}>
                ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.totalMeta}>
              <Text style={styles.totalItems}>{materials.length} items</Text>
              <Feather name="tool" size={20} color="rgba(255,255,255,0.6)" />
            </View>
          </View>
        )}

        {/* Labor section */}
        {labor && <LaborSection labor={labor} />}

        {/* Materials by category */}
        {Object.entries(grouped).map(([category, items]) => (
          <View
            key={category}
            style={[styles.categorySection, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.categoryHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.categoryTitle, { color: colors.foreground }]}>{category}</Text>
              <Text style={[styles.categoryTotal, { color: colors.mutedForeground }]}>
                ${items.reduce((s, m) => s + m.totalPrice, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            {items.map((item, idx) => (
              <MaterialRow
                key={item.id}
                item={item}
                onRemove={handleRemoveMaterial}
                isLast={idx === items.length - 1}
              />
            ))}
          </View>
        ))}

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            {estimateData.disclaimer}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const laborStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerTotal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#f97316",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  hoursRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  hoursCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  hoursDivider: {
    width: 1,
    marginVertical: 10,
  },
  hoursCellLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  hoursCellVal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  breakdown: {
    padding: 16,
    gap: 0,
  },
  breakdownTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  taskName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  taskHours: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    minWidth: 36,
    textAlign: "right",
  },
});

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
    flex: 1,
    textAlign: "center",
  },
  scroll: { gap: 16, paddingTop: 16, paddingHorizontal: 16 },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  summaryDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  summaryJob: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    lineHeight: 24,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    lineHeight: 18,
  },
  // Split totals row (with labor)
  totalsRow: {
    gap: 10,
  },
  totalCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  totalCardAmount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
  totalCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  totalCombined: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  combinedLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.85)",
  },
  combinedAmount: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  // Materials-only banner
  totalBanner: {
    borderRadius: 14,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  totalAmount: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -1,
    marginTop: 2,
  },
  totalMeta: { alignItems: "flex-end", gap: 4 },
  totalItems: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  categorySection: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryTotal: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
});
