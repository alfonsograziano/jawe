import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import WorkflowList from "./pages/WorkflowList.tsx";

import { BrowserRouter, Routes, Route } from "react-router";
import WorkflowTemplateDetails from "./pages/WorkflowTemplateDetails.tsx";
import WorkflowRunsPage from "./pages/WorkflowRuns.tsx";
import WorkflowRunDetailsPage from "./pages/WorkflowRunDetails.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/workflow/:id" element={<WorkflowTemplateDetails />} />
        <Route path="/workflow/:id/runs" element={<WorkflowRunsPage />} />
        <Route
          path="/workflow/:id/runs/:runId"
          element={<WorkflowRunDetailsPage />}
        />

        <Route path="/" element={<WorkflowList />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
