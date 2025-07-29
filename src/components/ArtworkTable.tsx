import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Checkbox, type CheckboxChangeEvent } from 'primereact/checkbox';
import { InputNumber, type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import type { Artwork } from '../types/artwork';
import { fetchArtworks } from '../services/artworkServices';
import { RiArrowDropDownLine } from "react-icons/ri";

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
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selectedArtworks");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedRows(new Set(parsed));
        }
      } catch (e) {
        console.error("Failed to parse selectedArtworks from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    loadArtworks(currentPage);
  }, [currentPage]);

  useEffect(() => {
    localStorage.setItem("selectedArtworks", JSON.stringify(Array.from(selectedRows)));
    setRefreshCounter(prev => prev + 1);
  }, [selectedRows]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBulkSelectDialog(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetchArtworks(page);
      setArtworks(response.data);
      setTotalRecords(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
    } catch (error) {
      console.error('Failed to load artworks:', error);
      setArtworks([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (event: { page: number; first: number; rows: number; pageCount: number }) => {
    const newPage = event.page + 1;
    setCurrentPage(newPage);
  };

  const handleRowSelection = (rowId: number, checked: boolean) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (checked) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.delete(rowId);
      }
      return newSelectedRows;
    });
  };

  const handleSelectAllOnPage = (e: CheckboxChangeEvent) => {
    const isChecked = e.checked ?? false;
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      artworks.forEach(artwork => {
        if (isChecked) {
          newSelectedRows.add(artwork.id);
        } else {
          newSelectedRows.delete(artwork.id);
        }
      });
      return newSelectedRows;
    });
  };

  const handleAutoSelect = async () => {
    if (inputCount === null || inputCount === 0) {
      setShowBulkSelectDialog(false);
      setInputCount(null);
      return;
    }
    setIsBulkSelecting(true);
    const count = inputCount;
    let newSelectedRows = new Set(selectedRows);

    if (count > 0) {
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
    } else {
      const absCount = Math.abs(count);
      const selectedArray = Array.from(selectedRows);
      const idsToUnselect = selectedArray.slice(0, absCount);
      newSelectedRows = new Set(selectedRows);
      idsToUnselect.forEach(id => newSelectedRows.delete(id));
    }
    setSelectedRows(newSelectedRows);
    await loadArtworks(currentPage);
    setIsBulkSelecting(false);
    setShowBulkSelectDialog(false);
    setInputCount(null);
  };

  const isAllOnPageSelected = artworks.length > 0 && artworks.every(artwork => selectedRows.has(artwork.id));

  const headerCheckboxTemplate = () => (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>
      <Checkbox
        checked={isAllOnPageSelected}
        onChange={handleSelectAllOnPage}
        tooltip="Select/Unselect all rows on this page"
        tooltipOptions={{ position: 'top' }}
        className="p-checkbox-box border-2 border-gray-300 bg-white rounded w-[25px]"
      />
      <span
        className="text-gray-600 text-lg cursor-pointer hover:text-gray-800 transition-colors select-none"
        onClick={() => setShowBulkSelectDialog(prev => !prev)}
      >
        <RiArrowDropDownLine />
      </span>

      {showBulkSelectDialog && (
        <div className="absolute top-full left-[100px] -translate-x-1/2 mt-2 bg-white border border-gray-300 shadow-xl p-2 rounded-lg z-50 w-[150px]">
          <div className="p-2 ">
            <InputNumber
              value={inputCount}
              onValueChange={(e: InputNumberValueChangeEvent) => setInputCount(e.value ?? null)}
              placeholder="Enter count"
              className="w-[100px] border-0 focus:ring-0 focus:shadow-none text-center"
              onKeyDown={(e) => e.key === 'Enter' && handleAutoSelect()}
            />
            <Button
              label="Submit"
              className="w-full bg-blue-500 hover:bg-green-600 text-white mt-2 cursor-pointer"
              onClick={handleAutoSelect}
              loading={isBulkSelecting}
              disabled={inputCount === null || inputCount === 0 || isBulkSelecting}
            />
          </div>
        </div>
      )}
    </div>
  );

  const checkboxBodyTemplate = useMemo(() => (rowData: Artwork) => (
    <Checkbox
      key={`checkbox-${rowData.id}-${selectedRows.has(rowData.id)}`}
      checked={selectedRows.has(rowData.id)}
      onChange={(e: CheckboxChangeEvent) => handleRowSelection(rowData.id, e.checked ?? false)}
      className="p-checkbox-box border-2 border-gray-200 rounded w-[25px]"
    />
  ), [selectedRows]);

  const artworksWithSelection = useMemo(() => {
    return artworks.map(artwork => ({
      ...artwork,
      _selected: selectedRows.has(artwork.id)
    }));
  }, [artworks, selectedRows]);

  return (
    <div className=' bg-gray-50 min-h-screen'>
      <div className=" mx-auto">
        <h1 className='text-3xl font-bold mb-6 text-gray-800 text-center'>Artworks Collection</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <DataTable
            key={`datatable-${refreshCounter}`}
            value={artworksWithSelection}
            loading={loading}
            lazy
            paginator={false}
            responsiveLayout='scroll'
            emptyMessage='No artworks found'
            className="border-0"
          >
            <Column
              header={headerCheckboxTemplate}
              body={checkboxBodyTemplate}
              style={{ width: '5rem' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
            <Column
              field='title'
              header='Title'
              sortable
              style={{ minWidth: '200px' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200 font-semibold text-gray-700"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
            <Column
              field='place_of_origin'
              header='Place of Origin'
              sortable
              style={{ minWidth: '150px' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200 font-semibold text-gray-700"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
            <Column
              field='artist_display'
              header='Artist'
              sortable
              style={{ minWidth: '200px' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200 font-semibold text-gray-700"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
            <Column
              field='inscriptions'
              header='Inscriptions'
              style={{ minWidth: '150px' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200 font-semibold text-gray-700"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
            <Column
              field='date_start'
              header='Date Start'
              sortable
              style={{ minWidth: '100px' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200 font-semibold text-gray-700"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
            <Column
              field='date_end'
              header='Date End'
              sortable
              style={{ minWidth: '100px' }}
              headerClassName="bg-gray-100 border-b-2 border-gray-200 font-semibold text-gray-700"
              bodyClassName="border-b border-gray-100 px-4 py-3"
            />
          </DataTable>
        </div>
        <div className="mt-6 flex justify-center">
          <Paginator
            first={(currentPage - 1) * 12}
            rows={12}
            totalRecords={totalRecords}
            onPageChange={onPageChange}
            className='bg-white rounded-lg shadow-md border-0'
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
            currentPageReportTemplate="Showing {first}-{last} of {totalRecords}"
          />
        </div>
      </div>
    </div>
  );
};

export default ArtworkTable;
