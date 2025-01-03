import createClient from "openapi-fetch";
import type { paths } from "./schema";
const client = createClient<paths>({ baseUrl: "http://localhost:8001" });

export type WorkflowsList =
  paths["/api/v1/workflow-template/"]["get"]["responses"]["200"]["content"]["application/json"];

export class Client {
  health() {
    return client.GET("/health");
  }

  createTemplate(
    body: paths["/api/v1/workflow-template/"]["post"]["requestBody"]["content"]["application/json"]
  ) {
    return client.POST("/api/v1/workflow-template/", { body });
  }

  loadTemplates() {
    return client.GET("/api/v1/workflow-template/");
  }
}
