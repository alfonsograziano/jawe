import { WorkflowContext } from "./workflowContext";

export interface BasePlugin {
  /**
   * Retrieves plugin metadata, such as name and description.
   * @returns An object containing plugin metadata.
   */
  getPluginInfo(): {
    id: string;
    name: string;
    description: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
  };

  /**
   * Executes the plugin logic.
   * @param inputs - The inputs provided for this execution.
   * @param context - The workflow context including templates and current state.
   * @returns The outputs of the plugin execution.
   */
  execute(
    inputs: Record<string, any>,
    context: WorkflowContext
  ): Promise<Record<string, any>>;
}
