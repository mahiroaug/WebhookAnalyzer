import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WebhookListPage } from "./pages/WebhookListPage";
import { WebhookDetailPage } from "./pages/WebhookDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WebhookListPage />} />
        <Route path="/webhooks/:id" element={<WebhookDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
