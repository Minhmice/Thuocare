import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import { Sheet as SheetPrimitive, SheetProps } from "../../ui/sheet";
import { Typography } from "../typography";

export interface SheetWrapperProps extends SheetProps {
  title?: string;
  scrollable?: boolean;
}

export const Sheet: React.FC<SheetWrapperProps> = ({
  title,
  scrollable = true,
  children,
  ...props
}) => {
  const theme = useTheme();

  return (
    <SheetPrimitive {...props}>
      {title && (
        <Typography variant="headline-sm" weight="bold" style={styles.title}>
          {title}
        </Typography>
      )}
      {scrollable ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SheetPrimitive>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
    textAlign: "center"
  },
  scrollContent: {
    paddingBottom: 24
  },
  content: {
    flex: 1
  }
});
