import { BasePlugin } from "../../../basePlugin";
import { Type, Static } from "@sinclair/typebox";

const InputSchema = Type.Object({});

const OutputSchema = Type.Object({
  hello: Type.String({ default: "world" }),
});

export type SayHelloInput = Static<typeof InputSchema>;
export type SayHelloOutput = Static<typeof OutputSchema>;

export default class SayHelloPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "say-hello-plugin",
      name: "Say Hello Plugin",
      description: "A simple plugin that outputs {hello: 'world'}",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(inputs: SayHelloInput): Promise<SayHelloOutput> {
    return { hello: "world" };
  }
}
