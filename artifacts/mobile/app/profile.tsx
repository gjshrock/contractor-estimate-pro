import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContractorProfile } from "@/context/ContractorProfileContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useContractorProfile();

  const [hourlyRate, setHourlyRate] = useState(profile.hourlyRate);
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears);
  const [experienceMonths, setExperienceMonths] = useState(profile.experienceMonths);

  useEffect(() => {
    setHourlyRate(profile.hourlyRate);
    setExperienceYears(profile.experienceYears);
    setExperienceMonths(profile.experienceMonths);
  }, [profile]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalYears =
    (parseFloat(experienceYears) || 0) +
    (parseFloat(experienceMonths) || 0) / 12;

  function getExperienceLabel(years: number) {
    if (years < 1) return "Beginner — still building speed";
    if (years < 3) return "Developing — getting up to pace";
    if (years < 7) return "Experienced — industry average";
    if (years < 15) return "Seasoned pro — working faster than average";
    return "Expert — top efficiency";
  }

  function getSpeedNote(years: number) {
    if (years < 1) return "~40% more time than average";
    if (years < 3) return "~20% more time than average";
    if (years < 7) return "At industry average speed";
    if (years < 15) return "~15% faster than average";
    return "~25% faster than average";
  }

  const handleSave = async () => {
    const rate = parseFloat(hourlyRate);
    if (!hourlyRate || isNaN(rate) || rate <= 0) {
      Alert.alert("Invalid rate", "Please enter a valid hourly rate.");
      return;
    }
    const months = parseFloat(experienceMonths) || 0;
    if (months < 0 || months > 11) {
      Alert.alert("Invalid months", "Months must be between 0 and 11.");
      return;
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setProfile({ hourlyRate, experienceYears, experienceMonths });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.navyDeep }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Intro */}
        <View style={[styles.infoCard, { backgroundColor: colors.accent, borderColor: colors.orangeLight }]}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Your profile is used to estimate how long a job will take you personally, factoring in your experience and rate.
          </Text>
        </View>

        {/* Hourly Rate */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Hourly Rate</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.prefix, { color: colors.mutedForeground }]}>$</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="65"
              placeholderTextColor={colors.mutedForeground}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <Text style={[styles.suffix, { color: colors.mutedForeground }]}>/hr</Text>
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>Years of Experience</Text>
          <View style={styles.expRow}>
            <View style={[styles.expField, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.expInput, { color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
                returnKeyType="done"
              />
              <Text style={[styles.expUnit, { color: colors.mutedForeground }]}>yrs</Text>
            </View>
            <View style={[styles.expField, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.expInput, { color: colors.foreground }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                value={experienceMonths}
                onChangeText={setExperienceMonths}
                keyboardType="number-pad"
                returnKeyType="done"
              />
              <Text style={[styles.expUnit, { color: colors.mutedForeground }]}>mo</Text>
            </View>
          </View>

          {/* Experience tier indicator */}
          {totalYears >= 0 && (
            <View style={[styles.tierCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.tierRow}>
                <Feather name="award" size={14} color={colors.primary} />
                <Text style={[styles.tierLabel, { color: colors.foreground }]}>
                  {getExperienceLabel(totalYears)}
                </Text>
              </View>
              <Text style={[styles.tierNote, { color: colors.mutedForeground }]}>
                {getSpeedNote(totalYears)}
              </Text>
            </View>
          )}
        </View>

        {/* Preview */}
        {parseFloat(hourlyRate) > 0 && (
          <View style={[styles.previewCard, { backgroundColor: colors.navyDeep }]}>
            <Text style={styles.previewTitle}>How it works</Text>
            <Text style={styles.previewText}>
              When you generate an estimate, the AI will calculate the baseline hours for an average contractor, then adjust for your {totalYears < 1 ? "experience level" : `${Math.round(totalYears * 10) / 10} years of experience`} — giving you a personalized time and cost estimate.
            </Text>
            <View style={styles.previewDivider} />
            <Text style={styles.previewRate}>
              Your rate: ${parseFloat(hourlyRate).toFixed(2)}/hr
            </Text>
          </View>
        )}

        {/* Save */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Profile</Text>
        </Pressable>
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
    paddingTop: 24,
    paddingHorizontal: 16,
    gap: 24,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  section: { gap: 10 },
  label: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 4,
  },
  prefix: {
    fontSize: 18,
    fontFamily: "Inter_500Medium",
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    padding: 0,
  },
  suffix: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  expRow: {
    flexDirection: "row",
    gap: 12,
  },
  expField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  expInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    padding: 0,
  },
  expUnit: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  tierCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tierLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tierNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: 20,
  },
  previewCard: {
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  previewText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
  previewDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 4,
  },
  previewRate: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#f97316",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
  },
});
