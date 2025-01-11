import { BasePlugin } from "../../../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const InputSchema = Type.Object({});

const OutputSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.String(),
});

export type ExampleInput = Static<typeof InputSchema>;
export type ExampleOutput = Static<typeof OutputSchema>;

export default class ExamplePlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "example-plugin",
      name: "Example plugin",
      description: "A simple plugin with no inputs and a success output",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: ExampleInput): Promise<ExampleOutput> {
    const isValid = Value.Check(InputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return { success: true, data: "Step executed..." };
  }
}
