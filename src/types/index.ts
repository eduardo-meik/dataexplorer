export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  storage_path: string;
  file_url: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  data?: Record<string, any>[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  dataKey: string;
  xAxis: string;
  yAxis: string;
}