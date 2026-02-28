import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { TwoPanePage } from "./pages/TwoPanePage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TwoPanePage />} />
          <Route path="/webhooks/:id" element={<TwoPanePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
