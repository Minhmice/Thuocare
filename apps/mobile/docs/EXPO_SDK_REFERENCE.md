# Expo SDK — index cho agent & developer

**Scope:** Expo SDK **55** (latest track). Cột **Doc** trỏ tới `https://docs.expo.dev/versions/latest/sdk/<slug>/` (hoặc đường dẫn Router/EAS nêu rõ).  
**Nguồn đầy đủ cho LLM:** [llms-sdk.txt](https://docs.expo.dev/llms-sdk.txt) · [llms.txt](https://docs.expo.dev/llms.txt)

> Nhiều API trên docs là **tên màn / capability**; **package npm** có thể gom (ví dụ cảm biến trong `expo-sensors`). Luôn xem trang doc để biết `npx expo install …` chính xác.

---

## 1. Cấu hình & công cụ (không phải UI component)

| Tài liệu | Ghi chú |
|----------|---------|
| [app.json / app.config.js](https://docs.expo.dev/versions/latest/config/app/) | Cấu hình Expo |
| [babel.config.js](https://docs.expo.dev/versions/latest/config/babel/) | Babel |
| [metro.config.js](https://docs.expo.dev/versions/latest/config/metro/) | Metro |
| [package.json](https://docs.expo.dev/versions/latest/config/package-json/) | Scripts & metadata |

---

## 2. Gói `expo` (runtime chung — không phải “component” UI)

API từ `expo`: `registerRootComponent`, `requireNativeModule`, `reloadAppAsync`, hooks `useEvent` / `useEventListener`, `EventEmitter`, streaming **`expo/fetch`**, `URL` / Streams / `structuredClone`, v.v.

| Doc | Slug |
|-----|------|
| [Expo](https://docs.expo.dev/versions/latest/sdk/expo/) | `expo` |

Cài: đi kèm template; `npx expo install expo`.

---

## 3. Expo SDK — thư viện theo mục lục tài liệu (SDK 55)

Cột **Package** là lệnh cài điển hình; nếu khác, mở cột **Doc**.

### Cảm biến & thiết bị

| Doc (sidebar) | Package (typical) | Doc slug |
|---------------|-------------------|----------|
| Accelerometer | `expo-sensors` | [accelerometer](https://docs.expo.dev/versions/latest/sdk/accelerometer/) |
| Barometer | `expo-sensors` | [barometer](https://docs.expo.dev/versions/latest/sdk/barometer/) |
| DeviceMotion | `expo-sensors` | [devicemotion](https://docs.expo.dev/versions/latest/sdk/devicemotion/) |
| Gyroscope | `expo-sensors` | [gyroscope](https://docs.expo.dev/versions/latest/sdk/gyroscope/) |
| LightSensor | `expo-sensors` | [light-sensor](https://docs.expo.dev/versions/latest/sdk/light-sensor/) |
| Magnetometer | `expo-sensors` | [magnetometer](https://docs.expo.dev/versions/latest/sdk/magnetometer/) |
| Pedometer | `expo-sensors` | [pedometer](https://docs.expo.dev/versions/latest/sdk/pedometer/) |
| Sensors (overview) | `expo-sensors` | [sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) |
| Device | `expo-device` | [device](https://docs.expo.dev/versions/latest/sdk/device/) |
| Battery | `expo-battery` | [battery](https://docs.expo.dev/versions/latest/sdk/battery/) |
| Cellular | `expo-cellular` | [cellular](https://docs.expo.dev/versions/latest/sdk/cellular/) |
| Network | `expo-network` | [network](https://docs.expo.dev/versions/latest/sdk/network/) |
| ScreenOrientation | `expo-screen-orientation` | [screen-orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/) |
| KeepAwake | `expo-keep-awake` | [keep-awake](https://docs.expo.dev/versions/latest/sdk/keep-awake/) |
| Brightness | `expo-brightness` | [brightness](https://docs.expo.dev/versions/latest/sdk/brightness/) |

### Media, hình ảnh, âm thanh, video

| Doc | Package | Doc slug |
|-----|---------|----------|
| Audio (expo-audio) | `expo-audio` | [audio](https://docs.expo.dev/versions/latest/sdk/audio/) |
| Video (expo-video) | `expo-video` | [video](https://docs.expo.dev/versions/latest/sdk/video/) |
| VideoThumbnails (deprecated) | `expo-video-thumbnails` | [video-thumbnails](https://docs.expo.dev/versions/latest/sdk/video-thumbnails/) |
| Image | `expo-image` | [image](https://docs.expo.dev/versions/latest/sdk/image/) |
| ImagePicker | `expo-image-picker` | [imagepicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
| ImageManipulator | `expo-image-manipulator` | [imagemanipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) |
| Camera | `expo-camera` | [camera](https://docs.expo.dev/versions/latest/sdk/camera/) |
| MediaLibrary | `expo-media-library` | [medialibrary](https://docs.expo.dev/versions/latest/sdk/media-library/) |
| MediaLibrary (next) | `expo-media-library` (next API trên doc) | [media-library-next](https://docs.expo.dev/versions/latest/sdk/media-library-next/) |
| LivePhoto | `expo-live-photo` | [live-photo](https://docs.expo.dev/versions/latest/sdk/live-photo/) |

### UI hệ thống, hiệu ứng, graphics

| Doc | Package | Doc slug |
|-----|---------|----------|
| BlurView | `expo-blur` | [blur-view](https://docs.expo.dev/versions/latest/sdk/blur-view/) |
| GlassEffect | `expo-glass-effect` | [glass-effect](https://docs.expo.dev/versions/latest/sdk/glass-effect/) |
| LinearGradient | `expo-linear-gradient` | [linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) |
| MeshGradient | `expo-mesh-gradient` | [mesh-gradient](https://docs.expo.dev/versions/latest/sdk/mesh-gradient/) |
| Symbols | `expo-symbols` | [symbols](https://docs.expo.dev/versions/latest/sdk/symbols/) |
| StatusBar | `expo-status-bar` | [status-bar](https://docs.expo.dev/versions/latest/sdk/status-bar/) |
| NavigationBar | `expo-navigation-bar` | [navigation-bar](https://docs.expo.dev/versions/latest/sdk/navigation-bar/) |
| SystemUI | `expo-system-ui` | [system-ui](https://docs.expo.dev/versions/latest/sdk/system-ui/) |
| GLView | `expo-gl` | [gl-view](https://docs.expo.dev/versions/latest/sdk/gl-view/) |

### Bản đồ & tích hợp (ALPHA / đặc biệt)

| Doc | Package | Doc slug |
|-----|---------|----------|
| Maps | `expo-maps` | [maps](https://docs.expo.dev/versions/latest/sdk/maps/) |

### File, dữ liệu, mật mã

| Doc | Package | Doc slug |
|-----|---------|----------|
| FileSystem | `expo-file-system` | [filesystem](https://docs.expo.dev/versions/latest/sdk/filesystem/) |
| FileSystem (legacy) | `expo-file-system` | [filesystem-legacy](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/) |
| Asset | `expo-asset` | [asset](https://docs.expo.dev/versions/latest/sdk/asset/) |
| DocumentPicker | `expo-document-picker` | [document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/) |
| SQLite | `expo-sqlite` | [sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) |
| SecureStore | `expo-secure-store` | [securestore](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| Crypto | `expo-crypto` | [crypto](https://docs.expo.dev/versions/latest/sdk/crypto/) |
| Clipboard | `expo-clipboard` | [clipboard](https://docs.expo.dev/versions/latest/sdk/clipboard/) |

### Định vị, lịch, danh bạ

| Doc | Package | Doc slug |
|-----|---------|----------|
| Location | `expo-location` | [location](https://docs.expo.dev/versions/latest/sdk/location/) |
| Calendar | `expo-calendar` | [calendar](https://docs.expo.dev/versions/latest/sdk/calendar/) |
| Calendar (next) | `expo-calendar` | [calendar-next](https://docs.expo.dev/versions/latest/sdk/calendar-next/) |
| Contacts | `expo-contacts` | [contacts](https://docs.expo.dev/versions/latest/sdk/contacts/) |
| Contacts (next) | `expo-contacts` | [contacts-next](https://docs.expo.dev/versions/latest/sdk/contacts-next/) |

### Xác thực, ứng dụng, cửa hàng

| Doc | Package | Doc slug |
|-----|---------|----------|
| AppleAuthentication | `expo-apple-authentication` | [apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/) |
| AuthSession | `expo-auth-session` | [auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/) |
| LocalAuthentication | `expo-local-authentication` | [local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/) |
| Application | `expo-application` | [application](https://docs.expo.dev/versions/latest/sdk/application/) |
| StoreReview | `expo-store-review` | [store-review](https://docs.expo.dev/versions/latest/sdk/store-review/) |

### Thông báo, nền, task

| Doc | Package | Doc slug |
|-----|---------|----------|
| Notifications | `expo-notifications` | [notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) |
| BackgroundFetch (deprecated) | `expo-background-fetch` | [background-fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/) |
| BackgroundTask | `expo-background-task` | [background-task](https://docs.expo.dev/versions/latest/sdk/background-task/) |
| TaskManager | `expo-task-manager` | [task-manager](https://docs.expo.dev/versions/latest/sdk/task-manager/) |

### Cập nhật, manifest, fingerprint

| Doc | Package | Doc slug |
|-----|---------|----------|
| Updates | `expo-updates` | [updates](https://docs.expo.dev/versions/latest/sdk/updates/) |
| Manifests | `expo-manifests` | [manifests](https://docs.expo.dev/versions/latest/sdk/manifests/) |
| Fingerprint | `@expo/fingerprint` | [fingerprint](https://docs.expo.dev/versions/latest/sdk/fingerprint/) |

### Khác (sidebar SDK)

| Doc | Package | Doc slug |
|-----|---------|----------|
| AgeRange | `expo-age-range` | [age-range](https://docs.expo.dev/versions/latest/sdk/age-range/) |
| AppIntegrity | `expo-app-integrity` | [app-integrity](https://docs.expo.dev/versions/latest/sdk/app-integrity/) |
| Blob | `expo-blob` | [blob](https://docs.expo.dev/versions/latest/sdk/blob/) |
| Brownfield | (brownfield integration) | [brownfield](https://docs.expo.dev/versions/latest/sdk/brownfield/) |
| BuildProperties | `expo-build-properties` | [build-properties](https://docs.expo.dev/versions/latest/sdk/build-properties/) |
| Checkbox | `expo-checkbox` | [checkbox](https://docs.expo.dev/versions/latest/sdk/checkbox/) |
| Constants | `expo-constants` | [constants](https://docs.expo.dev/versions/latest/sdk/constants/) |
| DevClient | `expo-dev-client` | [dev-client](https://docs.expo.dev/versions/latest/sdk/dev-client/) |
| DevMenu | `expo-dev-menu` / dev tools | [dev-menu](https://docs.expo.dev/versions/latest/sdk/dev-menu/) |
| Font | `expo-font` | [font](https://docs.expo.dev/versions/latest/sdk/font/) |
| Haptics | `expo-haptics` | [haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) |
| IntentLauncher | `expo-intent-launcher` | [intent-launcher](https://docs.expo.dev/versions/latest/sdk/intent-launcher/) |
| Linking | `expo-linking` | [linking](https://docs.expo.dev/versions/latest/sdk/linking/) |
| Localization | `expo-localization` | [localization](https://docs.expo.dev/versions/latest/sdk/localization/) |
| MailComposer | `expo-mail-composer` | [mail-composer](https://docs.expo.dev/versions/latest/sdk/mail-composer/) |
| Print | `expo-print` | [print](https://docs.expo.dev/versions/latest/sdk/print/) |
| ScreenCapture | `expo-screen-capture` | [screen-capture](https://docs.expo.dev/versions/latest/sdk/screen-capture/) |
| Server | `expo-server` / server runtime | [server](https://docs.expo.dev/versions/latest/sdk/server/) |
| Sharing | `expo-sharing` | [sharing](https://docs.expo.dev/versions/latest/sdk/sharing/) |
| SMS | `expo-sms` | [sms](https://docs.expo.dev/versions/latest/sdk/sms/) |
| Speech | `expo-speech` | [speech](https://docs.expo.dev/versions/latest/sdk/speech/) |
| SplashScreen | `expo-splash-screen` | [splash-screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/) |
| TrackingTransparency | `expo-tracking-transparency` | [tracking-transparency](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/) |
| WebBrowser | `expo-web-browser` | [web-browser](https://docs.expo.dev/versions/latest/sdk/web-browser/) |
| Widgets | `expo-widgets` | [widgets](https://docs.expo.dev/versions/latest/sdk/widgets/) |

### Router (tài liệu riêng — không nằm dưới `/sdk/` hết)

| Chủ đề | Doc |
|--------|-----|
| Router overview | [Expo Router](https://docs.expo.dev/router/introduction/) |
| Router Color | [Color](https://docs.expo.dev/router/reference/color/) |
| Router Link | [Link](https://docs.expo.dev/router/reference/link/) |
| Native tabs | [Native tabs](https://docs.expo.dev/router/advanced/native-tabs/) |
| Split View | [Split view](https://docs.expo.dev/router/advanced/split-view/) |
| Stack | [Stack](https://docs.expo.dev/router/advanced/stack/) |
| Router UI | [Router UI](https://docs.expo.dev/router/reference/router-ui/) |

Package: `expo-router`.

---

## 4. Thư viện bên thứ ba (khuyến nghị Expo — doc “Third-party libraries”)

| Package | Doc |
|---------|-----|
| `@react-native-async-storage/async-storage` | [doc](https://docs.expo.dev/versions/latest/sdk/async-storage/) |
| `@react-native-community/datetimepicker` | [doc](https://docs.expo.dev/versions/latest/sdk/date-time-picker/) |
| `@react-native-community/netinfo` | [doc](https://docs.expo.dev/versions/latest/sdk/netinfo/) |
| `@react-native-community/slider` | [doc](https://docs.expo.dev/versions/latest/sdk/slider/) |
| `@react-native-masked-view/masked-view` | [doc](https://docs.expo.dev/versions/latest/sdk/masked-view/) |
| `@react-native-picker/picker` | [doc](https://docs.expo.dev/versions/latest/sdk/picker/) |
| `@react-native-segmented-control/segmented-control` | [doc](https://docs.expo.dev/versions/latest/sdk/segmented-control/) |
| `@shopify/flash-list` | [doc](https://docs.expo.dev/versions/latest/sdk/flash-list/) |
| `@shopify/react-native-skia` | [doc](https://docs.expo.dev/versions/latest/sdk/skia/) |
| `@stripe/stripe-react-native` | [doc](https://docs.expo.dev/versions/latest/sdk/stripe/) |
| `react-native-gesture-handler` | [doc](https://docs.expo.dev/versions/latest/sdk/gesture-handler/) |
| `react-native-keyboard-controller` | [doc](https://docs.expo.dev/versions/latest/sdk/keyboard-controller/) |
| `react-native-maps` | [doc](https://docs.expo.dev/versions/latest/sdk/react-native-maps/) |
| `react-native-pager-view` | [doc](https://docs.expo.dev/versions/latest/sdk/pager-view/) |
| `react-native-reanimated` | [doc](https://docs.expo.dev/versions/latest/sdk/reanimated/) |
| `react-native-safe-area-context` | [doc](https://docs.expo.dev/versions/latest/sdk/safe-area-context/) |
| `react-native-screens` | [doc](https://docs.expo.dev/versions/latest/sdk/screens/) |
| `react-native-svg` | [doc](https://docs.expo.dev/versions/latest/sdk/svg/) |
| `react-native-view-shot` | [doc](https://docs.expo.dev/versions/latest/sdk/captureRef/) |
| `react-native-webview` | [doc](https://docs.expo.dev/versions/latest/sdk/webview/) |

---

## 5. Agent lấy thông tin như thế nào?

1. **Mục lục có cấu trúc (file này)** — chọn hàng → mở URL doc tương ứng.
2. **Dump đầy đủ cho LLM:** fetch [llms-sdk.txt](https://docs.expo.dev/llms-sdk.txt) (toàn bộ SDK + config) hoặc [llms.txt](https://docs.expo.dev/llms.txt) (sitemap hướng dẫn).
3. **Trong repo Thuocare:**  
   - Routing skill: [`.cursor/agents/skills/expo-react-native.md`](../../.cursor/agents/skills/expo-react-native.md)  
   - UI Expo Router / native patterns: [`.agents/skills/building-native-ui/SKILL.md`](../../.agents/skills/building-native-ui/SKILL.md)  
   - Data / fetch: [`.agents/skills/native-data-fetching/SKILL.md`](../../.agents/skills/native-data-fetching/SKILL.md)
4. **Cài package:** luôn ưu tiên `cd apps/mobile && npx expo install <package>` (đúng phiên bản SDK). Monorepo: `pnpm run expo:install -- <package>` từ root (xem [README.md](../../README.md)).

---

## 6. Tạo wrapper rồi design lớp trên

**Mục tiêu:** không để `expo-camera` / `expo-image` / v.v. rò rỉ trực tiếp vào màn hình sản phẩm; gom vào lớp có **token + hành vi** thống nhất (NativeWind / design system).

### Quy ước đặt file (gợi ý)

| Lớp | Vị trí | Trách nhiệm |
|-----|--------|-------------|
| **Primitives** | `src/shared/ui/expo/` hoặc `src/shared/expo-wrappers/` | Export mỏng quanh 1 module Expo (props typed, default an toàn). |
| **Composed** | `src/shared/ui/` hoặc `src/features/<x>/components/` | Kết hợp primitive + `Text`/`Button`/`className` theo DESIGN. |
| **Màn hình** | `src/features/<x>/pages/...` | Chỉ import composed / shared; không import `expo-*` thô trừ khi cực kỳ cục bộ. |

### Pattern wrapper (khái niệm)

```tsx
// shared/ui/expo/camera-preview.tsx — ví dụ minh họa
import { CameraView, type CameraViewProps } from 'expo-camera';
import { View } from 'react-native';

export type AppCameraPreviewProps = Pick<CameraViewProps, 'facing' | 'enableTorch'> & {
  className?: string;
};

export function AppCameraPreview(props: AppCameraPreviewProps) {
  return (
    <View className={props.className}>
      <CameraView style={{ flex: 1 }} facing={props.facing} enableTorch={props.enableTorch} />
    </View>
  );
}
```

- Giữ **API nhỏ** (chỉ props product cần).  
- Map **theme** (`className`, màu từ `global.css` / token) ở lớp composed.  
- **Quyền / capability:** xử lý ở hook hoặc container trước khi mount module native.

### Design

- Tuân [DESIGN.md](./DESIGN.md) và [building-native-ui](../../.agents/skills/building-native-ui/SKILL.md) cho spacing, typography, native tabs, form sheet, v.v.

---

## 7. Bảo trì file này

Khi Expo đổi sidebar hoặc slug: cập nhật bảng và kiểm tra vài link `404`. Trạng thái **ALPHA / BETA / NEW** trên docs có thể thay đổi theo từng bản phát hành.
