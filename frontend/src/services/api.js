const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/dataset/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
};

export const fetchCurves = async (datasetId) => {
  const response = await fetch(
    `${BASE_URL}/dataset/${datasetId}/curves`
  );

  if (!response.ok) {
    throw new Error("Failed to load curves");
  }

  return response.json();
};

export const runAIAnalysis = async (datasetId, payload) => {
  const response = await fetch(
    `${BASE_URL}/ai/analyze/${datasetId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();

    if (Array.isArray(error.detail)) {
      const message = error.detail
        .map((e) => e.msg)
        .join(", ");
      throw new Error(message);
    }

    throw new Error(error.detail || "AI analysis failed");
  }

  return response.json();
};
