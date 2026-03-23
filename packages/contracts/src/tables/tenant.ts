import type {
  CommunicationPreference,
  OrganizationType,
  PatientStatus,
  RecordStatus,
  RelationshipType,
  NotificationScope,
  Sex,
  UserRole,
} from "../enums.js";
import type { AuthUserId, Email, EntityId, IsoDate, IsoDateTime, OrganizationCode, Phone } from "../primitives.js";

/** `public.organization` */
export interface OrganizationRow {
  id: EntityId;
  code: OrganizationCode;
  name: string;
  org_type: OrganizationType;
  status: RecordStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Organization = OrganizationRow;

export type CreateOrganizationInput = Pick<
  OrganizationRow,
  "code" | "name" | "org_type"
> & {
  status?: RecordStatus;
};

export type UpdateOrganizationInput = Partial<
  Pick<OrganizationRow, "code" | "name" | "org_type" | "status">
>;

export type OrganizationSummary = Pick<OrganizationRow, "id" | "code" | "name" | "org_type" | "status">;

/** `public.clinic` */
export interface ClinicRow {
  id: EntityId;
  organization_id: EntityId;
  code: string;
  name: string;
  address_text: string | null;
  phone: Phone | null;
  status: RecordStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Clinic = ClinicRow;

export type CreateClinicInput = Pick<ClinicRow, "organization_id" | "code" | "name"> & {
  address_text?: string | null;
  phone?: Phone | null;
  status?: RecordStatus;
};

export type UpdateClinicInput = Partial<
  Pick<ClinicRow, "code" | "name" | "address_text" | "phone" | "status">
>;

export type ClinicSummary = Pick<ClinicRow, "id" | "organization_id" | "code" | "name" | "status">;

/**
 * `public.user_account` — includes `auth_user_id` from RLS migration.
 */
export interface UserAccountRow {
  id: EntityId;
  organization_id: EntityId;
  clinic_id: EntityId | null;
  role: UserRole;
  full_name: string;
  email: Email | null;
  phone: Phone | null;
  status: RecordStatus;
  auth_user_id: AuthUserId | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type UserAccount = UserAccountRow;

export type CreateUserAccountInput = Pick<
  UserAccountRow,
  "organization_id" | "role" | "full_name"
> & {
  clinic_id?: EntityId | null;
  email?: Email | null;
  phone?: Phone | null;
  status?: RecordStatus;
  auth_user_id?: AuthUserId | null;
};

export type UpdateUserAccountInput = Partial<
  Pick<
    UserAccountRow,
    "clinic_id" | "role" | "full_name" | "email" | "phone" | "status" | "auth_user_id"
  >
>;

export type UserAccountSummary = Pick<
  UserAccountRow,
  "id" | "organization_id" | "clinic_id" | "role" | "full_name" | "email" | "status"
>;

/** `public.doctor_profile` */
export interface DoctorProfileRow {
  id: EntityId;
  user_account_id: EntityId;
  license_no: string | null;
  specialty: string | null;
  title: string | null;
  default_clinic_id: EntityId | null;
  status: RecordStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type DoctorProfile = DoctorProfileRow;

export type CreateDoctorProfileInput = Pick<DoctorProfileRow, "user_account_id"> & {
  license_no?: string | null;
  specialty?: string | null;
  title?: string | null;
  default_clinic_id?: EntityId | null;
  status?: RecordStatus;
};

export type UpdateDoctorProfileInput = Partial<
  Pick<DoctorProfileRow, "license_no" | "specialty" | "title" | "default_clinic_id" | "status">
>;

export type DoctorProfileSummary = Pick<
  DoctorProfileRow,
  "id" | "user_account_id" | "license_no" | "specialty" | "title" | "default_clinic_id" | "status"
>;

/** `public.patient` — includes `auth_user_id` from RLS migration. */
export interface PatientRow {
  id: EntityId;
  organization_id: EntityId;
  external_patient_code: string | null;
  full_name: string;
  date_of_birth: IsoDate | null;
  sex: Sex;
  phone: Phone | null;
  email: Email | null;
  address_text: string | null;
  preferred_language: string | null;
  communication_preference: CommunicationPreference;
  status: PatientStatus;
  auth_user_id: AuthUserId | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type Patient = PatientRow;

export type CreatePatientInput = Pick<PatientRow, "organization_id" | "full_name"> & {
  external_patient_code?: string | null;
  date_of_birth?: IsoDate | null;
  sex?: Sex;
  phone?: Phone | null;
  email?: Email | null;
  address_text?: string | null;
  preferred_language?: string | null;
  communication_preference?: CommunicationPreference;
  status?: PatientStatus;
  auth_user_id?: AuthUserId | null;
};

export type UpdatePatientInput = Partial<
  Pick<
    PatientRow,
    | "external_patient_code"
    | "full_name"
    | "date_of_birth"
    | "sex"
    | "phone"
    | "email"
    | "address_text"
    | "preferred_language"
    | "communication_preference"
    | "status"
    | "auth_user_id"
  >
>;

export type PatientSummary = Pick<
  PatientRow,
  | "id"
  | "organization_id"
  | "external_patient_code"
  | "full_name"
  | "date_of_birth"
  | "sex"
  | "status"
  | "phone"
  | "email"
>;

/** `public.caregiver_link` */
export interface CaregiverLinkRow {
  id: EntityId;
  patient_id: EntityId;
  caregiver_name: string;
  relationship_type: RelationshipType;
  phone: Phone | null;
  email: Email | null;
  notification_scope: NotificationScope;
  is_primary: boolean;
  status: RecordStatus;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type CaregiverLink = CaregiverLinkRow;

export type CreateCaregiverLinkInput = Pick<
  CaregiverLinkRow,
  "patient_id" | "caregiver_name"
> & {
  relationship_type?: RelationshipType;
  phone?: Phone | null;
  email?: Email | null;
  notification_scope?: NotificationScope;
  is_primary?: boolean;
  status?: RecordStatus;
};

export type UpdateCaregiverLinkInput = Partial<
  Pick<
    CaregiverLinkRow,
    | "caregiver_name"
    | "relationship_type"
    | "phone"
    | "email"
    | "notification_scope"
    | "is_primary"
    | "status"
  >
>;

export type CaregiverLinkSummary = Pick<
  CaregiverLinkRow,
  "id" | "patient_id" | "caregiver_name" | "relationship_type" | "is_primary" | "status"
>;
