import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EstimateCard } from "@/components/EstimateCard";
import { useEstimates } from "@/context/EstimatesContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { estimates, removeEstimate } = useEstimates();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return estimates;
    return estimates.filter(
      (e) =>
        e.jobDescription.toLowerCase().includes(q) ||
        e.jobSummary.toLowerCase().includes(q)
    );
  }, [estimates, query]);

  const handleNew = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/new-estimate");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const showSearch = estimates.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.navyDeep },
        ]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Material Estimator</Text>
            <Text style={styles.headerSub}>
              {estimates.length > 0
                ? `${estimates.length} estimate${estimates.length === 1 ? "" : "s"}`
                : "No estimates yet"}
            </Text>
          </View>
          <Pressable
            onPress={handleNew}
            style={({ pressed }) => [
              styles.newBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Search bar — only shown when there are estimates */}
        {showSearch && (
          <View style={[styles.searchRow, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
            <TextInput
              style={[styles.searchInput, { color: "#ffffff" }]}
              placeholder="Search estimates…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <Feather name="x" size={15} color="rgba(255,255,255,0.5)" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={filtered.length > 0}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 16 },
          filtered.length === 0 && styles.emptyList,
        ]}
        renderItem={({ item }) => (
          <EstimateCard estimate={item} onDelete={removeEstimate} />
        )}
        ListEmptyComponent={
          query.length > 0 ? (
            /* No search results */
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="search" size={28} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No matches found
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No estimates match "{query}"
              </Text>
              <Pressable
                onPress={() => setQuery("")}
                style={({ pressed }) => [
                  styles.emptyBtn,
                  { backgroundColor: colors.muted, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.emptyBtnText, { color: colors.foreground }]}>
                  Clear search
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Truly empty */
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
                <Feather name="clipboard" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No estimates yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Describe a job and get an AI-powered material list with real pricing
              </Text>
              <Pressable
                onPress={handleNew}
                style={({ pressed }) => [
                  styles.emptyBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>New Estimate</Text>
              </Pressable>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  list: {
    paddingTop: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
});
