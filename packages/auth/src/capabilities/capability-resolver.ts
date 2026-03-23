/**
 * Capability resolver.
 *
 * Maps an actor kind + role into a FullCapabilities object.
 * Called during actor context construction; the result is stored on the context
 * and used throughout the session without re-computation.
 *
 * Also exports `getCapabilities()` for cases where you already have an
 * AnyActorContext and need its capabilities.
 */

import type { UserRole } from "@thuocare/contracts";
import type { AnyActorContext, FullCapabilities } from "../actor/actor-types.js";
import {
  STAFF_CAPABILITY_MAP,
  PATIENT_CAPABILITIES,
  NO_CAPABILITIES,
} from "./capability-map.js";

/** Input descriptor for capability resolution — keeps actor-resolver.ts clean. */
export type CapabilityInput =
  | { kind: "staff"; role: UserRole }
  | { kind: "patient" }
  | { kind: "unresolved" };

/**
 * Resolve FullCapabilities from a capability input descriptor.
 * Used internally during actor context construction.
 */
export function resolveFullCapabilities(input: CapabilityInput): FullCapabilities {
  if (input.kind === "staff") {
    const caps = STAFF_CAPABILITY_MAP[input.role];
    if (caps === undefined) {
      // Should never happen since UserRole is an exhaustive enum.
      // Fail safe: deny everything.
      return NO_CAPABILITIES;
    }
    return caps;
  }

  if (input.kind === "patient") {
    return PATIENT_CAPABILITIES;
  }

  // unresolved or unknown
  return NO_CAPABILITIES;
}

/**
 * Get the FullCapabilities from an already-resolved AnyActorContext.
 * Unresolved actors receive NO_CAPABILITIES (all false).
 */
export function getCapabilities(actor: AnyActorContext): FullCapabilities {
  if (actor.kind === "unresolved") {
    return NO_CAPABILITIES;
  }
  return actor.capabilities;
}

/**
 * Check whether an actor has a specific capability by key.
 *
 * Example:
 *   if (!hasCapability(actor, "canWritePrescriptions")) throw new CapabilityDeniedError(...)
 */
export function hasCapability(
  actor: AnyActorContext,
  capability: keyof FullCapabilities,
): boolean {
  return getCapabilities(actor)[capability] === true;
}
