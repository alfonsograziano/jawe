import { FastifyInstance } from "fastify";
import workflowTemplateRoutes from "./template";

export default async function routes(app: FastifyInstance) {
  app.register(workflowTemplateRoutes, { prefix: "/workflow-template" });
}
