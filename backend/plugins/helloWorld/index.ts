import { BasePlugin } from "../../basePlugin";
import { WorkflowContext } from "../../workflowContext";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const HelloWorldInputSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

export type HelloWorldInput = Static<typeof HelloWorldInputSchema>;

export default class HelloWorld implements BasePlugin {
  getPluginInfo() {
    return {
      name: "HelloWorld",
      description: "A plugin that takes a name as input and returns greetings",
    };
  }

  async execute(inputs: HelloWorldInput, context: WorkflowContext) {
    const isValid = Value.Check(HelloWorldInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return {
      greetings: `Hello ${inputs.name}`,
    };
  }
}
