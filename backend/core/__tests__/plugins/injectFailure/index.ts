import { BasePlugin } from "../../../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";

const InputSchema = Type.Object({});
const OutputSchema = Type.Object({});
export type InjectFailureInput = Static<typeof InputSchema>;
export type InjectFailureOutput = Static<typeof OutputSchema>;

export default class InjectFailure implements BasePlugin {
  getPluginInfo() {
    return {
      id: "inject-failure",
      name: "Inject Failure",
      description: "A plugin that always throws an error when executed",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(): Promise<InjectFailureOutput> {
    throw new Error(
      "Injected failure: This plugin is designed to fail intentionally."
    );
  }
}
