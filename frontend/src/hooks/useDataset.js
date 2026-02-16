import { useState, useEffect } from "react";
import {
  uploadDataset,
  fetchCurves,
  runAIAnalysis,
} from "../services/api";

export default function useDataset() {
  const [datasetId, setDatasetId] = useState(null);
  const [curves, setCurves] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selection state — lives here so it persists across route changes
  const [selectedWell, setSelectedWell] = useState(null);
  const [selectedCurves, setSelectedCurves] = useState([]);
  const [depthRange, setDepthRange] = useState({ from: "", to: "" });
  const [scaleModes, setScaleModes] = useState({});

  const upload = async (file) => {
    try {
      setLoading(true);
      setError(null);
      setCurves(null);
      setAnalysis(null);
      setSelectedWell(null);
      setSelectedCurves([]);
      setDepthRange({ from: "", to: "" });
      setScaleModes({});

      const data = await uploadDataset(file);
      setDatasetId(data.dataset_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!datasetId) return;

    const loadCurves = async () => {
      try {
        setLoading(true);
        const data = await fetchCurves(datasetId);
        setCurves(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCurves();
  }, [datasetId]);

  const analyze = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const data = await runAIAnalysis(datasetId, payload);
      setAnalysis(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDatasetId(null);
    setCurves(null);
    setAnalysis(null);
    setError(null);
    setSelectedWell(null);
    setSelectedCurves([]);
    setDepthRange({ from: "", to: "" });
    setScaleModes({});
  };

  return {
    datasetId,
    curves,
    analysis,
    loading,
    error,
    selectedWell,
    setSelectedWell,
    selectedCurves,
    setSelectedCurves,
    depthRange,
    setDepthRange,
    scaleModes,
    setScaleModes,
    upload,
    analyze,
    reset,
  };
}
