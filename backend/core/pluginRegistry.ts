import path from "path";
import fs from "fs/promises";
import { PluginInfo } from "./basePlugin";

export let pluginRegistry: PluginInfo[] = [];
export let pluginRegistryMap: Map<string, PluginInfo> = new Map();
async function loadPlugins(directory: string): Promise<PluginInfo[]> {
  const plugins = [];
  const files = await fs.readdir(directory);

  for (const file of files) {
    const pluginPath = path.join(directory, file);

    const stat = await fs.stat(pluginPath);

    if (stat.isDirectory()) {
      try {
        const modulePath = path.join(pluginPath, "index.ts");

        const pluginModule = await import(modulePath);

        if (pluginModule.default) {
          const instance = new pluginModule.default();
          const info = instance.getPluginInfo();

          plugins.push(info);
        }
      } catch (error) {
        console.log();
        console.error(`Error loading plugin at ${pluginPath}:`, error);
      }
    }
  }

  return plugins;
}
export const initPluginsRegistry = async (directory: string) => {
  const plugins = await loadPlugins(directory);
  pluginRegistry = [...plugins];
  plugins.map((plugin) => {
    pluginRegistryMap.set(plugin.id, plugin);
  });
};
