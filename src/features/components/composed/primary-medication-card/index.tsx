import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "../../wrapper/icon";
import { Typography } from "../../wrapper/typography";
import type { PrimaryMedicationCardProps } from "./types";

export const PrimaryMedicationCard: React.FC<PrimaryMedicationCardProps> = ({
  name,
  dosageNote,
  benefitText,
  imagePlaceholder,
}) => (
  <View style={styles.card}>
    <View style={styles.body}>
      {dosageNote ? (
        <Typography variant="label-sm" weight="semi-bold" style={styles.note}>
          {dosageNote}
        </Typography>
      ) : null}
      <Typography variant="title-lg" weight="bold" style={styles.name} numberOfLines={2}>
        {name}
      </Typography>
      {benefitText ? (
        <Typography variant="body-sm" style={styles.benefit}>
          {benefitText}
        </Typography>
      ) : null}
    </View>
    <View style={styles.imageSlot}>
      {imagePlaceholder ?? <Icon name="pill" size={32} color="rgba(0, 88, 188, 0.30)" />}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 120,
    // Add shadow to prevent bleed-through in animated layers
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  body: {
    flex: 1,
    gap: 4,
    marginRight: 16,
  },
  note: {
    color: "rgba(0, 88, 188, 0.70)",
    letterSpacing: 0.2,
  },
  name: {
    color: "#1A1C1F",
    letterSpacing: -0.3,
  },
  benefit: {
    color: "#5F6673",
  },
  imageSlot: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#F3F7FC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5EDF6",
    flexShrink: 0,
  },
});
