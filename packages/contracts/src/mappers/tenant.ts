import type {
  CaregiverLink,
  CaregiverLinkRow,
  Clinic,
  ClinicRow,
  DoctorProfile,
  DoctorProfileRow,
  Organization,
  OrganizationRow,
  Patient,
  PatientRow,
  UserAccount,
  UserAccountRow,
} from "../tables/tenant.js";

export function mapOrganizationRow(row: OrganizationRow): Organization {
  return { ...row };
}

export function mapClinicRow(row: ClinicRow): Clinic {
  return { ...row };
}

export function mapUserAccountRow(row: UserAccountRow): UserAccount {
  return { ...row };
}

export function mapDoctorProfileRow(row: DoctorProfileRow): DoctorProfile {
  return { ...row };
}

export function mapPatientRow(row: PatientRow): Patient {
  return { ...row };
}

export function mapCaregiverLinkRow(row: CaregiverLinkRow): CaregiverLink {
  return { ...row };
}
