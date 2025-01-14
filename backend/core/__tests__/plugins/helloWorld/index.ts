import { BasePlugin } from "../../../../core/basePlugin";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { enhanceFieldSchemaWithInputSource } from "../../../../core/utils/buildDynamicInputField";

const NameType = Type.String({ title: "Name" });

const InputSchema = Type.Object({
  name: enhanceFieldSchemaWithInputSource(NameType),
});

const ResolvedInputSchema = Type.Object({
  name: NameType,
});

const OutputSchema = Type.Object({
  greetings: Type.String({ minLength: 1 }),
});

export type HelloWorldInput = Static<typeof ResolvedInputSchema>;
export type HelloWorldOutput = Static<typeof OutputSchema>;

export default class HelloWorld implements BasePlugin {
  getPluginInfo() {
    return {
      id: "hello-world",
      name: "Hello World",
      description: "A plugin that takes a name as input and returns greetings",
      inputs: InputSchema, // This is the input for the user
      outputs: OutputSchema,
    };
  }

  async execute(inputs: HelloWorldInput): Promise<HelloWorldOutput> {
    const isValid = Value.Check(ResolvedInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    return {
      greetings: `Hello ${inputs.name}`,
    };
  }
}
