import { describe, it, expect } from "vitest";
import {
  validateConnections,
  validateEntryPoint,
  validateSteps,
  validateTriggers,
} from "../validateTemplate";

describe("validateConnections", () => {
  it("should throw an error if there is a cycle in the connections", () => {
    const template = {
      steps: [{ id: "step1" }, { id: "step2" }, { id: "step3" }],
      connections: [
        { fromStepId: "step1", toStepId: "step2" },
        { fromStepId: "step2", toStepId: "step3" },
        { fromStepId: "step3", toStepId: "step1" }, // Cycle
      ],
      entryPointId: "step1",
    };

    expect(() => validateConnections(template)).toThrow(
      "Workflow connections must form a valid DAG"
    );
  });

  it("should throw an error if not all steps are connected to the workflow", () => {
    const template = {
      steps: [
        { id: "step1" },
        { id: "step2" },
        { id: "step3" },
        { id: "step4" }, // Isolated step
      ],
      connections: [
        { fromStepId: "step1", toStepId: "step2" },
        { fromStepId: "step2", toStepId: "step3" },
      ],
      entryPointId: "step1",
    };

    expect(() => validateConnections(template)).toThrow(
      "All steps must be connected to the workflow"
    );
  });

  it("should not throw an error for a valid DAG and all steps connected", () => {
    const template = {
      steps: [{ id: "step1" }, { id: "step2" }, { id: "step3" }],
      connections: [
        { fromStepId: "step1", toStepId: "step2" },
        { fromStepId: "step2", toStepId: "step3" },
      ],
      entryPointId: "step1",
    };

    expect(() => validateConnections(template)).not.toThrow();
  });

  it("should handle an empty connections list", () => {
    const template = {
      steps: [{ id: "step1" }],
      connections: [],
      entryPointId: "step1",
    };

    expect(() => validateConnections(template)).not.toThrow();
  });

  it("should throw an error if the entry point is not connected correctly", () => {
    const template = {
      steps: [{ id: "step1" }, { id: "step2" }],
      connections: [{ fromStepId: "step2", toStepId: "step1" }],
      entryPointId: "step1",
    };

    expect(() => validateConnections(template)).toThrow(
      "All steps must be connected to the workflow"
    );
  });
});

describe("validateEntryPoint", () => {
  it("should throw an error if the entry point ID does not refer to an existing step", () => {
    const template = {
      steps: [{ id: "step1" }, { id: "step2" }],
      connections: [],
      entryPointId: "nonExistentStep",
    };

    expect(() => validateEntryPoint(template)).toThrow(
      "Entry point ID must refer to an existing step"
    );
  });

  it("should throw an error if the entry point is a target of any connection", () => {
    const template = {
      steps: [{ id: "step1" }, { id: "step2" }],
      connections: [{ fromStepId: "step2", toStepId: "step1" }],
      entryPointId: "step1",
    };

    expect(() => validateEntryPoint(template)).toThrow(
      "Entry point must not be a target of any connection"
    );
  });

  it("should not throw an error if the entry point is valid and not a target of any connection", () => {
    const template = {
      steps: [{ id: "step1" }, { id: "step2" }],
      connections: [{ fromStepId: "step1", toStepId: "step2" }],
      entryPointId: "step1",
    };

    expect(() => validateEntryPoint(template)).not.toThrow();
  });

  it("should handle templates with no connections and a valid entry point", () => {
    const template = {
      steps: [{ id: "step1" }],
      connections: [],
      entryPointId: "step1",
    };

    expect(() => validateEntryPoint(template)).not.toThrow();
  });
});

describe("validateSteps", () => {
  it("should throw an error if a step is missing required inputs", () => {
    const template = {
      steps: [
        {
          id: "step1",
          name: "Step 1",
          type: "typeA",
          visualizationMetadata: {
            position: { x: 0, y: 0 },
            data: { label: "Step 1" },
          },
        },
      ],
    };

    expect(() => validateSteps(template)).toThrow(
      "Step step1 is missing required inputs"
    );
  });

  it("should throw an error if a step has invalid visualization metadata", () => {
    const template = {
      steps: [
        {
          id: "step1",
          name: "Step 1",
          type: "typeA",
          inputs: {},
          visualizationMetadata: {
            position: { x: "invalid", y: 0 }, // Invalid x coordinate
            data: { label: "Step 1" },
          },
        },
      ],
    };

    expect(() => validateSteps(template)).toThrow(
      "Cannot validate visual metadata"
    );
  });

  it("should not throw an error for valid steps", () => {
    const template = {
      steps: [
        {
          id: "step1",
          name: "Step 1",
          type: "typeA",
          inputs: {},
          visualizationMetadata: {
            position: { x: 0, y: 0 },
            data: { label: "Step 1" },
          },
        },
      ],
    };

    expect(() => validateSteps(template)).not.toThrow();
  });
});

describe("validateTriggers", () => {
  it("should throw an error if no triggers are provided", () => {
    const template = {
      triggers: [],
    };

    expect(() => validateTriggers(template)).toThrow(
      "At least one trigger is required for the workflow"
    );
  });

  it("should throw an error if a trigger has invalid visualization metadata", () => {
    const template = {
      triggers: [
        {
          id: "trigger1",
          type: "http",
          inputs: {},
          visualizationMetadata: {
            position: { x: "invalid", y: 0 }, // Invalid x coordinate
            data: { label: "Trigger 1" },
          },
        },
      ],
    };

    expect(() => validateTriggers(template)).toThrow(
      "Cannot validate visual metadata"
    );
  });

  it("should not throw an error for valid triggers", () => {
    const template = {
      triggers: [
        {
          id: "trigger1",
          type: "http",
          inputs: {},
          visualizationMetadata: {
            position: { x: 0, y: 0 },
            data: { label: "Trigger 1" },
          },
        },
      ],
    };

    expect(() => validateTriggers(template)).not.toThrow();
  });
});
