import { BasePlugin } from "../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const MillisecondsType = Type.Number({
  title: "Milliseconds",
  minimum: 0,
});

const InputSchema = Type.Object({
  milliseconds: MillisecondsType,
});

const ResolvedInputSchema = InputSchema;

const OutputSchema = Type.Object({});

export type WaitInput = Static<typeof ResolvedInputSchema>;
export type WaitOutput = Static<typeof OutputSchema>;

export default class Wait implements BasePlugin {
  getPluginInfo() {
    return {
      id: "wait",
      name: "Wait",
      description:
        "A plugin that pauses for a specified number of milliseconds",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: WaitInput): Promise<WaitOutput> {
    const isValid = Value.Check(ResolvedInputSchema, inputs);

    if (!isValid) {
      const errors = Value.Errors(ResolvedInputSchema, inputs);
      throw new Error("Invalid input provided");
    }

    const { milliseconds } = inputs;

    await new Promise((resolve) => setTimeout(resolve, milliseconds));

    return {};
  }
}
