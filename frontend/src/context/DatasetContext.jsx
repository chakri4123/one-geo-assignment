import { createContext, useContext } from "react";
import useDataset from "../hooks/useDataset";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
    const dataset = useDataset();

    return (
        <DatasetContext.Provider value={dataset}>
            {children}
        </DatasetContext.Provider>
    );
}

export function useDatasetContext() {
    const context = useContext(DatasetContext);
    if (!context) {
        throw new Error("useDatasetContext must be used within DatasetProvider");
    }
    return context;
}
