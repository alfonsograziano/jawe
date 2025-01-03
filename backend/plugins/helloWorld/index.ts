import { BasePlugin } from "../../basePlugin";
import { WorkflowContext } from "../../workflowContext";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const InputSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

const OutputSchema = Type.Object({
  greetings: Type.String({ minLength: 1 }),
});

export type HelloWorldInput = Static<typeof InputSchema>;
export type HelloWorldOutput = Static<typeof OutputSchema>;

export default class HelloWorld implements BasePlugin {
  getPluginInfo() {
    return {
      id: "hello-world",
      name: "Hello World",
      description: "A plugin that takes a name as input and returns greetings",
      inputs: InputSchema,
      outputs: OutputSchema,
    };
  }

  async execute(
    inputs: HelloWorldInput,
    context: WorkflowContext
  ): Promise<HelloWorldOutput> {
    const isValid = Value.Check(InputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return {
      greetings: `Hello ${inputs.name}`,
    };
  }
}
