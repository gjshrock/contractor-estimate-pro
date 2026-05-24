import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { useEstimates, type LaborEstimate, type MaterialItem } from "@/context/EstimatesContext";
import { useColors } from "@/hooks/useColors";

// ─── Summary view (screenshot-friendly) ─────────────────────────────────────

function SummaryView({
  materials,
  labor,
  grandTotal,
  onRemove,
}: {
  materials: MaterialItem[];
  labor: LaborEstimate | null;
  grandTotal: number;
  onRemove: (id: string) => void;
}) {
  const colors = useColors();

  // Group by category with subtotals
  const grouped = materials.reduce<Record<string, { items: MaterialItem[]; subtotal: number }>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = { items: [], subtotal: 0 };
      acc[item.category].items.push(item);
      acc[item.category].subtotal += item.totalPrice;
      return acc;
    },
    {}
  );

  const combinedTotal = grandTotal + (labor?.totalLaborCost ?? 0);
  const speedPct = labor
    ? Math.round(Math.abs(1 - labor.experienceMultiplier) * 100)
    : 0;
  const isFaster = labor ? labor.experienceMultiplier < 1 : false;

  return (
    <View style={summaryStyles.root}>
      {/* Category rows */}
      <View style={[summaryStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[summaryStyles.cardHeader, { borderBottomColor: colors.border }]}>
          <Text style={[summaryStyles.cardTitle, { color: colors.foreground }]}>Materials</Text>
          <Text style={[summaryStyles.cardHeaderTotal, { color: colors.mutedForeground }]}>
            ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        {Object.entries(grouped).map(([category, { items, subtotal }], idx, arr) => (
          <View
            key={category}
            style={[
              summaryStyles.catRow,
              idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={summaryStyles.catLeft}>
              <Text style={[summaryStyles.catName, { color: colors.foreground }]}>{category}</Text>
              <Text style={[summaryStyles.catCount, { color: colors.mutedForeground }]}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <Text style={[summaryStyles.catTotal, { color: colors.foreground }]}>
              ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
      </View>

      {/* Labor — customer-facing only shows the cost, no rate/hours/experience */}
      {labor && (
        <View style={[summaryStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={summaryStyles.catRow}>
            <Text style={[summaryStyles.catName, { color: colors.foreground }]}>Labor</Text>
            <Text style={[summaryStyles.catTotal, { color: colors.foreground }]}>
              ${labor.totalLaborCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      )}

      {/* Grand total */}
      <View style={[summaryStyles.totalRow, { backgroundColor: colors.primary }]}>
        <Text style={summaryStyles.totalLabel}>
          {labor ? "Total Quote (Materials + Labor)" : "Materials Total"}
        </Text>
        <Text style={summaryStyles.totalAmount}>
          ${combinedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

// ─── Detail view (expandable per-item) ──────────────────────────────────────

function DetailView({
  materials,
  labor,
  grandTotal,
  onRemove,
}: {
  materials: MaterialItem[];
  labor: LaborEstimate | null;
  grandTotal: number;
  onRemove: (id: string) => void;
}) {
  const colors = useColors();
  const grouped = materials.reduce<Record<string, MaterialItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const combinedTotal = grandTotal + (labor?.totalLaborCost ?? 0);

  return (
    <View style={{ gap: 12 }}>
      {/* Labor detail */}
      {labor && (
        <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[detailStyles.cardHeader, { backgroundColor: colors.navyDeep }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="clock" size={14} color="#fff" />
              <Text style={detailStyles.cardHeaderTitle}>Labor Estimate</Text>
            </View>
            <Text style={detailStyles.cardHeaderAmt}>
              ${labor.totalLaborCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={[detailStyles.noteRow, { backgroundColor: colors.accent, borderBottomColor: colors.border }]}>
            <Feather name="award" size={12} color={colors.primary} />
            <Text style={[detailStyles.noteText, { color: colors.foreground }]}>{labor.experienceNote}</Text>
          </View>
          <View style={[detailStyles.hoursBar, { borderBottomColor: colors.border }]}>
            {[
              { label: "Base hrs", val: `${labor.baseHours.toFixed(1)}h`, color: colors.foreground },
              { label: "Multiplier", val: `×${labor.experienceMultiplier}`, color: colors.mutedForeground },
              { label: "Your hrs", val: `${labor.adjustedHours.toFixed(1)}h`, color: colors.primary },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <View style={[detailStyles.divider, { backgroundColor: colors.border }]} />}
                <View style={detailStyles.hoursCell}>
                  <Text style={[detailStyles.hoursCellVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[detailStyles.hoursCellLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
          {labor.breakdown.map((t, i) => (
            <View
              key={i}
              style={[
                detailStyles.taskRow,
                i < labor.breakdown.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[detailStyles.taskName, { color: colors.foreground }]}>{t.task}</Text>
              <Text style={[detailStyles.taskHours, { color: colors.mutedForeground }]}>{t.hours.toFixed(1)}h</Text>
            </View>
          ))}
        </View>
      )}

      {/* Material categories */}
      {Object.entries(grouped).map(([category, items]) => (
        <View key={category} style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[detailStyles.catHeader, { borderBottomColor: colors.border }]}>
            <Text style={[detailStyles.catTitle, { color: colors.foreground }]}>{category}</Text>
            <Text style={[detailStyles.catTotal, { color: colors.mutedForeground }]}>
              ${items.reduce((s, m) => s + m.totalPrice, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {items.map((item, idx) => (
            <View
              key={item.id}
              style={[
                detailStyles.itemRow,
                idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={detailStyles.itemLeft}>
                <Text style={[detailStyles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[detailStyles.itemDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                <Text style={[detailStyles.itemQty, { color: colors.mutedForeground }]}>
                  {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)} @ {item.storeName}
                </Text>
              </View>
              <View style={detailStyles.itemRight}>
                <Text style={[detailStyles.itemTotal, { color: colors.foreground }]}>
                  ${item.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Pressable
                  onPress={() => onRemove(item.id)}
                  hitSlop={10}
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Feather name="x" size={15} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}

      {/* Combined total */}
      <View style={[detailStyles.totalRow, { backgroundColor: colors.primary }]}>
        <Text style={detailStyles.totalLabel}>
          {labor ? "Total Quote (Materials + Labor)" : "Materials Total"}
        </Text>
        <Text style={detailStyles.totalAmt}>
          ${combinedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getEstimate, removeMaterialFromEstimate } = useEstimates();

  const estimateData = getEstimate(id ?? "");
  const [materials, setMaterials] = useState(estimateData?.materials ?? []);
  const [grandTotal, setGrandTotal] = useState(estimateData?.grandTotal ?? 0);
  const [view, setView] = useState<"summary" | "detail">("summary");

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

  const formattedDate = new Date(estimateData.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const labor = estimateData.laborEstimate;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.navyDeep }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{estimateData.jobDescription}</Text>
          <Text style={styles.headerDate}>{formattedDate}</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* View toggle */}
      <View style={[styles.toggle, { backgroundColor: colors.navyDeep }]}>
        <View style={[styles.toggleInner, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          {(["summary", "detail"] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                setView(v);
              }}
              style={[
                styles.toggleBtn,
                view === v && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  { color: view === v ? "#fff" : "rgba(255,255,255,0.6)" },
                ]}
              >
                {v === "summary" ? "📋 Summary" : "🔍 Full Detail"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {view === "summary" ? (
          <SummaryView
            materials={materials}
            labor={labor}
            grandTotal={grandTotal}
            onRemove={handleRemoveMaterial}
          />
        ) : (
          <DetailView
            materials={materials}
            labor={labor}
            grandTotal={grandTotal}
            onRemove={handleRemoveMaterial}
          />
        )}

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={13} color={colors.mutedForeground} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            {estimateData.disclaimer}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const summaryStyles = StyleSheet.create({
  root: { gap: 10 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardHeaderTotal: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  catLeft: { gap: 1 },
  catName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  catCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  catTotal: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  laborRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 0,
  },
  laborStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  laborStatVal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  laborStatLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  laborDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  laborNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    textAlign: "center",
  },
  totalRow: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    flex: 1,
    paddingRight: 8,
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
});

const detailStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  cardHeaderAmt: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#f97316",
  },
  noteRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  hoursBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  hoursCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
  },
  divider: {
    width: 1,
    marginVertical: 8,
  },
  hoursCellVal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  hoursCellLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  taskName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  taskHours: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  catHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  catTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  catTotal: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  itemRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  itemLeft: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  itemDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  itemQty: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  itemTotal: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  totalRow: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    flex: 1,
    paddingRight: 8,
  },
  totalAmt: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    lineHeight: 20,
  },
  headerDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  toggle: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  toggleInner: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    paddingTop: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
  },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
});
