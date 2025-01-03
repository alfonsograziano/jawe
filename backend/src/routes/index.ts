import { FastifyInstance } from "fastify";
import workflowTemplateRoutes from "./template";
import pluginRoutes from "./plugin";

export default async function routes(app: FastifyInstance) {
  app.register(workflowTemplateRoutes, { prefix: "/workflow-template" });
  app.register(pluginRoutes, { prefix: "/plugin" });
}
