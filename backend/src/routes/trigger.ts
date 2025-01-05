import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";
import { triggerRegistry } from "../../core/triggerRegistry";

const ListTriggersResponse = Type.Array(
  Type.Object({
    name: Type.String(),
    id: Type.String(),
    description: Type.String(),
  })
);

const GetTriggerParams = Type.Object({
  id: Type.String(),
});

const GetTriggerResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
});

const GetTriggerErrorResponse = Type.Object({
  error: Type.String(),
});

export default async function trigger(app: FastifyInstance) {
  app.get<{
    Reply: Static<typeof ListTriggersResponse>;
  }>(
    "/",
    {
      schema: {
        response: { 200: ListTriggersResponse },
      },
    },
    async (request, reply) => {
      return reply.status(200).send(triggerRegistry);
    }
  );

  app.get<{
    Params: Static<typeof GetTriggerParams>;
    Reply: Static<typeof GetTriggerResponse | typeof GetTriggerErrorResponse>;
  }>(
    "/:id",
    {
      schema: {
        params: GetTriggerParams,
        response: {
          200: GetTriggerResponse,
          404: GetTriggerErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const trigger = triggerRegistry.find((t) => t.id === id);

      if (!trigger) {
        return reply
          .status(404)
          .send({ error: `Trigger with ID '${id}' not found.` });
      }

      return reply.status(200).send(trigger);
    }
  );
}
