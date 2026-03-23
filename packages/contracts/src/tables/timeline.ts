import type { ActorType, TreatmentEntityType, TreatmentEventType, VisibilityScope } from "../enums.js";
import type { EntityId, IsoDateTime, JsonValue } from "../primitives.js";

/** `public.treatment_event` */
export interface TreatmentEventRow {
  id: EntityId;
  organization_id: EntityId;
  patient_id: EntityId;
  treatment_episode_id: EntityId;
  entity_type: TreatmentEntityType;
  entity_id: EntityId;
  event_type: TreatmentEventType;
  event_at: IsoDateTime;
  actor_type: ActorType;
  actor_ref_id: EntityId | null;
  payload_json: JsonValue | null;
  visibility_scope: VisibilityScope;
  created_at: IsoDateTime;
}

export type TreatmentEvent = TreatmentEventRow;

export type CreateTreatmentEventInput = Pick<
  TreatmentEventRow,
  | "organization_id"
  | "patient_id"
  | "treatment_episode_id"
  | "entity_type"
  | "entity_id"
  | "event_type"
  | "actor_type"
> & {
  event_at?: IsoDateTime;
  actor_ref_id?: EntityId | null;
  payload_json?: JsonValue | null;
  visibility_scope?: VisibilityScope;
};

export type UpdateTreatmentEventInput = Partial<
  Pick<
    TreatmentEventRow,
    "event_at" | "actor_type" | "actor_ref_id" | "payload_json" | "visibility_scope"
  >
>;

export type TreatmentEventSummary = Pick<
  TreatmentEventRow,
  | "id"
  | "treatment_episode_id"
  | "entity_type"
  | "entity_id"
  | "event_type"
  | "event_at"
  | "visibility_scope"
>;
