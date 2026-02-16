import { useDatasetContext } from "../context/DatasetContext";
import MainLayout from "../layouts/MainLayout";
import { useNavigate } from "react-router-dom";
import Plot from "react-plotly.js";
import ReactMarkdown from "react-markdown";

export default function AnalysisPage() {
    const { analysis, datasetId } = useDatasetContext();
    const navigate = useNavigate();

    if (!analysis) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-[600px] text-gray-400 space-y-4">
                    <p className="text-lg">No analysis results yet</p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition text-sm"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </MainLayout>
        );
    }

    const health = Number(analysis.dataset_health) || 0;
    const risk = analysis.risk_level || "Unknown";

    const riskColor =
        risk.toLowerCase() === "low"
            ? "bg-green-500"
            : risk.toLowerCase() === "moderate"
                ? "bg-yellow-500"
                : risk.toLowerCase() === "high"
                    ? "bg-red-500"
                    : "bg-gray-400";

    const riskTextColor =
        risk.toLowerCase() === "low"
            ? "text-green-700"
            : risk.toLowerCase() === "moderate"
                ? "text-yellow-700"
                : risk.toLowerCase() === "high"
                    ? "text-red-700"
                    : "text-gray-700";

    const gaugeData = [
        {
            type: "indicator",
            mode: "gauge+number",
            value: health,
            number: { font: { size: 34 } },
            domain: { x: [0.05, 0.95], y: [0, 1] },
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

    // Build curve summary cards from analysis.summary
    const curveStats = analysis.summary || {};
    const outlierData = analysis.outliers || {};

    return (
        <MainLayout>
            <div className="space-y-6">

                {/* Top Row: Health + Risk */}
                <div className="grid grid-cols-3 gap-6">

                    {/* Health Gauge */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                            Dataset Health
                        </h3>
                        <div className="flex justify-center">
                            <div className="w-full max-w-sm">
                                <Plot
                                    data={gaugeData}
                                    layout={{
                                        height: 240,
                                        margin: { t: 20, b: 10, l: 30, r: 30 },
                                    }}
                                    config={{ displayModeBar: false, responsive: true }}
                                    style={{ width: "100%" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Risk Level + Key Stats */}
                    <div className="bg-white rounded-lg shadow p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">
                            Risk Assessment
                        </h3>
                        <div className="flex items-center gap-3">
                            <span
                                className={`text-white text-sm px-4 py-2 rounded-full font-semibold ${riskColor}`}
                            >
                                {risk} Risk
                            </span>
                            <span className={`text-sm font-medium ${riskTextColor}`}>
                                Score: {health}/100
                            </span>
                        </div>

                        <div className="space-y-2 mt-4">
                            <div className="text-xs text-gray-500">Curves Analyzed</div>
                            <div className="text-2xl font-bold">
                                {Object.keys(curveStats).length}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs text-gray-500">Total Outliers</div>
                            <div className="text-2xl font-bold">
                                {Object.values(outlierData).reduce(
                                    (sum, o) =>
                                        sum + (o.zscore || 0) + (o.iqr || 0),
                                    0
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rule-Based Findings */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                            Key Findings
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700 max-h-56 overflow-y-auto">
                            {analysis.insights &&
                                analysis.insights.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2"
                                    >
                                        <span className="text-yellow-500 mt-0.5 font-bold">!</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            {(!analysis.insights || analysis.insights.length === 0) && (
                                <li className="text-gray-400">No significant issues detected</li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* AI Summary (Gemini) */}
                {analysis.ai_summary && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-lg font-semibold">
                                AI-Powered Analysis
                            </h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Gemini
                            </span>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700">
                            <ReactMarkdown>{analysis.ai_summary}</ReactMarkdown>
                        </div>
                    </div>
                )}

                {/* Curve Statistics Table */}
                {Object.keys(curveStats).length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Curve Statistics
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Curve</th>
                                        <th className="px-4 py-3">Count</th>
                                        <th className="px-4 py-3">Mean</th>
                                        <th className="px-4 py-3">Std</th>
                                        <th className="px-4 py-3">Min</th>
                                        <th className="px-4 py-3">Max</th>
                                        <th className="px-4 py-3">Skewness</th>
                                        <th className="px-4 py-3">Missing %</th>
                                        <th className="px-4 py-3">Z-Outliers</th>
                                        <th className="px-4 py-3">IQR-Outliers</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {Object.entries(curveStats).map(([curve, stats]) => (
                                        <tr key={curve} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{curve}</td>
                                            <td className="px-4 py-3">{stats.count}</td>
                                            <td className="px-4 py-3">{stats.mean?.toFixed(4)}</td>
                                            <td className="px-4 py-3">{stats.std?.toFixed(4)}</td>
                                            <td className="px-4 py-3">{stats.min?.toFixed(4)}</td>
                                            <td className="px-4 py-3">{stats.max?.toFixed(4)}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        Math.abs(stats.skewness) > 1
                                                            ? "text-red-600 font-medium"
                                                            : ""
                                                    }
                                                >
                                                    {stats.skewness?.toFixed(3)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={
                                                        stats.missing_percent > 20
                                                            ? "text-red-600 font-medium"
                                                            : ""
                                                    }
                                                >
                                                    {stats.missing_percent?.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {outlierData[curve]?.zscore || 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                {outlierData[curve]?.iqr || 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Back to Dashboard */}
                <div className="flex justify-end">
                    <button
                        onClick={() => navigate("/")}
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition text-sm"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </MainLayout>
    );
}
