import { BasePlugin } from "../../basePlugin";
import { WorkflowContext } from "../../workflowContext";
import { Type, Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// UUID Generator Plugin
const UUIDOutputSchema = Type.Object({
  uuid: Type.String(),
});

export type UUIDOutput = Static<typeof UUIDOutputSchema>;

export default class UUIDGeneratorPlugin implements BasePlugin {
  getPluginInfo() {
    return {
      id: "uuid-generator",
      name: "UUID Generator",
      description: "Generates a UUID",
      inputs: Type.Object({}),
      outputs: UUIDOutputSchema,
    };
  }

  async execute(inputs: {}, context: WorkflowContext): Promise<UUIDOutput> {
    const uuid = crypto.randomUUID();
    return { uuid };
  }
}
