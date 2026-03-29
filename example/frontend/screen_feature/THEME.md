# Thuocare — Theme & design tokens (screen_feature)

**Phạm vi:** Đồng bộ mock HTML trong `screen_feature/pages/`, prototype `medication-reminders/`, và tham chiếu visual “Drug Cabinet” (`drug-cabinet/`).

**Cập nhật:** 2026-03-28

---

## 1. Giọng điệu UI (bắt buộc cho MVP tab)

- **Tên:** Clinical minimal  
- **Cảm giác:** Điềm tĩnh, rõ ràng, ít gánh nặng nhận thức; ưu tiên quét nhanh khi người dùng mệt.  
- **Tránh:** Form doanh nghiệp dày đặc, quá nhiều lớp validation, density cao.

---

## 2. Typography — lane chính (Medication Reminders / screen_feature pages)

| Vai trò | Font | Tailwind |
|--------|------|----------|
| Toàn bộ UI | **Inter** | `font-sans` |
| Trọng số body | 400 | `font-normal` |
| Nhãn phụ | 500 | `font-medium` |
| Nút / active | 600 | `font-semibold` |
| Tiêu đề nổi bật | 700 | `font-bold` |

**Nguồn Google Fonts:** `Inter:wght@400;500;600;700`

---

## 3. Typography — lane phụ (Drug Cabinet / marketing)

Dùng cho prototype xanh rừng + vàng mật ong, không thay thế lane chính trừ khi màn hình được đánh dấu “Cabinet”.

| Vai trò | Font |
|--------|------|
| Display / headline | **Fraunces** (soft serif) |
| UI | **Nunito** |

Token màu tham chiếu: `forest` `#1a3d36`, `honey` `#f4b45f`.

---

## 4. Màu — lane chính (brand + neutral)

| Token | Hex / class | Dùng cho |
|-------|-------------|----------|
| `brand` | `#4a65f6` | CTA, link chính, focus ring |
| `brand-hover` | `#3a52d6` | Hover CTA |
| `brand-light` | `#dde3ff` | Nền nhấn nhẹ |
| Nền app | `stone-100` ~ `#f5f5f4` | Shell ngoài |
| Text chính | `stone-900` | Tiêu đề, nội dung |
| Text phụ | `stone-500` | Mô tả, meta |
| Text nhạt | `stone-400` | Disabled, hint |

**Pastel thuốc (tile / icon):**

| Loại | Nền gợi ý | Icon gợi ý |
|------|-----------|------------|
| Tablet / viên | `#eef2ff` / `med.blueBg` | `#818cf8` |
| Capsule | `#f0fdf4` / `med.greenBg` | `#86efac` |
| Liquid | `#fff7ed` / `med.orangeBg` | `#fdba74` |

---

## 5. Hình học & bố cục

- **Khung mobile mock:** `max-w-md` hoặc `max-w-[400px]`, căn giữa trên desktop.  
- **Thẻ:** `rounded-[20px]` … `rounded-3xl` (20–24px).  
- **Nút / pill:** `rounded-full`.  
- **Input:** `rounded-xl` … `rounded-2xl`.  
- **Đổ bóng:** `shadow-sm` / `shadow-md` cho thẻ nổi trên nền `stone-100`.

---

## 6. Chuyển động

- **Auth success / chuyển cảnh:** fade + settle ~200ms vào, giữ đọc 500–900ms, rồi điều hướng tự động.  
- **Onboarding survey:** slide giữa bước (trái/phải), macro interaction điềm tĩnh.  
- **Hover / tap:** `transition-colors duration-200`.

---

## 7. Ánh xạ screen_feature → file spec

| Màn | File spec |
|-----|-----------|
| Đăng nhập | `sign-in.md` |
| Đăng ký | `sign-up.md` |
| Quên mật khẩu | `forgot-password.md` |
| Chuyển cảnh sau auth / sau onboarding | `auth-success-transition.md` |
| Khảo sát onboarding | `onboarding-survey.md` |
| Home / Hôm nay | `home.md` |
| Danh sách thuốc | `meds.md` |
| Tài khoản | `me.md` |
| Thêm thuốc | `add-medication.md` |
| Thông báo | `notifications.md` |

Prototype HTML tập trung tại: `pages/` (cùng thư mục `screen_feature`).

---

## 8. Backend mock & dữ liệu null

- File: `mock-backend.js`  
- Mọi API trả cấu trúc thống nhất `{ data, error }` với **`data` là `null` hoặc mảng rỗng** theo đúng feature (auth, onboarding, home, meds, me, thông báo, thêm thuốc).  
- Dùng trong trình duyệt: `<script src="../mock-backend.js"></script>` rồi gọi `window.MockBackend.*`.

---

## 9. Chạy static HTML

`fetch` tới partial (nếu có) cần HTTP server. Với chỉ các file trong `pages/`, mở trực tiếp hoặc:

```bash
cd screen_feature/pages && npx --yes serve .
```

---

## 10. Nguồn tham chiếu nội bộ

- `medication-reminders/THEME.md` — bản tóm tắt trước đó (Inter + brand).  
- `drug-cabinet/` — palette forest/honey + component HTML tách file.
