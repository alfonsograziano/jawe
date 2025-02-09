import { describe, it, expect } from "vitest";
import ConditionalPlugin from "../index";

const plugin = new ConditionalPlugin();

describe("Conditional Plugin", () => {
  it("should return the correct plugin info", () => {
    const pluginInfo = plugin.getPluginInfo();
    const parsedPluginInfo = JSON.parse(JSON.stringify(pluginInfo));

    expect(parsedPluginInfo).toHaveProperty("id", "conditional-plugin");
    expect(parsedPluginInfo).toHaveProperty("name", "Conditional Plugin");
    expect(parsedPluginInfo).toHaveProperty(
      "description",
      "A plugin that evaluates rules against facts and determines the next step"
    );

    expect(parsedPluginInfo).toHaveProperty("inputs");
    expect(parsedPluginInfo).toHaveProperty("outputs");
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

    expect(result).toEqual({ nextStepId: null });
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

    expect(result).toEqual({ output: { value: "AFTER_18" }, nextStepId: null });
  });
});
