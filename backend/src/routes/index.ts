import { FastifyInstance } from "fastify";
import workflowTemplateRoutes from "./template";
import pluginRoutes from "./plugin";
import triggerRoutes from "./trigger";
import workflowRun from "./workflowRun";

import webhook from "./webhook";

export default async function routes(app: FastifyInstance) {
  app.register(workflowTemplateRoutes, { prefix: "/workflow-template" });
  app.register(pluginRoutes, { prefix: "/plugin" });
  app.register(triggerRoutes, { prefix: "/trigger" });
  app.register(workflowRun);

  app.register(webhook);
}
