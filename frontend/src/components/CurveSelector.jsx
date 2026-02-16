import { useEffect, useState } from "react";

const MAX_CURVES = 5;

export default function CurveSelector({
  availableCurves,
  selectedCurves,
  setSelectedCurves,
}) {
  const [warning, setWarning] = useState(null);

  useEffect(() => {
    if (
      availableCurves.length > 0 &&
      selectedCurves.length === 0
    ) {
      setSelectedCurves(availableCurves.slice(0, 3));
    }
  }, [availableCurves]);

  const toggleCurve = (curve) => {
    if (selectedCurves.includes(curve)) {
      setSelectedCurves(
        selectedCurves.filter((c) => c !== curve)
      );
      setWarning(null);
    } else {
      if (selectedCurves.length >= MAX_CURVES) {
        setWarning(
          `Maximum ${MAX_CURVES} curves allowed`
        );
        return;
      }
      setSelectedCurves([...selectedCurves, curve]);
      setWarning(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="max-h-40 overflow-y-auto border rounded p-3 space-y-2">
        {availableCurves.map((curve) => (
          <label
            key={curve}
            className="flex items-center space-x-2 text-sm"
          >
            <input
              type="checkbox"
              checked={selectedCurves.includes(curve)}
              onChange={() => toggleCurve(curve)}
            />
            <span>{curve}</span>
          </label>
        ))}
      </div>

      {warning && (
        <p className="text-xs text-red-500">
          {warning}
        </p>
      )}
    </div>
  );
}
