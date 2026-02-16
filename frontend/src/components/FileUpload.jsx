import { useState } from "react";

export default function FileUpload({ onUpload, loading }) {
  const [file, setFile] = useState(null);

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".las"
        onChange={(e) => setFile(e.target.files[0])}
        className="border p-2 rounded"
      />

      <button
        onClick={() => onUpload(file)}
        disabled={loading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
    </div>
  );
}
