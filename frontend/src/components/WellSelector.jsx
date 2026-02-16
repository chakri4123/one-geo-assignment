export default function WellSelector({
  availableWells,
  selectedWell,
  setSelectedWell,
}) {
  if (!availableWells || availableWells.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-5 space-y-3">
      <h3 className="text-lg font-semibold">
        Well Selection
      </h3>

      <select
        value={selectedWell}
        onChange={(e) => setSelectedWell(e.target.value)}
        className="w-full border rounded p-2"
      >
        {availableWells.map((well) => (
          <option key={well} value={well}>
            {well}
          </option>
        ))}
      </select>
    </div>
  );
}
