import { describe, test, expect, beforeEach, vi } from "vitest";
import Fastify, { FastifyInstance } from "fastify";
import webhook from "../src/routes/webhook";

const mockPrisma = {
  trigger: {
    findFirst: vi.fn(),
  },
  triggerRun: {
    create: vi.fn(),
  },
  workflowRun: {
    create: vi.fn(),
  },
};

const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify();
  app.decorate("prisma", mockPrisma as unknown as any);
  await app.register(webhook);
  return app;
};

describe("Webhook route", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  test("should return 404 if no trigger is found", async () => {
    mockPrisma.trigger.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: "POST",
      url: "/webhook/test-trigger",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "Trigger not found" });
  });

  test("should return 401 if authorization token is missing or incorrect", async () => {
    mockPrisma.trigger.findFirst.mockResolvedValue({
      id: "trigger-id",
      inputs: { authorization: "expected-token" },
      workflowTemplateId: "template-id",
    });

    const response = await app.inject({
      method: "POST",
      url: "/webhook/test-trigger",
      headers: { authorization: "wrong-token" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "Unauthorized" });
  });

  test("should create a triggerRun and workflowRun when a valid request is made", async () => {
    mockPrisma.trigger.findFirst.mockResolvedValue({
      id: "trigger-id",
      inputs: {},
      workflowTemplateId: "template-id",
    });

    mockPrisma.triggerRun.create.mockResolvedValue({ id: "triggerRun-id" });
    mockPrisma.workflowRun.create.mockResolvedValue({ id: "workflowRun-id" });

    const response = await app.inject({
      method: "POST",
      url: "/webhook/test-trigger",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ workflowRunId: "workflowRun-id" });
    expect(mockPrisma.triggerRun.create).toHaveBeenCalled();
    expect(mockPrisma.workflowRun.create).toHaveBeenCalled();
  });

  test("should redirect if redirectUrl is provided in trigger inputs", async () => {
    mockPrisma.trigger.findFirst.mockResolvedValue({
      id: "trigger-id",
      inputs: { redirectUrl: "https://example.com" },
      workflowTemplateId: "template-id",
    });

    mockPrisma.triggerRun.create.mockResolvedValue({ id: "triggerRun-id" });
    mockPrisma.workflowRun.create.mockResolvedValue({ id: "workflowRun-id" });

    const response = await app.inject({
      method: "POST",
      url: "/webhook/test-trigger",
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("https://example.com");
  });

  test("should return 500 on internal server error", async () => {
    mockPrisma.trigger.findFirst.mockRejectedValue(new Error("Database error"));

    const response = await app.inject({
      method: "POST",
      url: "/webhook/test-trigger",
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: "Internal Server Error" });
  });
});
