import "fastify";
import CronTriggerManager from "./core/cronTrigger";

declare module "fastify" {
  interface FastifyInstance {
    cronManager: CronTriggerManager;
  }
}
