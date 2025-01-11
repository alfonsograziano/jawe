import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Engine, RuleProperties } from "json-rules-engine";
import { Value } from "@sinclair/typebox/value";

const InputSchema = Type.Object({
  facts: Type.Object({}, { additionalProperties: true }),
  rules: Type.Array(
    Type.Object({
      conditions: Type.Object({}, { additionalProperties: true }),
      event: Type.Object({
        type: Type.String({ minLength: 1 }),
        params: Type.Object({}, { additionalProperties: true }),
      }),
    })
  ),
});

const OutputSchema = Type.Object(
  {
    nextStepId: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: true }
);

export type ConditionalPluginInput = Static<typeof InputSchema>;
export type ConditionalPluginOutput = Static<typeof OutputSchema>;

export default class ConditionalPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "conditional-plugin",
      name: "Conditional Plugin",
      description:
        "A plugin that evaluates rules against facts and determines the next step",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(
    inputs: ConditionalPluginInput
  ): Promise<ConditionalPluginOutput> {
    const isValid = Value.Check(InputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    const engine = new Engine();

    inputs.rules.forEach((rule) => {
      engine.addRule(rule as RuleProperties);
    });

    const results = await engine.run(inputs.facts);

    const eventTypesAsObj: Record<string, unknown> = {};
    results.events.forEach((event) => {
      eventTypesAsObj[event.type] = event.params;
    });

    const nextStepEvent = results.events.find(
      (event) => event.type === "nextStep"
    );

    if (nextStepEvent && nextStepEvent.params && nextStepEvent.params.stepId) {
      return {
        nextStepId: nextStepEvent.params.stepId,
        ...eventTypesAsObj,
      };
    }
    return eventTypesAsObj;
  }
}
