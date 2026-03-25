import { Stack } from "expo-router";

export default function PersonalLayout() {
  return (
    <Stack>
      <Stack.Screen name="add-medication" options={{ title: "Thêm thuốc", headerBackTitle: "Quay lại" }} />
      <Stack.Screen
        name="medication/[id]"
        options={{ title: "Chi tiết thuốc", headerBackTitle: "Quay lại" }}
      />
      <Stack.Screen
        name="edit-medication/[id]"
        options={{ title: "Chỉnh sửa thuốc", headerBackTitle: "Quay lại" }}
      />
    </Stack>
  );
}
