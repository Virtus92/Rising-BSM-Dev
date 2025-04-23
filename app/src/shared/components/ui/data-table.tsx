import React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  PaginationState,
  ColumnFiltersState,
} from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { cn } from "@/shared/utils/cn"

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  
  // Server-side pagination props
  pagination?: boolean
  serverPagination?: boolean
  paginationMeta?: PaginationMeta
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
  
  // Server-side sorting props
  serverSorting?: boolean
  sortingState?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  
  // Server-side filtering props
  serverFiltering?: boolean
  filterState?: ColumnFiltersState
  onFilterChange?: (filters: ColumnFiltersState) => void
  
  // Visual props
  className?: string
  emptyMessage?: string
  
  // Should the table display in a loading state
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pagination = true,
  serverPagination = false,
  paginationMeta,
  onPaginationChange,
  serverSorting = false,
  sortingState = [],
  onSortingChange,
  serverFiltering = false,
  filterState = [],
  onFilterChange,
  className,
  emptyMessage = "No results found.",
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  // Local state for client-side sorting/pagination if not using server-side
  const [sorting, setSorting] = React.useState<SortingState>(sortingState)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(filterState)
  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: (paginationMeta?.page || 1) - 1, // Adjust for 0-based index
    pageSize: paginationMeta?.limit || 10,
  })

  // Sync local state with props when props change
  React.useEffect(() => {
    if (serverPagination && paginationMeta) {
      setPagination({
        pageIndex: paginationMeta.page - 1, // Adjust for 0-based index
        pageSize: paginationMeta.limit,
      })
    }
  }, [serverPagination, paginationMeta])

  React.useEffect(() => {
    if (serverSorting) {
      setSorting(sortingState)
    }
  }, [serverSorting, sortingState])

  React.useEffect(() => {
    if (serverFiltering) {
      setColumnFilters(filterState)
    }
  }, [serverFiltering, filterState])

  // Create pagination state for the table
  const paginationState = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  )

  // Event handlers to propagate changes to parent component
  const handlePaginationChange = React.useCallback(
    (updater: any) => {
      const newPagination = typeof updater === 'function'
        ? updater({ pageIndex, pageSize })
        : updater

      setPagination(newPagination)
      
      if (serverPagination && onPaginationChange) {
        onPaginationChange(newPagination)
      }
    },
    [pageIndex, pageSize, serverPagination, onPaginationChange]
  )

  const handleSortingChange = React.useCallback(
    (updater: any) => {
      const newSorting = typeof updater === 'function'
        ? updater(sorting)
        : updater

      setSorting(newSorting)
      
      if (serverSorting && onSortingChange) {
        onSortingChange(newSorting)
      }
    },
    [sorting, serverSorting, onSortingChange]
  )

  const handleFilterChange = React.useCallback(
    (updater: any) => {
      const newFilters = typeof updater === 'function'
        ? updater(columnFilters)
        : updater

      setColumnFilters(newFilters)
      
      if (serverFiltering && onFilterChange) {
        onFilterChange(newFilters)
      }
    },
    [columnFilters, serverFiltering, onFilterChange]
  )

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    
    // Feature control
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination && !serverPagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: !serverSorting ? getSortedRowModel() : undefined,
    
    // State
    state: {
      sorting,
      pagination: paginationState,
      columnFilters,
    },
    
    // Event handlers
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onColumnFiltersChange: handleFilterChange,
    
    // Manual modes for server-side operations
    manualPagination: serverPagination,
    manualSorting: serverSorting,
    manualFiltering: serverFiltering,
    
    // Pagination size from server or default
    pageCount: serverPagination && paginationMeta 
      ? paginationMeta.totalPages 
      : Math.ceil(data.length / pageSize),
  })

  // Render empty state
  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        {isLoading ? (
          <div className="flex justify-center items-center space-x-2">
            <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
            <span>Loading...</span>
          </div>
        ) : (
          emptyMessage
        )}
      </TableCell>
    </TableRow>
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div className={cn(
                        "flex items-center",
                        header.column.getCanSort() && "cursor-pointer select-none"
                      )}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        
                        {/* Sort indicators */}
                        {header.column.getCanSort() && (
                          <div className="ml-2">
                            {header.column.getIsSorted() === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ArrowDown className="h-4 w-4" />
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              renderEmptyState()
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (data.length > 0 || serverPagination) && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {serverPagination && paginationMeta ? (
                <>
                  Showing 
                  <span className="font-medium"> {paginationMeta.total === 0 ? 0 : ((paginationMeta.page - 1) * paginationMeta.limit) + 1} </span> 
                  to 
                  <span className="font-medium"> {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} </span> 
                  of 
                  <span className="font-medium"> {paginationMeta.total} </span> 
                  entries
                </>
              ) : (
                <>
                  Showing 
                  <span className="font-medium"> {data.length === 0 ? 0 : pageIndex * pageSize + 1} </span> 
                  to 
                  <span className="font-medium"> {Math.min((pageIndex + 1) * pageSize, data.length)} </span> 
                  of 
                  <span className="font-medium"> {data.length} </span> 
                  entries
                </>
              )}
            </p>
            
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center mx-2">
              <span className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount() || 1}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}