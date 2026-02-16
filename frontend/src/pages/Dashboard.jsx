import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDatasetContext } from "../context/DatasetContext";
import FileUpload from "../components/FileUpload";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import WellLogViewer from "../components/WellLogViewer";
import CurveSelector from "../components/CurveSelector";
import MainLayout from "../layouts/MainLayout";
import Chatbot from "../components/Chatbot";

export default function Dashboard() {
  const {
    datasetId,
    curves,
    loading,
    error,
    upload,
    analyze,
    selectedWell,
    setSelectedWell,
    selectedCurves,
    setSelectedCurves,
    depthRange,
    setDepthRange,
    scaleModes,
    setScaleModes,
  } = useDatasetContext();

  const navigate = useNavigate();

  const availableWells = curves ? ["Well-1"] : [];

  const availableCurves = useMemo(() => {
    if (!curves || !curves.curves) return [];
    return Object.keys(curves.curves).filter(
      (name) => !["TIME", "DATE"].includes(name.toUpperCase())
    );
  }, [curves]);

  // Compute actual depth bounds from loaded data
  const depthBounds = useMemo(() => {
    if (!curves || !curves.depth || curves.depth.length === 0)
      return { min: 0, max: 10000 };
    const validDepths = curves.depth.filter((d) => d !== null && !isNaN(d));
    return {
      min: Math.floor(Math.min(...validDepths)),
      max: Math.ceil(Math.max(...validDepths)),
    };
  }, [curves]);

  // Auto-populate depth range when curves first load (only if empty)
  useEffect(() => {
    if (curves && curves.depth && depthRange.from === "" && depthRange.to === "") {
      setDepthRange({
        from: depthBounds.min,
        to: depthBounds.max,
      });
    }
  }, [curves, depthBounds]);

  const hasSelection = selectedWell && selectedCurves.length > 0;

  const handleResetSelections = () => {
    setSelectedCurves([]);
    setDepthRange({ from: depthBounds.min, to: depthBounds.max });
    setScaleModes({});
  };

  const handleAnalyze = async () => {
    const payload = {
      well: selectedWell || null,
      curves: selectedCurves.length > 0 ? selectedCurves : null,
      depthRange: null,
    };

    if (depthRange.from !== "" && depthRange.to !== "") {
      payload.depthRange = {
        from: Number(depthRange.from),
        to: Number(depthRange.to),
      };
    }

    const result = await analyze(payload);
    if (result) {
      navigate("/analysis");
    }
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-4 gap-6">
        {/* LEFT PANEL */}
        <div className="col-span-1 space-y-6">
          {/* Upload */}
          <div className="bg-white rounded-lg shadow p-5 space-y-4">
            <h3 className="text-lg font-semibold">Dataset Upload</h3>
            <FileUpload onUpload={upload} loading={loading} />

            {datasetId && (
              <div className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                {datasetId}
              </div>
            )}
          </div>

          {/* Configuration */}
          {datasetId && curves && (
            <div className="bg-white rounded-lg shadow p-5 space-y-6">
              <h3 className="text-lg font-semibold">Configuration</h3>

              {/* Well */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Well</label>
                <select
                  value={selectedWell || ""}
                  onChange={(e) => setSelectedWell(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="" disabled>
                    Choose Well
                  </option>
                  {availableWells.map((well) => (
                    <option key={well} value={well}>
                      {well}
                    </option>
                  ))}
                </select>
              </div>

              {/* Curves */}
              {selectedWell && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Curves</label>
                  <CurveSelector
                    availableCurves={availableCurves}
                    selectedCurves={selectedCurves}
                    setSelectedCurves={setSelectedCurves}
                  />
                </div>
              )}

              {/* Axis Scale */}
              {selectedCurves.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Axis Scale</label>
                  <div className="space-y-2">
                    {selectedCurves.map((curve) => (
                      <div
                        key={curve}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{curve}</span>
                        <select
                          value={scaleModes[curve] || "log"}
                          onChange={(e) =>
                            setScaleModes({
                              ...scaleModes,
                              [curve]: e.target.value,
                            })
                          }
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="log">Log</option>
                          <option value="linear">Linear</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Depth Range */}
              {selectedWell && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Depth Range</label>

                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400">From</label>
                      <input
                        type="number"
                        value={depthRange.from}
                        min={depthBounds.min}
                        max={depthBounds.max}
                        onChange={(e) =>
                          setDepthRange({
                            ...depthRange,
                            from: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-400">To</label>
                      <input
                        type="number"
                        value={depthRange.to}
                        min={depthBounds.min}
                        max={depthBounds.max}
                        onChange={(e) =>
                          setDepthRange({
                            ...depthRange,
                            to: e.target.value,
                          })
                        }
                        className="w-full border rounded p-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={depthBounds.min}
                      max={depthBounds.max}
                      value={depthRange.from || depthBounds.min}
                      onChange={(e) =>
                        setDepthRange({
                          ...depthRange,
                          from: Number(e.target.value),
                        })
                      }
                      className="w-full accent-green-600"
                    />
                    <input
                      type="range"
                      min={depthBounds.min}
                      max={depthBounds.max}
                      value={depthRange.to || depthBounds.max}
                      onChange={(e) =>
                        setDepthRange({
                          ...depthRange,
                          to: Number(e.target.value),
                        })
                      }
                      className="w-full accent-green-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{depthBounds.min}</span>
                      <span>{depthBounds.max}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {hasSelection && (
                <div className="space-y-3 pt-4 border-t">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                  >
                    Run AI Analysis
                  </button>

                  <button
                    onClick={handleResetSelections}
                    className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition"
                  >
                    Reset Selection
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-lg shadow p-4">
              <Loader />
            </div>
          )}

          {error && (
            <div className="bg-white rounded-lg shadow p-4">
              <ErrorMessage message={error} />
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-3">
          <div className="bg-white rounded-lg shadow p-5 h-full">
            {!datasetId && (
              <div className="flex items-center justify-center h-[600px] text-gray-400">
                Upload dataset to begin
              </div>
            )}

            {datasetId && !selectedWell && (
              <div className="flex items-center justify-center h-[600px] text-gray-400">
                Select a well
              </div>
            )}

            {datasetId && selectedWell && selectedCurves.length === 0 && (
              <div className="flex items-center justify-center h-[600px] text-gray-400">
                Select curves to visualize
              </div>
            )}

            {hasSelection && (
              <WellLogViewer
                curves={curves}
                selectedCurves={selectedCurves}
                depthRange={depthRange}
                scaleModes={scaleModes}
              />
            )}
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot datasetId={datasetId} />
    </MainLayout>
  );
}
