import Plot from "react-plotly.js";

export default function AIInsights({ analysis }) {
  if (!analysis) return null;

  const health = Number(analysis.dataset_health) || 0;
  const risk = analysis.risk_level || "Unknown";

  const riskColor =
    risk.toLowerCase() === "low"
      ? "bg-green-500"
      : risk.toLowerCase() === "medium"
      ? "bg-yellow-500"
      : risk.toLowerCase() === "high"
      ? "bg-red-500"
      : "bg-gray-400";

  const gaugeData = [
    {
      type: "indicator",
      mode: "gauge+number",
      value: health,
      number: {
        font: { size: 34 },
      },
      domain: { x: [0.05, 0.95], y: [0, 1] }, // prevents clipping
      gauge: {
        axis: {
          range: [0, 100],
          tickmode: "linear",
          tick0: 0,
          dtick: 20,
        },
        bar: { color: "#2563eb" },
        bgcolor: "white",
        borderwidth: 1,
        steps: [
          { range: [0, 40], color: "#fee2e2" },
          { range: [40, 70], color: "#fef9c3" },
          { range: [70, 100], color: "#dcfce7" },
        ],
      },
    },
  ];

  console.log("FULL ANALYSIS:", analysis);


  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        AI Insights
      </h3>

      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <Plot
            data={gaugeData}
            layout={{
              height: 260,
              margin: { t: 30, b: 20, l: 30, r: 30 }, // more breathing room
            }}
            config={{
              displayModeBar: false,
              responsive: true,
            }}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Risk Level
        </span>
        <span
          className={`text-white text-xs px-3 py-1 rounded ${riskColor}`}
        >
          {risk}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">
          Key Findings
        </h4>
        <ul className="space-y-1 text-xs text-gray-700 max-h-40 overflow-y-auto">
          {analysis.insights &&
            analysis.insights
              .slice(0, 15)
              .map((item, index) => (
                <li key={index}>
                  • {item}
                </li>
              ))}
        </ul>
      </div>
    </div>
  );
}
