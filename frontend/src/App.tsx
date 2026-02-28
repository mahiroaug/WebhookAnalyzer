import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WebhookListPage } from "./pages/WebhookListPage";
import { WebhookDetailPage } from "./pages/WebhookDetailPage";
import { EventTypeGroupPage } from "./pages/EventTypeGroupPage";
import { SchemaEstimatePage } from "./pages/SchemaEstimatePage";
import { ComparePage } from "./pages/ComparePage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WebhookListPage />} />
        <Route path="/by-event-type" element={<EventTypeGroupPage />} />
        <Route path="/schema" element={<SchemaEstimatePage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/webhooks/:id" element={<WebhookDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
