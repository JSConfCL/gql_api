import { eq } from "drizzle-orm";

import { builder } from "~/builder";
import { TRANSACTION_HANDLER } from "~/datasources/db";
import {
  addonsSchema,
  ticketAddonsSchema,
  addonConstraintsSchema,
  AddonConstraintType,
  SelectAddonConstraintSchema,
} from "~/datasources/db/ticketAddons";
import { applicationError, ServiceErrors } from "~/errors";
import { Logger } from "~/logging";
import { InferPothosInputType } from "~/types";

import { CreateAddonConstraintInputRef } from "../mutations";

type ConstraintGraph = Record<string, Set<string>>;
type AddonMap = Record<
  string,
  {
    id: string;
    ticketId: string;
    constraints: SelectAddonConstraintSchema[];
  }
>;

/**
 * Validates constraints between addons for a ticket, ensuring:
 * 1. All addons belong to the ticket
 * 2. No conflicting constraints exist
 * 3. No cyclic dependencies
 * 4. No duplicate constraints
 * 5. No invalid constraint combinations
 */
export const validateAddonConstraints = async (
  logger: Logger,
  tx: TRANSACTION_HANDLER,
  addonId: string,
  newConstraints: InferPothosInputType<
    typeof builder,
    typeof CreateAddonConstraintInputRef
  >[],
  ticketId: string,
): Promise<void> => {
  // Check for duplicate constraints in new constraints
  const duplicates = findDuplicateConstraints(newConstraints);

  if (duplicates.length > 0) {
    throw applicationError(
      `Duplicate constraints detected: ${duplicates
        .map((c) => `${c.relatedAddonId}-${c.constraintType}`)
        .join(", ")}`,
      ServiceErrors.INVALID_ARGUMENT,
      logger,
    );
  }

  const addonMap = await fetchTicketAddonsWithConstraints(tx, ticketId);

  const {
    invalidAddons,
    dependencyGraph,
    exclusionGraph,
    bidirectionalDependencies,
  } = analyzeConstraints(addonId, newConstraints, addonMap);

  // Validate all addons belong to the ticket
  if (invalidAddons.length > 0) {
    throw applicationError(
      `Addons with ids ${invalidAddons.join(
        ", ",
      )} do not belong to the specified ticket`,
      ServiceErrors.INVALID_ARGUMENT,
      logger,
    );
  }

  // Check for cyclic dependencies
  try {
    detectCyclicDependency(dependencyGraph);
  } catch (error) {
    if (error instanceof Error) {
      throw applicationError(
        `Cyclic dependency detected: ${
          error.message.split("Cyclic dependency detected: ")[1]
        }`,
        ServiceErrors.INVALID_ARGUMENT,
        logger,
      );
    }

    throw error;
  }

  // Validate constraint consistency
  validateConstraintConsistency(logger, dependencyGraph, exclusionGraph);

  // Validate bidirectional dependencies
  if (bidirectionalDependencies.size > 0) {
    throw applicationError(
      "Bidirectional dependencies detected",
      ServiceErrors.INVALID_ARGUMENT,
      logger,
    );
  }
};

/**
 * Finds duplicate constraints in the new constraints array
 */
const findDuplicateConstraints = (
  constraints: InferPothosInputType<
    typeof builder,
    typeof CreateAddonConstraintInputRef
  >[],
) => {
  const seen = new Set<string>();
  const duplicates: typeof constraints = [];

  constraints.forEach((constraint) => {
    const key = `${constraint.relatedAddonId}-${constraint.constraintType}`;

    if (seen.has(key)) {
      duplicates.push(constraint);
    }

    seen.add(key);
  });

  return duplicates;
};

/**
 * Fetches all addons and their constraints for a given ticket
 */
const fetchTicketAddonsWithConstraints = async (
  tx: TRANSACTION_HANDLER,
  ticketId: string,
): Promise<AddonMap> => {
  const rows = await tx
    .select({
      id: addonsSchema.id,
      ticketId: ticketAddonsSchema.ticketId,
      constraints: addonConstraintsSchema,
    })
    .from(ticketAddonsSchema)
    .innerJoin(addonsSchema, eq(addonsSchema.id, ticketAddonsSchema.addonId))
    .leftJoin(
      addonConstraintsSchema,
      eq(addonConstraintsSchema.addonId, addonsSchema.id),
    )
    .where(eq(ticketAddonsSchema.ticketId, ticketId));

  return rows.reduce((acc, row) => {
    if (!acc[row.id]) {
      acc[row.id] = { ...row, constraints: [] };
    }

    if (row.constraints) {
      acc[row.id].constraints.push(row.constraints);
    }

    return acc;
  }, {} as AddonMap);
};

/**
 * Analyzes constraints and builds validation data structures
 */
