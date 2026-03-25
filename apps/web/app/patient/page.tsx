import { buildRequestActorContext, isDoctorActor, isPatientActor } from "@thuocare/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { careIntentFromUserMetadata } from "@/lib/workflow/care-intent";

export default async function PatientPortalPage() {
  const supabase = await createSupabaseServerClient();
  const actor = await buildRequestActorContext(supabase);
  const { data: userData } = await supabase.auth.getUser();
  const meta = userData.user?.user_metadata as Record<string, unknown> | undefined;
  const careIntent = careIntentFromUserMetadata(meta) ?? "personal";

  if (isDoctorActor(actor)) redirect("/dashboard");
  if (careIntent === "family") redirect("/family");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: personalProfile } = await (supabase as any)
    .from("personal_profile")
    .select("id, preferred_name, timezone, language_code")
    .eq("auth_user_id", actor.authUserId)
    .eq("profile_status", "active")
    .maybeSingle() as {
    data: {
      id: string;
      preferred_name: string | null;
      timezone: string | null;
      language_code: string | null;
    } | null;
  };

  const isPersonalLane = personalProfile !== null;
  const isHospitalPatient = isPatientActor(actor);

  if (!isPersonalLane && !isHospitalPatient) {
    redirect(`/onboarding?intent=${careIntent}`);
  }

  const displayName =
    personalProfile?.preferred_name ??
    (typeof meta?.full_name === "string" ? meta.full_name : null);

  if (isPersonalLane) {
    return (
      <PersonalLaneDashboard
        displayName={displayName}
        timezone={personalProfile?.timezone ?? null}
        languageCode={personalProfile?.language_code ?? null}
      />
    );
  }

  return <HospitalPatientDashboard />;
}

function PersonalLaneDashboard({
  displayName,
  timezone,
  languageCode,
}: {
  displayName: string | null;
  timezone: string | null;
  languageCode: string | null;
}) {
  const greeting = displayName ? `Xin chào, ${displayName}` : "Kênh theo dõi cá nhân";

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <PageHeader />
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="rounded-xl bg-white border border-stone-200 p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 tracking-wide">
            Theo dõi cá nhân
          </span>
          <h1 className="mt-3 text-xl font-semibold text-stone-900">{greeting}</h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Bạn quản lý lịch uống thuốc của chính mình — không gắn với phòng khám. Trên điện thoại: thêm và sửa
            thuốc, xem «Hôm nay», ghi nhận liều kể cả khi uống trễ giờ, mở chi tiết từng thuốc (trung tâm chỉnh
            lịch và lịch sử), cập nhật hồ sơ trong mục «Tôi». Web này chủ yếu để đăng nhập và đọc hướng dẫn.
          </p>
          {(timezone || languageCode) && (
            <p className="mt-3 text-xs text-stone-500">
              {timezone ? `Múi giờ hồ sơ: ${timezone}. ` : null}
              {languageCode ? `Ngôn ngữ hồ sơ: ${languageCode}.` : null}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CompanionCard
            title="Hôm nay"
            body="Liều trong ngày, ghi nhận đã uống / bỏ qua, và chỉnh giờ thực tế nếu uống trễ — trên điện thoại."
          />
          <CompanionCard
            title="Thuốc"
            body="Danh sách có tìm kiếm; mỗi thuốc có màn chi tiết để sửa lịch, tạm dừng hoặc ngừng — trên điện thoại."
          />
          <CompanionCard
            title="Lịch sử"
            body="Cửa sổ mặc định 14 ngày, lọc theo thuốc và trạng thái; chạm dòng để quay lại thuốc — trên điện thoại."
          />
          <CompanionCard
            title="Tôi"
            body="Sửa tên hiển thị, múi giờ và ngôn ngữ hồ sơ trên mobile. Nhắc trong app khi mở; không có bật push giả trên web."
          />
        </div>

        <div className="mt-6 rounded-xl border border-stone-200 bg-stone-100/80 p-5">
          <p className="text-sm font-medium text-stone-800">Web đồng hành</p>
          <p className="mt-1 text-sm text-stone-600 leading-relaxed">
            Trang này để đăng nhập, xem tóm tắt và đọc hướng dẫn — không thay thế app. Các thao tác chính (ghi liều
            trễ giờ, sửa thuốc và hồ sơ) nằm trên Thuocare mobile.
          </p>
        </div>
      </main>
    </div>
  );
}

function HospitalPatientDashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <PageHeader />
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="rounded-xl bg-white border border-stone-200 p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800 tracking-wide">
            Bệnh viện / phòng khám
          </span>
          <h1 className="mt-3 text-xl font-semibold text-stone-900">Cổng bệnh nhân</h1>
          <p className="mt-2 text-sm text-stone-600 leading-relaxed">
            Tài khoản của bạn gắn với cơ sở y tế. Theo dõi đơn thuốc, lịch hẹn và yêu cầu cấp lại trên các màn
            tương ứng trong ứng dụng hoặc web khi được bật.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CompanionCard title="Đơn thuốc" body="Đơn đang hiệu lực từ đội ngũ điều trị." />
          <CompanionCard title="Cấp lại thuốc" body="Gửi và theo dõi yêu cầu khi hết thuốc." />
          <CompanionCard title="Uống thuốc" body="Lịch sử và tóm tắt theo chỉ định." />
          <CompanionCard title="Lịch hẹn" body="Lịch tái khám và liên quan." />
        </div>
      </main>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center justify-between">
      <span className="text-base font-semibold text-stone-900">Thuocare</span>
      <form action={signOutAction}>
        <button
          type="submit"
          className="text-sm text-stone-500 hover:text-red-700 transition cursor-pointer"
        >
          Đăng xuất
        </button>
      </form>
    </header>
  );
}

function CompanionCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <p className="mt-2 text-xs text-stone-600 leading-relaxed">{body}</p>
    </div>
  );
}
