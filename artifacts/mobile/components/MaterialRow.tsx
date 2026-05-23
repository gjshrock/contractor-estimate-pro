import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { MaterialItem } from "@/context/EstimatesContext";

const CATEGORY_COLORS: Record<string, string> = {
  Lumber: "#92400e",
  Drywall: "#1e40af",
  Hardware: "#374151",
  Paint: "#7c3aed",
  Concrete: "#6b7280",
  Flooring: "#b45309",
  Roofing: "#991b1b",
  Plumbing: "#0e7490",
  Electrical: "#d97706",
  Fasteners: "#4b5563",
  Insulation: "#15803d",
  Framing: "#92400e",
  Masonry: "#78350f",
  Default: "#64748b",
};

const CATEGORY_BG: Record<string, string> = {
  Lumber: "#fef3c7",
  Drywall: "#dbeafe",
  Hardware: "#f3f4f6",
  Paint: "#ede9fe",
  Concrete: "#f9fafb",
  Flooring: "#fef3c7",
  Roofing: "#fee2e2",
  Plumbing: "#cffafe",
  Electrical: "#fef3c7",
  Fasteners: "#f3f4f6",
  Insulation: "#dcfce7",
  Framing: "#fef3c7",
  Masonry: "#fef3c7",
  Default: "#f8fafc",
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Default;
}

function getCategoryBg(category: string) {
  return CATEGORY_BG[category] ?? CATEGORY_BG.Default;
}

interface Props {
  item: MaterialItem;
  onRemove?: (id: string) => void;
  isLast?: boolean;
}

export function MaterialRow({ item, onRemove, isLast }: Props) {
  const colors = useColors();
  const catColor = getCategoryColor(item.category);
  const catBg = getCategoryBg(item.category);

  const handleRemove = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onRemove?.(item.id);
  };

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.badge, { backgroundColor: catBg }]}>
          <Text style={[styles.badgeText, { color: catColor }]}>
            {item.category}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {item.name}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {item.description}
        </Text>
        <View style={styles.qtyRow}>
          <Text style={[styles.qty, { color: colors.mutedForeground }]}>
            {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)} @ {item.storeName}
          </Text>
        </View>
        {item.notes ? (
          <Text style={[styles.notes, { color: colors.mutedForeground }]}>
            Note: {item.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={[styles.total, { color: colors.foreground }]}>
          ${item.totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        {onRemove && (
          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={10}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "flex-start",
  },
  left: {
    flex: 1,
    gap: 3,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  qty: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  notes: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
    minWidth: 72,
  },
  total: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  removeBtn: {
    padding: 4,
  },
});
