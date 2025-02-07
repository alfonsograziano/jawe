import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import WorkflowList from "./pages/WorkflowList.tsx";

import { BrowserRouter, Routes, Route } from "react-router";
import WorkflowRunDetailsPage from "./pages/WorkflowRunDetails.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/workflow/:id/runs/:runId"
          element={<WorkflowRunDetailsPage />}
        />

        <Route path="/" element={<WorkflowList />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
