import { create } from 'zustand';
import { User, Dataset, ChartConfig } from '../types';

interface SortConfig {
  key: keyof Dataset;
  direction: 'asc' | 'desc';
}

interface AppState {
  user: User | null;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  chartConfig: ChartConfig | null;
  sort: SortConfig | null;
  setUser: (user: User | null) => void;
  setDatasets: (datasets: Dataset[]) => void;
  setSelectedDataset: (dataset: Dataset | null) => void;
  setChartConfig: (config: ChartConfig | null) => void;
  setSort: (sort: SortConfig | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  datasets: [],
  selectedDataset: null,
  chartConfig: null,
  sort: null,
  setUser: (user) => set({ user }),
  setDatasets: (datasets) => set({ datasets }),
  setSelectedDataset: (dataset) => set({ selectedDataset: dataset }),
  setChartConfig: (config) => set({ chartConfig: config }),
  setSort: (sort) => set({ sort }),
}));