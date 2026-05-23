import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Estimate } from "@/context/EstimatesContext";

interface Props {
  estimate: Estimate;
  onDelete: (id: string) => void;
}

export function EstimateCard({ estimate, onDelete }: Props) {
  const colors = useColors();

  const formattedDate = new Date(estimate.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push(`/estimate/${estimate.id}`);
  };

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(estimate.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
          <Feather name="clipboard" size={18} color={colors.primary} />
        </View>
        <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={12}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {estimate.jobDescription}
      </Text>

      <Text
        style={[styles.summary, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {estimate.jobSummary}
      </Text>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Feather name="package" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {estimate.materials.length} items
          </Text>
        </View>
        <View style={styles.meta}>
          <Feather name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {formattedDate}
          </Text>
        </View>
        <View style={[styles.totalBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.totalText, { color: colors.primary }]}>
            ${estimate.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    padding: 4,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  summary: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
    flexWrap: "wrap",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  totalBadge: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  totalText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
