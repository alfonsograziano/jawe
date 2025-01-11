import { BasePlugin } from "../../../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const InputSchema = Type.Object({
  targetStepId: Type.String(),
});

const OutputSchema = Type.Object({
  nextStepId: Type.String(),
});

export type ConditionalInput = Static<typeof InputSchema>;
export type ConditionalOutput = Static<typeof OutputSchema>;

export default class ConditionalPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "conditional",
      name: "Conditional plugin",
      description:
        "A simple conditional plugin with no inputs and a success output",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: ConditionalInput): Promise<ConditionalOutput> {
    const isValid = Value.Check(InputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return { nextStepId: inputs.targetStepId };
  }
}
