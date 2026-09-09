import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import StoreMapPage from "@/pages/StoreMap/StoreMapPage";
import NotFoundPage from "@/pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<StoreMapPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
