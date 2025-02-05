import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const InputSchema = Type.Object({}); // No input required
const OutputSchema = Type.Object({}); // No output produced

export type NoOpInput = Static<typeof InputSchema>;
export type NoOpOutput = Static<typeof OutputSchema>;

export default class NoOp implements BasePlugin {
  getPluginInfo() {
    return {
      id: "no-op",
      name: "No Operation",
      description:
        "A plugin that does nothing and can be used as a placeholder.",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: NoOpInput): Promise<NoOpOutput> {
    const isValid = Value.Check(InputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }
    return {}; // No operation performed
  }
}
