import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TwoPanePage } from "./pages/TwoPanePage";
import { AlertRulesPage } from "./pages/AlertRulesPage";
import { LlmEnabledProvider } from "./contexts/LlmEnabledContext";

export function App() {
  return (
    <BrowserRouter>
      <LlmEnabledProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<TwoPanePage />} />
            <Route path="/webhooks/:id" element={<TwoPanePage />} />
            <Route path="/settings/alert-rules" element={<AlertRulesPage />} />
          </Route>
        </Routes>
      </LlmEnabledProvider>
    </BrowserRouter>
  );
}
