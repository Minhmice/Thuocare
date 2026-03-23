/**
 * Data access for `public.appointment` and `public.pre_visit_requirement`.
 */

import type {
  AppointmentRow,
  AppointmentStatus,
  EntityId,
  PreVisitRequirementRow,
} from "@thuocare/contracts";
import { AppointmentError } from "../errors/appointment-errors.js";
import { dbInsert, dbSelect, dbSelectOne, dbUpdate } from "./db-client.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── Appointment reads ────────────────────────────────────────────────────────

export async function findAppointmentById(
  client: AnyClient,
  id: EntityId,
): Promise<AppointmentRow | null> {
  try {
    return await dbSelectOne<AppointmentRow>(
      client, "appointment", "*", (q) => q.eq("id", id),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

/** Patient's appointments sorted by scheduled_start_at desc. */
export async function findAppointmentsByPatient(
  client: AnyClient,
  patientId: EntityId,
  limit = 40,
): Promise<AppointmentRow[]> {
  try {
    return await dbSelect<AppointmentRow>(
      client, "appointment", "*",
      (q) => q.eq("patient_id", patientId)
               .order("scheduled_start_at", { ascending: false })
               .limit(limit),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

/** Org-scoped appointments with optional filters. */
export async function findAppointmentsByOrg(
  client: AnyClient,
  organizationId: EntityId,
  opts: {
    doctorId?: EntityId | null;
    fromDate?: string;
    toDate?: string;
    statuses?: AppointmentStatus[];
    limit?: number;
  } = {},
): Promise<AppointmentRow[]> {
  try {
    return await dbSelect<AppointmentRow>(
      client, "appointment", "*",
      (q) => {
        let query = q
          .eq("organization_id", organizationId)
          .order("scheduled_start_at", { ascending: true })
          .limit(opts.limit ?? 100);
        if (opts.doctorId) query = query.eq("doctor_id", opts.doctorId);
        if (opts.fromDate) query = query.gte("scheduled_start_at", `${opts.fromDate}T00:00:00`);
        if (opts.toDate) query = query.lte("scheduled_start_at", `${opts.toDate}T23:59:59`);
        if (opts.statuses && opts.statuses.length > 0) query = query.in("status", opts.statuses);
        return query;
      },
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

/** Overdue appointments: status is scheduled/confirmed AND start_at < now. */
export async function findOverdueAppointmentsByOrg(
  client: AnyClient,
  organizationId: EntityId,
  now: string,
): Promise<AppointmentRow[]> {
  try {
    return await dbSelect<AppointmentRow>(
      client, "appointment", "*",
      (q) => q
        .eq("organization_id", organizationId)
        .in("status", ["scheduled", "confirmed"])
        .lt("scheduled_start_at", now)
        .order("scheduled_start_at", { ascending: true }),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

// ─── Appointment writes ───────────────────────────────────────────────────────

export async function insertAppointment(
  client: AnyClient,
  row: Record<string, unknown>,
): Promise<AppointmentRow> {
  try {
    return await dbInsert<AppointmentRow>(client, "appointment", row);
  } catch (err) {
    throw new AppointmentError("db_write_failed", String(err));
  }
}

export async function updateAppointment(
  client: AnyClient,
  id: EntityId,
  patch: Record<string, unknown>,
): Promise<AppointmentRow> {
  try {
    return await dbUpdate<AppointmentRow>(
      client, "appointment", patch, (q) => q.eq("id", id),
    );
  } catch (err) {
    throw new AppointmentError("db_write_failed", String(err));
  }
}

// ─── Pre-visit requirements ───────────────────────────────────────────────────

export async function findRequirementsByAppointment(
  client: AnyClient,
  appointmentId: EntityId,
): Promise<PreVisitRequirementRow[]> {
  try {
    return await dbSelect<PreVisitRequirementRow>(
      client, "pre_visit_requirement", "*",
      (q) => q.eq("appointment_id", appointmentId).order("created_at", { ascending: true }),
    );
  } catch (err) {
    throw new AppointmentError("db_read_failed", String(err));
  }
}

export async function insertPreVisitRequirement(
  client: AnyClient,
  row: Record<string, unknown>,
): Promise<PreVisitRequirementRow> {
  try {
    return await dbInsert<PreVisitRequirementRow>(client, "pre_visit_requirement", row);
  } catch (err) {
    throw new AppointmentError("db_write_failed", String(err));
  }
}
