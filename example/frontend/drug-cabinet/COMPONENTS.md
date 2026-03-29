# Drug Cabinet — component files

Mỗi component nằm trong **thư mục riêng**, file HTML cùng tên (ví dụ `components/screen-header/screen-header.html`).

Trang (`index.html`, `onboarding.html`, `home.html`, `add-medication.html`) chỉ còn khung + `data-include` trỏ tới **app shell** hoặc **hub**, rồi `js/includes.js` nạp đệ quy các partial.

**Lưu ý:** `fetch()` không chạy với `file://`. Từ thư mục `drug-cabinet`, chạy ví dụ: `npx --yes serve .` rồi mở URL localhost.

## Danh sách thư mục / file

| Folder | File | Vai trò |
|--------|------|---------|
| `hub-navigation` | `hub-navigation.html` | Menu 3 màn trên trang hub |
| `app-shell-onboarding` | `app-shell-onboarding.html` | Khung onboarding + ghép hero, footer |
| `onboarding-hero` | `onboarding-hero.html` | Tiêu đề, gạch vàng, subcopy |
| `illustration-phone-hands` | `illustration-phone-hands.html` | SVG minh họa |
| `brand-mark-google` | `brand-mark-google.html` | Nút tròn chữ G |
| `primary-button-honey` | `primary-button-honey.html` | CTA vàng “Get started” |
| `text-link-sign-in` | `text-link-sign-in.html` | Link đăng nhập |
| `app-shell-home` | `app-shell-home.html` | Khung Home + ghép các khối |
| `screen-header` | `screen-header.html` | Avatar, chào, chuông |
| `date-strip-section` | `date-strip-section.html` | Vùng lịch (toolbar + strip) |
| `calendar-toolbar` | `calendar-toolbar.html` | Tháng + nút Today |
| `date-strip` | `date-strip.html` | Hàng ngày cuộn ngang |
| `section-to-take` | `section-to-take.html` | Tiêu đề + 2 thẻ thuốc |
| `medication-card-probiotic` | `medication-card-probiotic.html` | Thẻ Probiotic |
| `medication-card-loratadine` | `medication-card-loratadine.html` | Thẻ Loratadine + include swipe |
| `swipe-to-complete-visual` | `swipe-to-complete-visual.html` | Thanh swipe / check |
| `bottom-nav-fab` | `bottom-nav-fab.html` | Thanh đáy + FAB |
| `app-shell-add-medication` | `app-shell-add-medication.html` | Khung màn thêm thuốc |
| `add-medication-top-shell` | `add-medication-top-shell.html` | Nền xanh + sóng + toolbar + carousel |
| `add-medication-toolbar` | `add-medication-toolbar.html` | Back + tiêu đề |
| `type-carousel` | `type-carousel.html` | Chọn dạng thuốc |
| `add-medication-form-body` | `add-medication-form-body.html` | Sheet trắng + các field |
| `pills-name-field` | `pills-name-field.html` | Ô tên thuốc |
| `notification-toggle-row` | `notification-toggle-row.html` | Hàng thông báo + include switch |
| `toggle-switch` | `toggle-switch.html` | Công tắc (mock) |
| `day-toggles-row` | `day-toggles-row.html` | Chọn thứ |
| `color-swatch-row` | `color-swatch-row.html` | Chọn màu nhãn |
| `primary-button-forest` | `primary-button-forest.html` | Nút “Save to cabinet” |

## Script

- `js/includes.js` — thay thế phần tử có `data-include="components/.../....html"` bằng nội dung file (một root element mỗi file).
