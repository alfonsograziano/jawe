import createClient from "openapi-fetch";
import type { paths } from "./schema";
const client = createClient<paths>({ baseUrl: "http://localhost:7001" });

export type WorkflowsList =
  paths["/api/v1/workflow-template/"]["get"]["responses"]["200"]["content"]["application/json"];

export type WorkflowTemplate =
  paths["/api/v1/workflow-template/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type PluginsInfoList =
  paths["/api/v1/plugin/"]["get"]["responses"]["200"]["content"]["application/json"];

export type PluginDetails =
  paths["/api/v1/plugin/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type TriggersInfoList =
  paths["/api/v1/trigger/"]["get"]["responses"]["200"]["content"]["application/json"];

export type TriggerDetails =
  paths["/api/v1/trigger/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

export type WorkflowStep = NonNullable<WorkflowTemplate["steps"]>[number];

export type WorkflowsRunsList =
  paths["/api/v1/runs/{templateId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type WorkflowRunData =
  paths["/api/v1/run/{workflowRunId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type WorkflowRunStepData = NonNullable<
  WorkflowRunData["stepRuns"]
>[number];

export type WorkflowRunTriggerRunData = NonNullable<
  WorkflowRunData["triggerRun"]
>;

export class Client {
  health() {
    return client.GET("/health");
  }

  createTemplate(
    body: paths["/api/v1/workflow-template/"]["post"]["requestBody"]["content"]["application/json"]
  ) {
    return client.POST("/api/v1/workflow-template/", { body });
  }

  importTemplate(
    body: paths["/api/v1/workflow-template/import"]["post"]["requestBody"]["content"]["application/json"]
  ) {
    return client.POST("/api/v1/workflow-template/import", { body });
  }

  updateTemplate(
    templateId: string,
    body: paths["/api/v1/workflow-template/{id}"]["put"]["requestBody"]["content"]["application/json"]
  ) {
    return client.PUT("/api/v1/workflow-template/{id}", {
      params: { path: { id: templateId } },
      body,
    });
  }

  loadTemplates() {
    return client.GET("/api/v1/workflow-template/");
  }

  loadTemplateDetails(id: string) {
    return client.GET("/api/v1/workflow-template/{id}", {
      params: { path: { id } },
    });
  }

  loadPlugins() {
    return client.GET("/api/v1/plugin/");
  }

  loadTriggers() {
    return client.GET("/api/v1/trigger/");
  }

  deleteTemplate(templateId: string) {
    return client.DELETE("/api/v1/workflow-template/{id}", {
      params: { path: { id: templateId } },
    });
  }

  getPluginById(pluginId: string) {
    return client.GET("/api/v1/plugin/{id}", {
      params: { path: { id: pluginId } },
    });
  }

  publishTemplate(templateId: string) {
    return client.PATCH("/api/v1/workflow-template/{id}/publish", {
      params: { path: { id: templateId } },
    });
  }

  duplicateTemplate(templateId: string) {
    return client.POST("/api/v1/workflow-template/{id}/duplicate", {
      params: { path: { id: templateId } },
    });
  }

  getTriggerById(triggerId: string) {
    return client.GET("/api/v1/trigger/{id}", {
      params: { path: { id: triggerId } },
    });
  }

  getRunsFromTemplate(templateId: string) {
    return client.GET("/api/v1/runs/{templateId}", {
      params: { path: { templateId } },
    });
  }

  getRunDetails(runId: string) {
    return client.GET("/api/v1/run/{workflowRunId}", {
      params: { path: { workflowRunId: runId } },
    });
  }

  updateWorkflowTrigger(
    triggerId: string,
    body: paths["/api/v1/trigger/workflow/{id}"]["post"]["requestBody"]["content"]["application/json"]
  ) {
    return client.POST("/api/v1/trigger/workflow/{id}", {
      params: { path: { id: triggerId } },
      body,
    });
  }
}
