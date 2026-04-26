import type { ReactNode } from 'react'
import './DataTable.css'

export interface DataTableColumn<TRow> {
  id: string
  header: string
  cell: (row: TRow) => ReactNode
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<TRow> {
  columns: DataTableColumn<TRow>[]
  rows: TRow[]
  getRowId: (row: TRow) => string
  isLoading?: boolean
  loadingRowCount?: number
  onEditRow?: (row: TRow) => void
  onDeleteRow?: (row: TRow) => void
  emptyState?: ReactNode
}

export default function DataTable<TRow>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  loadingRowCount = 4,
  onEditRow,
  onDeleteRow,
  emptyState,
}: DataTableProps<TRow>) {
  const hasActions = Boolean(onEditRow || onDeleteRow)
  const visibleColumns = columns.length + (hasActions ? 1 : 0)

  return (
    <div className="admin-table-wrap">
      <table className="admin-data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} className={`admin-table-align-${column.align ?? 'left'}`}>
                {column.header}
              </th>
            ))}
            {hasActions && <th className="admin-table-align-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: loadingRowCount }).map((_, index) => (
              <tr key={`loading-${index}`}>
                {columns.map((column) => (
                  <td key={`${column.id}-${index}`}>
                    <span className="admin-skeleton-line" aria-hidden="true" />
                  </td>
                ))}
                {hasActions && (
                  <td className="admin-table-align-right">
                    <span className="admin-skeleton-line admin-skeleton-line-short" aria-hidden="true" />
                  </td>
                )}
              </tr>
            ))}

          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={visibleColumns}>
                <div className="admin-table-empty">{emptyState}</div>
              </td>
            </tr>
          )}

          {!isLoading &&
            rows.map((row) => (
              <tr key={getRowId(row)}>
                {columns.map((column) => (
                  <td key={`${column.id}-${getRowId(row)}`} className={`admin-table-align-${column.align ?? 'left'}`}>
                    {column.cell(row)}
                  </td>
                ))}
                {hasActions && (
                  <td className="admin-table-actions admin-table-align-right">
                    {onEditRow && (
                      <button type="button" onClick={() => onEditRow(row)}>
                        Edit
                      </button>
                    )}
                    {onDeleteRow && (
                      <button type="button" className="admin-danger-button" onClick={() => onDeleteRow(row)}>
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
