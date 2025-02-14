import path from "path";
import fs from "fs/promises";
import { PluginInfo, BasePlugin } from "./basePlugin";
import { pathToFileURL } from 'url';

export type Plugin<T extends BasePlugin = BasePlugin> = PluginInfo & {
  default: new () => T;
};

export let pluginRegistry: Plugin[] = [];
export let pluginRegistryMap: Map<string, Plugin> = new Map();

async function loadPlugins(directory: string): Promise<Plugin[]> {
  const plugins: Plugin[] = [];
  const files = await fs.readdir(directory);

  for (const file of files) {
    const pluginPath = path.join(directory, file);

    const stat = await fs.stat(pluginPath);

    if (stat.isDirectory()) {
      try {
        const modulePath = path.join(pluginPath, "index.ts");


        // Convert the module path to a file:// URL
        const moduleURL = pathToFileURL(modulePath).href;

        // Dynamically import the plugin module
        const pluginModule = await import(moduleURL);

        // Ensure the default export is a constructor and matches BasePlugin
        if (
          pluginModule.default &&
          typeof pluginModule.default === "function"
        ) {
          const instance = new pluginModule.default();
          if (typeof instance.getPluginInfo === "function") {
            const info = instance.getPluginInfo();

            const plugin: Plugin = {
              ...info,
              default: pluginModule.default,
            };

            plugins.push(plugin);
          }
        }
      } catch (error) {
        console.error(`Error loading plugin at ${pluginPath}:`, error);
      }
    }
  }

  return plugins;
}

export const initPluginsRegistry = async (directory: string) => {
  const plugins = await loadPlugins(directory);
  pluginRegistry = [...plugins];
  plugins.forEach((plugin) => {
    pluginRegistryMap.set(plugin.id, plugin);
  });
};
