import React, { useState, useMemo } from 'react';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';
import type { Phone } from '../types';
import { updateDoc, doc, db } from '../services/firebase';

interface Props {
  phones: Phone[];
  onSelectPhone: (phone: Phone) => void;
  searchQuery: string;
  ocrLoading?: boolean;
}

type SortBy = 'buyDate' | 'sellPrice' | 'model' | 'createdAt';
type FilterStatus = 'All' | 'In Stock' | 'Sold' | 'Personal Use' | 'On Sale';

export default function PhoneList({ phones, onSelectPhone, searchQuery, ocrLoading }: Props) {
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('All');
  const [filterModel, setFilterModel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'status' | 'sellPrice' | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const uniqueModels = useMemo(() => {
    return Array.from(new Set(phones.map(p => p.model))).sort();
  }, [phones]);

  const filteredAndSorted = useMemo(() => {
    let result = phones;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.model.toLowerCase().includes(query) ||
        p.imei.includes(query) ||
        p.serialNumber?.includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'All') {
      result = result.filter(p => p.status === filterStatus);
    }

    // Apply model filter
    if (filterModel) {
      result = result.filter(p => p.model === filterModel);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'buyDate':
          return new Date(b.buyDate).getTime() - new Date(a.buyDate).getTime();
        case 'sellPrice':
          return (b.sellPrice || 0) - (a.sellPrice || 0);
        case 'model':
          return a.model.localeCompare(b.model);
        case 'createdAt':
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return result;
  }, [phones, searchQuery, filterStatus, filterModel, sortBy]);

  const handleInlineEdit = (phone: Phone, field: 'status' | 'sellPrice') => {
    setEditingId(phone.id);
    setEditingField(field);
    if (field === 'status') {
      setEditingValue(phone.status);
    } else {
      setEditingValue(String(phone.sellPrice || ''));
    }
  };

  const handleSaveEdit = async (phoneId: string) => {
    if (!editingField || editingValue === '') return;

    setSavingId(phoneId);
    try {
      const phoneRef = doc(db, 'phones', phoneId);
      if (editingField === 'status') {
        await updateDoc(phoneRef, { status: editingValue });
      } else if (editingField === 'sellPrice') {
        await updateDoc(phoneRef, { sellPrice: parseFloat(editingValue) });
      }
      setEditingId(null);
      setEditingField(null);
    } catch (error) {
      console.error('Error updating phone:', error);
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingValue('');
  };

  return (
    <div className="space-y-4">
      {/* Filters and Sorting */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="createdAt">Recently Added</option>
              <option value="buyDate">Buy Date</option>
              <option value="sellPrice">Sell Price</option>
              <option value="model">Model</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="All">All</option>
              <option value="In Stock">In Stock</option>
              <option value="Sold">Sold</option>
              <option value="Personal Use">Personal Use</option>
              <option value="On Sale">On Sale</option>
            </select>
          </div>

          {/* Filter Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Models</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSorted.length} phone{filteredAndSorted.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {ocrLoading && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex items-center gap-2">
          <div className="animate-spin">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <span className="text-blue-700 dark:text-blue-300">Processing phone report...</span>
        </div>
      )}

      {/* Phone List */}
      <div className="space-y-3">
        {filteredAndSorted.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No phones found</p>
          </div>
        ) : (
          filteredAndSorted.map(phone => (
            <div
              key={phone.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => onSelectPhone(phone)}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{phone.model}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IMEI: {phone.imei}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Buy Price</p>
                      <p className="font-medium text-gray-900 dark:text-white">${phone.buyPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Buy Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{phone.buyDate}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 ml-4">
                  {/* Status Field */}
                  <div className="text-right">
                    {editingId === phone.id && editingField === 'status' ? (
                      <div className="flex gap-2">
                        <select
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Sold">Sold</option>
                          <option value="Personal Use">Personal Use</option>
                          <option value="On Sale">On Sale</option>
                        </select>
                        <button
                          onClick={() => handleSaveEdit(phone.id)}
                          disabled={savingId === phone.id}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInlineEdit(phone, 'status')}
                        className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        {phone.status}
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Sell Price Field */}
                  {phone.status === 'Sold' && (
                    <div className="text-right">
                      {editingId === phone.id && editingField === 'sellPrice' ? (
                        <div className="flex gap-2 justify-end">
                          <input
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="0.00"
                          />
                          <button
                            onClick={() => handleSaveEdit(phone.id)}
                            disabled={savingId === phone.id}
                            className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInlineEdit(phone, 'sellPrice')}
                          className="inline-flex items-center gap-1 text-sm font-medium px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
                        >
                          ${phone.sellPrice?.toFixed(2) || '0.00'}
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
