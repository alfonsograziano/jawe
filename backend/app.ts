import fastify, { FastifyServerOptions } from "fastify";
import routes from "./src/routes/index";
import fastifyFormBody from "@fastify/formbody";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import healthCheck from "./src/routes/healthcheck";
import { PrismaClient } from "@prisma/client";
import fastifyPrisma from "@joggr/fastify-prisma";
import fastifyCors from "@fastify/cors";

export async function build(opts?: FastifyServerOptions) {
  const app = fastify(opts).withTypeProvider<TypeBoxTypeProvider>();

  app.register(fastifyFormBody);

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "JAWE",
        description: "JAWE Backend API services",
        version: "0.1.0",
      },
      tags: [],
    },
  });

  app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
  });

  await app.register(fastifyPrisma, {
    client: new PrismaClient(),
  });

  await app.register(fastifyCors, {
    origin: true,
    methods: "*",
    allowedHeaders: "*",
  });
  app.register(healthCheck);

  app.register(routes, { prefix: "/api/v1" });

  return app;
}
