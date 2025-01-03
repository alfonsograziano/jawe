import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Edit from "./pages/Edit.tsx";

import { BrowserRouter, Routes, Route } from "react-router";
import WorkflowTemplateDetails from "./pages/WorkflowTemplateDetails.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/edit" element={<Edit />} />
        <Route
          path="/workflow-template/:id"
          element={<WorkflowTemplateDetails />}
        />
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
