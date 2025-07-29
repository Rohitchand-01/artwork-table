import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Checkbox, type CheckboxChangeEvent } from 'primereact/checkbox';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';

import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import type { Artwork } from '../types/artwork';
import { fetchArtworks } from '../services/artworkServices';

const ArtworkTable: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkSelectDialog, setShowBulkSelectDialog] = useState<boolean>(false);
  const [inputCount, setInputCount] = useState<number | null>(null);
  const [isBulkSelecting, setIsBulkSelecting] = useState<boolean>(false);

  // Restore from localStorage on initial mount
  useEffect(() => {
    const stored = localStorage.getItem("selectedRows");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedRows(new Set(parsed));
        }
      } catch (e) {
        console.error("Failed to parse selectedRows from localStorage", e);
      }
    }
  }, []);

  // Fetch data when page changes
  useEffect(() => {
    loadArtworks(currentPage);
  }, [currentPage]);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    localStorage.setItem("selectedRows", JSON.stringify(Array.from(selectedRows)));
  }, [selectedRows]);

  const loadArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetchArtworks(page);
      setArtworks(response.data);
      setTotalRecords(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Failed to load artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: any) => {
    const newPage = event.page + 1;
    setCurrentPage(newPage);
  };

  const handleRowSelection = (rowId: number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(rowId);
    } else {
      newSelectedRows.delete(rowId);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSelectAllOnPage = (e: CheckboxChangeEvent) => {
    const newSelectedRows = new Set(selectedRows);
    const isChecked = e.checked ?? false;
    
    artworks.forEach(artwork => {
      if (isChecked) {
        newSelectedRows.add(artwork.id);
      } else {
        newSelectedRows.delete(artwork.id);
      }
    });
    setSelectedRows(newSelectedRows);
  };

  const handleAutoSelect = async () => {
    if (inputCount === null) return;

    setIsBulkSelecting(true);
    const count = inputCount;

    if (count > 0) {
      const newSelectedRows = new Set(selectedRows);
      let remainingToSelect = count;
      let pageToFetch = 1;

      while (remainingToSelect > 0 && pageToFetch <= totalPages) {
        try {
          const res = await fetchArtworks(pageToFetch);
          if (!res.data || res.data.length === 0) break;
          const rowsToTake = Math.min(remainingToSelect, res.data.length);
          for (let i = 0; i < rowsToTake; i++) {
            newSelectedRows.add(res.data[i].id);
          }
          remainingToSelect -= rowsToTake;
          pageToFetch++;
        } catch (error) {
          console.error(`Error fetching page ${pageToFetch} for bulk select`, error);
          break;
        }
      }
      setSelectedRows(newSelectedRows);
    } else {
      const absCount = Math.abs(count);
      const selectedArray = Array.from(selectedRows);
      const toUnselect = selectedArray.slice(0, absCount);
      const newSet = new Set(selectedRows);
      toUnselect.forEach(id => newSet.delete(id));
      setSelectedRows(newSet);
    }

    await loadArtworks(currentPage);

    setIsBulkSelecting(false);
    setShowBulkSelectDialog(false);
    setInputCount(null);
  };

  const isAllOnPageSelected = artworks.length > 0 && artworks.every(artwork => selectedRows.has(artwork.id));

  const headerCheckboxTemplate = () => (
    <Checkbox
      checked={isAllOnPageSelected}
      onChange={handleSelectAllOnPage}
      tooltip="Select/Unselect all rows on this page"
      tooltipOptions={{ position: 'top' }}
    />
  );

  const checkboxBodyTemplate = (rowData: Artwork) => (
    <Checkbox
      checked={selectedRows.has(rowData.id)}
      onChange={(e: CheckboxChangeEvent) => handleRowSelection(rowData.id, e.checked ?? false)}
    />
  );
  
  const dialogFooter = (
    <div>
      <Button label="Cancel" icon="pi pi-times" onClick={() => setShowBulkSelectDialog(false)} className="p-button-text" />
      <Button
        label="Apply Selection"
        icon="pi pi-check"
        onClick={handleAutoSelect}
        loading={isBulkSelecting}
        disabled={inputCount === null || isBulkSelecting}
      />
    </div>
  );

  return (
    <div className='p-4'>
      <div className="mb-4 flex justify-between items-center">
        <h1 className='text-2xl font-bold'>Artwork Collection</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Selected: {selectedRows.size} / {totalRecords}</span>
          <Button
            label="Bulk Select"
            icon="pi pi-th-large"
            className="p-button-outlined"
            onClick={() => setShowBulkSelectDialog(true)}
          />
        </div>
      </div>

      <Dialog
        header="Bulk Selection"
        visible={showBulkSelectDialog}
        style={{ width: '30vw', minWidth: '350px' }}
        onHide={() => setShowBulkSelectDialog(false)}
        footer={dialogFooter}
        modal
      >
        <div className="p-fluid">
          <div className="field">
            <label htmlFor="inputCount" className="block text-sm font-medium text-gray-700 mb-2">
              Enter number of rows to process
            </label>
            <InputNumber
              id="inputCount"
              value={inputCount}
              onValueChange={(e: InputNumberValueChangeEvent) => setInputCount(e.value ?? null)}
              placeholder="e.g., 50 to select, -10 to unselect"
              autoFocus
              className="w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleAutoSelect()}
            />
          </div>
          <div className="bg-gray-50 rounded-md p-3 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">How it works:</h4>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li><strong>Positive number (e.g., 50):</strong> Selects the first 50 rows from the entire dataset.</li>
              <li><strong>Negative number (e.g., -10):</strong> Unselects the first 10 rows from your current selection.</li>
            </ul>
          </div>
        </div>
      </Dialog>

      <DataTable
        value={artworks}
        loading={loading}
        lazy
        paginator={false}
        responsiveLayout='scroll'
        emptyMessage='No artworks found'
      >
        <Column header={headerCheckboxTemplate} body={checkboxBodyTemplate} style={{ width: '5rem' }} />
        <Column field='title' header='Title' sortable style={{ minWidth: '200px' }} />
        <Column field='place_of_origin' header='Place of Origin' sortable style={{ minWidth: '150px' }} />
        <Column field='artist_display' header='Artist' sortable style={{ minWidth: '200px' }} />
        <Column field='inscriptions' header='Inscriptions' style={{ minWidth: '150px' }} />
        <Column field='date_start' header='Date Start' sortable style={{ minWidth: '100px' }} />
        <Column field='date_end' header='Date End' sortable style={{ minWidth: '100px' }} />
      </DataTable>

      <Paginator
        first={(currentPage - 1) * 12}
        rows={12}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        className='mt-4'
      />
    </div>
  );
};

export default ArtworkTable;
