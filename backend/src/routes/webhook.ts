import { FastifyInstance } from "fastify";

type WorkflowRunResponse = {
  workflowRunId: string;
};

type ErrorResponse = {
  error: string;
};

type TriggerInputs = {
  authorization?: string;
  redirectUrl?: string;
};

export default async function webhook(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/webhook/*",
    handler: async (request, reply) => {
      try {
        const method = request.method as string;
        const triggerUrl = request.url.split("/webhook/")[1];

        const trigger = await app.prisma.trigger.findFirst({
          where: {
            AND: [
              { type: "webhook" },
              {
                inputs: {
                  path: ["url"],
                  equals: triggerUrl,
                },
              },
              {
                inputs: {
                  path: ["method"],
                  equals: method,
                },
              },
            ],
          },
        });

        if (!trigger) {
          const errorResponse: ErrorResponse = { error: "Trigger not found" };
          return reply.code(404).send(errorResponse);
        }

        const webhookTriggerInputs = trigger.inputs as TriggerInputs;
        // Authorization check
        const expectedAuthorization = webhookTriggerInputs.authorization;
        if (expectedAuthorization) {
          const authorizationToken = request.headers.authorization;
          if (
            !authorizationToken ||
            authorizationToken !== expectedAuthorization
          ) {
            const errorResponse: ErrorResponse = { error: "Unauthorized" };
            return reply.code(401).send(errorResponse);
          }
        }

        const triggerRun = await app.prisma.triggerRun.create({
          data: {
            triggerId: trigger.id,
            output: {
              request: {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body
                  ? JSON.parse(JSON.stringify(request.body))
                  : null,
                query: request.query
                  ? JSON.parse(JSON.stringify(request.query))
                  : null,
                params: request.params
                  ? JSON.parse(JSON.stringify(request.params))
                  : null,
              },
            },
          },
        });

        const workflowRun = await app.prisma.workflowRun.create({
          data: {
            triggerRunId: triggerRun.id,
            templateId: trigger.workflowTemplateId,
            status: "PENDING",
          },
        });

        // Handle optional redirect
        const redirectUrl = webhookTriggerInputs.redirectUrl;
        if (redirectUrl) {
          reply.redirect(redirectUrl);
        } else {
          reply.send({ workflowRunId: workflowRun.id });
        }
      } catch (error) {
        console.error("Error handling trigger:", error);
        const errorResponse: ErrorResponse = { error: "Internal Server Error" };
        reply.code(500).send(errorResponse);
      }
    },
  });
}
