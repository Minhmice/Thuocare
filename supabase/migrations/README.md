# Supabase Migrations

Thư mục này có 2 lớp để đọc SQL:

1. `canonical migrations`
   Dùng làm nguồn chạy thật và là source of truth về thứ tự migration.
2. `split table reference`
   Dùng để đọc nhanh từng bảng một, không thay thế migration canonical.

## Canonical files

- [20260324000000_all_in_one_consolidated.sql](/Users/minhmice/Documents/projects/Thuocare/supabase/migrations/20260324000000_all_in_one_consolidated.sql)
  Baseline canonical, gom toàn bộ nền tảng ban đầu.
- [20260324110000_phase_10_three_lane_foundation.sql](/Users/minhmice/Documents/projects/Thuocare/supabase/migrations/20260324110000_phase_10_three_lane_foundation.sql)
  Three-lane foundation, consent bridge, medication knowledge base.
- [20260325000000_phase_11_personal_lane_tables.sql](/Users/minhmice/Documents/projects/Thuocare/supabase/migrations/20260325000000_phase_11_personal_lane_tables.sql)
  Personal lane medication + adherence tables.

## Split Table Reference

Mình đã tách bản đọc nhanh theo từng bảng vào:

- [tables/20260324000000_all_in_one_consolidated](/Users/minhmice/Documents/projects/Thuocare/supabase/migrations/tables/20260324000000_all_in_one_consolidated)
  24 file table-level cho baseline core.
- [tables/20260324110000_phase_10_three_lane_foundation](/Users/minhmice/Documents/projects/Thuocare/supabase/migrations/tables/20260324110000_phase_10_three_lane_foundation)
  17 file table-level cho three-lane, consent, knowledge base.
- [tables/20260325000000_phase_11_personal_lane_tables](/Users/minhmice/Documents/projects/Thuocare/supabase/migrations/tables/20260325000000_phase_11_personal_lane_tables)
  2 file table-level cho personal lane runtime tables.

Mỗi file split:

- chỉ tập trung vào `create table` block của đúng một bảng,
- giữ lại index/constraint sát ngay sau bảng nếu chúng nằm cùng block,
- thêm header chỉ ra source migration gốc,
- không thay thế canonical migration khi chạy DB.

## How To Read

Nếu cần hiểu nhanh schema:

1. Mở file table trong `supabase/migrations/tables/.../tables/*.sql`
2. Khi cần hiểu quyền hoặc business flow, quay lại migration canonical tương ứng để đọc:
   - functions
   - RLS/policies
   - grants
   - triggers / helper procedures

## Important Rule

Khi thực thi migration hoặc review thứ tự thay đổi DB:

- luôn lấy file canonical trong `supabase/migrations/*.sql` làm chuẩn,
- xem thư mục `tables/` như bản split để tra cứu, không phải bản migration độc lập.
