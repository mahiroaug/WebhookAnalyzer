import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TwoPanePage } from "./pages/TwoPanePage";
import { AlertRulesPage } from "./pages/AlertRulesPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TwoPanePage />} />
          <Route path="/webhooks/:id" element={<TwoPanePage />} />
          <Route path="/settings/alert-rules" element={<AlertRulesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
