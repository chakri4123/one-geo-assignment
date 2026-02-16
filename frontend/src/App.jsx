import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DatasetProvider } from "./context/DatasetContext";
import Dashboard from "./pages/Dashboard";
import AnalysisPage from "./pages/AnalysisPage";

function App() {
  return (
    <BrowserRouter>
      <DatasetProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Routes>
      </DatasetProvider>
    </BrowserRouter>
  );
}

export default App;
