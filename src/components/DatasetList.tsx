import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileJson,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import type { Dataset } from '../types';

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

interface SortConfig {
  key: keyof Dataset;
  direction: 'asc' | 'desc';
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.includes('csv')) return <FileText className="text-green-500" size={20} />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="text-blue-500" size={20} />;
  if (type.includes('json')) return <FileJson className="text-yellow-500" size={20} />;
  return <FileText className="text-gray-500" size={20} />;
};

interface SortableHeaderProps {
  label: string;
  sortKey: keyof Dataset;
}

function SortableHeader({ label, sortKey }: SortableHeaderProps) {
  const [sort, setSort] = useStore(state => [state.sort, state.setSort]);

  return (
    <th
      className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer select-none"
      onClick={() => setSort({
        key: sortKey,
        direction: sort?.key === sortKey && sort.direction === 'asc' ? 'desc' : 'asc'
      })}
    >
      <div className="flex items-center gap-1">
        {label}
        {sort?.key === sortKey && (
          sort.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
        )}
      </div>
    </th>
  );
}

export default function DatasetList() {
  const { datasets, setDatasets, setSelectedDataset, sort } = useStore();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Auto refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Fetch datasets
  useEffect(() => {
    fetchDatasets();
  }, [refreshKey]);

  const fetchDatasets = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setDatasets(data || []);
    } catch (err: any) {
      setError('Error al cargar los datasets: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No se encontró usuario autenticado');

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('El archivo no puede ser mayor a 50MB');
      }

      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.json'];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        throw new Error('Tipo de archivo no permitido. Use CSV, XLSX o JSON');
      }

      // Upload file to storage
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('datasets')
        .getPublicUrl(fileName);

      // Create dataset record
      const { error: dbError } = await supabase
        .from('datasets')
        .insert({
          name: file.name,
          storage_path: fileName,
          file_url: publicUrl,
          size: file.size,
          type: file.type,
          user_id: user.id
        });

      if (dbError) throw dbError;

      await fetchDatasets();
    } catch (err: any) {
      setError('Error al subir el archivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string, storagePath: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este dataset?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('datasets')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setDatasets(datasets.filter(d => d.id !== id));
      setSelectedDataset(null);
    } catch (err: any) {
      setError('Error al eliminar el dataset: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sorting and filtering
  const sortedAndFilteredData = useMemo(() => {
    let result = [...datasets];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(dataset =>
        dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType) {
      result = result.filter(dataset =>
        dataset.type.toLowerCase().includes(filterType.toLowerCase())
      );
    }

    // Apply sorting
    if (sort) {
      result.sort((a, b) => {
        const aValue = a[sort.key];
        const bValue = b[sort.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sort.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sort.direction === 'asc'
          ? (aValue > bValue ? 1 : -1)
          : (bValue > aValue ? 1 : -1);
      });
    }

    return result;
  }, [datasets, searchQuery, filterType, sort]);

  // Pagination
  const totalPages = Math.ceil(sortedAndFilteredData.length / rowsPerPage);
  const paginatedData = sortedAndFilteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Virtual list
  const rowVirtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col space-y-4">
        {/* Header and Upload Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Conjuntos de datos</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Actualizar lista"
            >
              <RefreshCw size={20} className="text-gray-500" />
            </button>
            <label className={clsx(
              "cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2",
              uploading && "opacity-50 cursor-not-allowed"
            )}>
              {uploading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Plus size={20} />
              )}
              {uploading ? 'Subiendo...' : 'Subir dataset'}
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.json"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType || ''}
            onChange={(e) => setFilterType(e.target.value || null)}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="json">JSON</option>
          </select>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
          >
            {ROWS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option} por página
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Dataset Table */}
        <div className="border rounded-lg">
          {/* Header Table */}
          <div className="bg-gray-50 border-b">
            <table className="w-full">
              <thead>
                <tr>
                  <SortableHeader label="Nombre" sortKey="name" />
                  <SortableHeader label="Tamaño" sortKey="size" />
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                  <SortableHeader label="Fecha de creación" sortKey="created_at" />
                  <SortableHeader label="Última modificación" sortKey="updated_at" />
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Permisos</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Virtualized Body */}
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{ height: '500px' }}
          >
            {loading ? (
              <div className="px-4 py-8 text-center">
                <Loader2 className="animate-spin mx-auto" size={24} />
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No se encontraron datasets
              </div>
            ) : (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                <table className="w-full">
                  <tbody>
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const dataset = paginatedData[virtualRow.index];
                      return (
                        <tr
                          key={dataset.id}
                          className="hover:bg-gray-50"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <td className="px-4 py-3">
                            <a
                              href={dataset.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Eye size={16} />
                              {dataset.name}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatFileSize(dataset.size)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getFileIcon(dataset.type)}
                              <span className="text-sm text-gray-600">
                                {dataset.type.split('/').pop()?.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {format(new Date(dataset.created_at), 'PPpp', { locale: es })}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {format(new Date(dataset.updated_at), 'PPpp', { locale: es })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2" title="Acceso público de lectura">
                              <Lock size={16} className="text-gray-400" />
                              <Unlock size={16} className="text-green-500" />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative group">
                              <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <MoreVertical size={20} className="text-gray-500" />
                              </button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block z-10">
                                <a
                                  href={dataset.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                >
                                  <Eye size={16} />
                                  Ver datos
                                </a>
                                <a
                                  href={dataset.file_url}
                                  download
                                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50"
                                >
                                  <Download size={16} />
                                  Descargar
                                </a>
                                <button
                                  onClick={() => handleDelete(dataset.id, dataset.storage_path)}
                                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-red-500"
                                >
                                  <Trash2 size={16} />
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && paginatedData.length > 0 && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {((currentPage - 1) * rowsPerPage) + 1} a{' '}
              {Math.min(currentPage * rowsPerPage, sortedAndFilteredData.length)} de{' '}
              {sortedAndFilteredData.length} resultados
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}