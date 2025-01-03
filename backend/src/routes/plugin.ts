import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ListPluginsResponse = Type.Array(
  Type.Object({
    name: Type.String(),
    id: Type.String(),
    description: Type.String(),
  })
);

async function loadPlugins(directory: string) {
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

export default async function workflowTemplate(app: FastifyInstance) {
  const pluginsDir = path.resolve(__dirname, "..", "..", "plugins");

  const formattedWorkflows = await loadPlugins(pluginsDir);

  app.get<{
    Reply: Static<typeof ListPluginsResponse>;
  }>(
    "/",
    {
      schema: {
        response: { 200: ListPluginsResponse },
      },
    },
    async (request, reply) => {
      return reply.status(200).send(formattedWorkflows);
    }
  );
}
