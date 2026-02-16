import Plot from "react-plotly.js";
import { useState } from "react";

export default function WellLogViewer({
  curves,
  selectedCurves,
  depthRange,
  scaleModes,
}) {
  const [hoverDepth, setHoverDepth] = useState(null);

  if (!curves || !curves.curves || !curves.depth) return null;

  const fullDepth = curves.depth;

  // -------------------------
  // Depth Filtering
  // -------------------------
  let filteredDepth = fullDepth;
  let filteredCurves = curves.curves;

  if (
    depthRange &&
    depthRange.from !== "" &&
    depthRange.to !== ""
  ) {
    const from = Number(depthRange.from);
    const to = Number(depthRange.to);

    const indices = fullDepth
      .map((d, i) =>
        d >= from && d <= to ? i : null
      )
      .filter((i) => i !== null);

    if (indices.length > 0) {
      filteredDepth = indices.map((i) => fullDepth[i]);

      filteredCurves = Object.fromEntries(
        Object.entries(curves.curves).map(
          ([key, values]) => [
            key,
            indices.map((i) => values[i]),
          ]
        )
      );
    }
  }

  // -------------------------
  // Curve Selection
  // -------------------------
  const allCurves = Object.keys(filteredCurves)
    .filter(
      (name) =>
        !["TIME", "DATE"].includes(
          name.toUpperCase()
        )
    );

  const curveNames =
    selectedCurves && selectedCurves.length > 0
      ? selectedCurves
      : allCurves.slice(0, 3);

  if (curveNames.length === 0) return null;

  const trackWidth = 1 / curveNames.length;

  // -------------------------
  // Build Traces
  // -------------------------
  const traces = curveNames
    .map((curve, index) => {
      const values = filteredCurves[curve];
      if (!values || values.length === 0) return null;

      const axisType =
        scaleModes && scaleModes[curve]
          ? scaleModes[curve]
          : "log";

      let processedValues = values;

      // Apply log safety only if axis is log
      if (axisType === "log") {
        const positive = values.filter(
          (v) => v > 0
        );
        if (positive.length === 0)
          return null;

        const sorted = [...positive].sort(
          (a, b) => a - b
        );

        const p95 =
          sorted[
            Math.floor(
              sorted.length * 0.95
            )
          ];

        processedValues = values.map((v) =>
          v > p95
            ? p95
            : v > 0
            ? v
            : null
        );
      }

      return {
        x: processedValues,
        y: filteredDepth,
        type: "scatter",
        mode: "lines",
        name: curve,
        xaxis:
          index === 0
            ? "x"
            : `x${index + 1}`,
        yaxis: "y",
        line: { width: 1 },
      };
    })
    .filter(Boolean);

  if (traces.length === 0) return null;

  // -------------------------
  // Layout
  // -------------------------
  const layout = {
    height: 850,
    margin: { t: 60, b: 40 },
    showlegend: false,
    hovermode: "y unified",

    yaxis: {
      title:
        curves.depth_name || "Depth",
      autorange: "reversed",
      domain: [0, 1],
      showgrid: true,
    },
  };

  // Configure track axes dynamically
  curveNames.forEach(
    (curve, index) => {
      const start =
        index * trackWidth;
      const end =
        start + trackWidth;

      const axisName =
        index === 0
          ? "xaxis"
          : `xaxis${index + 1}`;

      const axisType =
        scaleModes && scaleModes[curve]
          ? scaleModes[curve]
          : "log";

      layout[axisName] = {
        domain: [start, end],
        type: axisType,
        showgrid: true,
        zeroline: false,
      };
    }
  );

  // Track titles
  layout.annotations =
    curveNames.map(
      (curve, index) => {
        const start =
          index * trackWidth;
        const end =
          start + trackWidth;

        return {
          text: curve,
          x: (start + end) / 2,
          y: 1.06,
          xref: "paper",
          yref: "paper",
          showarrow: false,
          font: { size: 14 },
        };
      }
    );

  // -------------------------
  // Crosshair Depth Line
  // -------------------------
  if (hoverDepth !== null) {
    layout.shapes = [
      {
        type: "line",
        xref: "paper",
        yref: "y",
        x0: 0,
        x1: 1,
        y0: hoverDepth,
        y1: hoverDepth,
        line: {
          color: "red",
          width: 1,
          dash: "dot",
        },
      },
    ];
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">
        Multi-Track Well Log Viewer
      </h3>

      <Plot
        data={traces}
        layout={layout}
        config={{
          responsive: true,
          displaylogo: false,
        }}
        style={{ width: "100%" }}
        onHover={(event) => {
          if (
            event.points &&
            event.points.length > 0
          ) {
            setHoverDepth(
              event.points[0].y
            );
          }
        }}
        onUnhover={() =>
          setHoverDepth(null)
        }
      />
    </div>
  );
}
