export type PluginInfo = {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
};

export interface BasePlugin {
  /**
   * Retrieves plugin metadata, such as name and description.
   * @returns An object containing plugin metadata.
   */
  getPluginInfo(): PluginInfo;

  /**
   * Executes the plugin logic.
   * @param inputs - The inputs provided for this execution.
   * @returns The outputs of the plugin execution.
   */
  execute(inputs: Record<string, any>): Promise<Record<string, any>>;
}
