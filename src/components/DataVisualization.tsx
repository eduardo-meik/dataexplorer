import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../store';

export default function DataVisualization() {
  const { selectedDataset, chartConfig } = useStore();

  if (!selectedDataset || !chartConfig) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p>Select a dataset and configure visualization settings to get started.</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartConfig.type) {
      case 'line':
        return (
          <LineChart data={selectedDataset.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={chartConfig.dataKey} stroke="#8884d8" />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={selectedDataset.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxis} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={chartConfig.dataKey} fill="#8884d8" />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={selectedDataset.data}
              dataKey={chartConfig.dataKey}
              nameKey={chartConfig.xAxis}
              fill="#8884d8"
            />
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.xAxis} />
            <YAxis dataKey={chartConfig.yAxis} />
            <Tooltip />
            <Legend />
            <Scatter data={selectedDataset.data} fill="#8884d8" />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Data Visualization</h2>
      <div className="h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}