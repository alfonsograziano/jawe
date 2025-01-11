import { describe, it, expect } from "vitest";
import ConditionalPlugin from "../index";

const plugin = new ConditionalPlugin();

describe("Conditional Plugin", () => {
  it("should return the correct plugin info", () => {
    const pluginInfo = plugin.getPluginInfo();
    expect(JSON.parse(JSON.stringify(pluginInfo))).toEqual({
      id: "conditional-plugin",
      name: "Conditional Plugin",
      description:
        "A plugin that evaluates rules against facts and determines the next step",
      inputs: {
        type: "object",
        properties: {
          facts: { type: "object", additionalProperties: true, properties: {} },
          rules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                conditions: {
                  type: "object",
                  additionalProperties: true,
                  properties: {},
                },
                event: {
                  type: "object",
                  properties: {
                    type: { type: "string", minLength: 1 },
                    params: {
                      type: "object",
                      additionalProperties: true,
                      properties: {},
                    },
                  },
                  required: ["type", "params"],
                },
              },
              required: ["conditions", "event"],
            },
          },
        },
        required: ["facts", "rules"],
      },
      outputs: {
        type: "object",
        properties: {
          nextStepId: { type: "string", minLength: 1 },
        },
        additionalProperties: true,
      },
    });
  });

  it("should determine the correct next step", async () => {
    const inputs = {
      facts: { temperature: 30 },
      rules: [
        {
          conditions: {
            any: [
              {
                fact: "temperature",
                operator: "greaterThan",
                value: 25,
              },
            ],
          },
          event: {
            type: "nextStep",
            params: { stepId: "step-hot" },
          },
        },
      ],
    };

    const result = await plugin.execute(inputs);

    expect(result).toEqual({
      nextStepId: "step-hot",
      nextStep: {
        stepId: "step-hot",
      },
    });
  });

  it("should throw an error if input schema is invalid", async () => {
    const invalidInputs = {
      facts: {},
      rules: "invalid-rules",
    };

    await expect(plugin.execute(invalidInputs as any)).rejects.toThrowError(
      "Invalid input provided"
    );
  });

  it("should handle cases where no next step is determined", async () => {
    const inputs = {
      facts: { temperature: 15 },
      rules: [
        {
          conditions: {
            any: [
              {
                fact: "temperature",
                operator: "greaterThan",
                value: 25,
              },
            ],
          },
          event: {
            type: "nextStep",
            params: { stepId: "step-hot" },
          },
        },
      ],
    };

    const result = await plugin.execute(inputs);

    expect(result).toEqual({ nextStepId: undefined });
  });

  it("should output 'AFTER_18' if age > 18 and 'UNDER_18' otherwise", async () => {
    const inputs = {
      facts: { age: 20 },
      rules: [
        {
          conditions: {
            any: [
              {
                fact: "age",
                operator: "greaterThan",
                value: 18,
              },
            ],
          },
          event: {
            type: "output",
            params: { value: "AFTER_18" },
          },
        },
        {
          conditions: {
            any: [
              {
                fact: "age",
                operator: "lessThanInclusive",
                value: 18,
              },
            ],
          },
          event: {
            type: "output",
            params: { value: "UNDER_18" },
          },
        },
      ],
    };

    const result = await plugin.execute(inputs);

    expect(result).toEqual({ output: { value: "AFTER_18" } });
  });
});
