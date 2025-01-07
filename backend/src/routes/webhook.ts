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

type Trigger = {
  inputs?: TriggerInputs;
  workflowTemplateId: string;
};

export default async function webhook(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/webhook/*",
    handler: async (request, reply) => {
      try {
        const method = request.method as string;
        const triggerUrl = request.url.split("/webhook/")[1];

        const trigger = (await app.prisma.trigger.findFirst({
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
        })) as Trigger;

        if (!trigger) {
          const errorResponse: ErrorResponse = { error: "Trigger not found" };
          return reply.code(404).send(errorResponse);
        }

        // Authorization check
        const expectedAuthorization = trigger.inputs?.authorization;
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

        const workflowRun = await app.prisma.workflowRun.create({
          data: {
            templateId: trigger.workflowTemplateId,
            status: "PENDING",
            startTime: new Date(),
          },
        });

        const response: WorkflowRunResponse = { workflowRunId: workflowRun.id };

        // Handle optional redirect
        const redirectUrl = trigger.inputs?.redirectUrl;
        if (redirectUrl) {
          reply.redirect(redirectUrl);
        } else {
          reply.send(response);
        }
      } catch (error) {
        console.error("Error handling trigger:", error);
        const errorResponse: ErrorResponse = { error: "Internal Server Error" };
        reply.code(500).send(errorResponse);
      }
    },
  });
}