const analyzeConstraints = (
  addonId: string,
  newConstraints: InferPothosInputType<
    typeof builder,
    typeof CreateAddonConstraintInputRef
  >[],
  addonMap: AddonMap,
) => {
  const invalidAddons: string[] = [];
  const dependencyGraph: ConstraintGraph = {};
  const exclusionGraph: ConstraintGraph = {};
  const bidirectionalDependencies: Set<string> = new Set();

  // Initialize graphs
  Object.keys(addonMap).forEach((id) => {
    dependencyGraph[id] = new Set();

    exclusionGraph[id] = new Set();
  });

  // Build initial graphs from existing constraints
  for (const addon of Object.values(addonMap)) {
    for (const constraint of addon.constraints) {
      updateConstraintGraphs(
        constraint.addonId,
        {
          relatedAddonId: constraint.relatedAddonId,
          constraintType: constraint.constraintType,
        },
        dependencyGraph,
        exclusionGraph,
        bidirectionalDependencies,
      );
    }
  }

  // Process new constraints
  for (const constraint of newConstraints) {
    const { relatedAddonId } = constraint;

    if (!addonMap[addonId] || !addonMap[relatedAddonId]) {
      invalidAddons.push(addonId in addonMap ? relatedAddonId : addonId);
      continue;
    }

    updateConstraintGraphs(
      addonId,
      constraint,
      dependencyGraph,
      exclusionGraph,
      bidirectionalDependencies,
    );
  }

  return {
    invalidAddons,
    dependencyGraph,
    exclusionGraph,
    bidirectionalDependencies,
  };
};

/**
 * Updates constraint graphs and tracks bidirectional dependencies
 */
const updateConstraintGraphs = (
  addonId: string,
  constraint: {
    relatedAddonId: string;
    constraintType: AddonConstraintType;
  },
  dependencyGraph: ConstraintGraph,
  exclusionGraph: ConstraintGraph,
  bidirectionalDependencies: Set<string>,
): void => {
  const { relatedAddonId, constraintType } = constraint;

  if (constraintType === AddonConstraintType.DEPENDENCY) {
    if (!dependencyGraph[addonId]) {
      dependencyGraph[addonId] = new Set();
    }

    dependencyGraph[addonId].add(relatedAddonId);

    // Check for bidirectional dependency
    if (
      dependencyGraph[relatedAddonId] &&
      dependencyGraph[relatedAddonId].has(addonId)
    ) {
      bidirectionalDependencies.add([addonId, relatedAddonId].sort().join("-"));
    }
  } else if (constraintType === AddonConstraintType.MUTUAL_EXCLUSION) {
    [addonId, relatedAddonId].forEach((id) => {
      const otherId = id === addonId ? relatedAddonId : addonId;

      if (!exclusionGraph[id]) {
        exclusionGraph[id] = new Set();
      }

      exclusionGraph[id].add(otherId);
    });
  }
};

/**
 * Detects cyclic dependencies and provides the cycle path
 */
const detectCyclicDependency = (graph: ConstraintGraph): void => {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  const detectCycle = (node: string): void => {
    visited.add(node);

    recursionStack.add(node);

    path.push(node);

    const neighbors = graph[node] || new Set();

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        detectCycle(neighbor);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        const cyclePath = [...path.slice(cycleStart), neighbor];
        throw new Error(
          `Cyclic dependency detected: ${cyclePath.join(" -> ")}`,
        );
      }
    }

    recursionStack.delete(node);

    path.pop();
  };

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      detectCycle(node);
    }
  }
};

/**
 * Validates that dependencies and exclusions don't conflict
 */
const validateConstraintConsistency = (
  logger: Logger,
  dependencyGraph: ConstraintGraph,
  exclusionGraph: ConstraintGraph,
): void => {
  const getAllDependencies = (
    addonId: string,
    visited: Set<string> = new Set(),
  ): Set<string> => {
    if (visited.has(addonId)) {
      return visited;
    }

    visited.add(addonId);
    const dependencies = dependencyGraph[addonId] || new Set();

    for (const dep of dependencies) {
      getAllDependencies(dep, visited);
    }

    return visited;
  };

  // Check both dependency and exclusion graphs
  const allNodes = new Set([
    ...Object.keys(dependencyGraph),
    ...Object.keys(exclusionGraph),
  ]);

  for (const addonId of allNodes) {
    const allDependencies = getAllDependencies(addonId);
    const exclusions = exclusionGraph[addonId] || new Set();

    // Check direct and transitive dependencies against exclusions
    for (const dep of allDependencies) {
      if (exclusions.has(dep)) {
        throw applicationError(
          `Inconsistent constraints: ${addonId} depends on ${dep} but they are mutually exclusive`,
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }

      // Also check if any dependency excludes the original addon
      const depExclusions = exclusionGraph[dep] || new Set();

      if (depExclusions.has(addonId)) {
        throw applicationError(
          `Inconsistent constraints: ${addonId} depends on ${dep} but ${dep} excludes ${addonId}`,
          ServiceErrors.INVALID_ARGUMENT,
          logger,
        );
      }
    }
  }
};
