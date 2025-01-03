import { BasePlugin } from "../../basePlugin";
import { WorkflowContext } from "../../workflowContext";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// Random Number Generator Plugin
const RandomNumberInputSchema = Type.Object({
  min: Type.Number(),
  max: Type.Number(),
});

const RandomNumberOutputSchema = Type.Object({
  randomNumber: Type.Number(),
});

export type RandomNumberInput = Static<typeof RandomNumberInputSchema>;
export type RandomNumberOutput = Static<typeof RandomNumberOutputSchema>;

export default class RandomNumberGeneratorPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "random-number-generator",
      name: "Random Number Generator",
      description: "Generates a random number within a specified range",
      inputs: RandomNumberInputSchema,
      outputs: RandomNumberOutputSchema,
    };
  }

  async execute(
    inputs: RandomNumberInput,
    context: WorkflowContext
  ): Promise<RandomNumberOutput> {
    const isValid = Value.Check(RandomNumberInputSchema, inputs);
    if (!isValid) {
      throw new Error("Invalid input provided");
    }

    const randomNumber =
      Math.floor(Math.random() * (inputs.max - inputs.min + 1)) + inputs.min;

    return { randomNumber };
  }
}
