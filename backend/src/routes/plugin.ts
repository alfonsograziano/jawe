import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import { Static } from "@sinclair/typebox";
import { pluginRegistry } from "../../core/pluginRegistry";

const ListPluginsResponse = Type.Array(
  Type.Object({
    name: Type.String(),
    id: Type.String(),
    description: Type.String(),
  })
);

const GetPluginParams = Type.Object({
  id: Type.String(),
});

const GetPluginResponse = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  inputs: Type.Record(Type.String(), Type.Unknown()),
  outputs: Type.Record(Type.String(), Type.Unknown()),
});

const GetPluginErrorResponse = Type.Object({
  error: Type.String(),
});

export default async function plugin(app: FastifyInstance) {
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
      return reply.status(200).send(pluginRegistry);
    }
  );

  app.get<{
    Params: Static<typeof GetPluginParams>;
    Reply: Static<typeof GetPluginResponse | typeof GetPluginErrorResponse>;
  }>(
    "/:id",
    {
      schema: {
        params: GetPluginParams,
        response: {
          200: GetPluginResponse,
          404: GetPluginErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const plugin = pluginRegistry.find((p) => p.id === id);

      if (!plugin) {
        return reply
          .status(404)
          .send({ error: `Plugin with ID '${id}' not found.` });
      }

      return reply.status(200).send(plugin);
    }
  );
}
