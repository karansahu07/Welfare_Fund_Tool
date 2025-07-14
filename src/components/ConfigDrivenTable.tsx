import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/Pagination";

type ColumnType<T> = {
  title: string;
  dataIndex: keyof T | string;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  sort?: boolean;
};

type ConfigDrivenTableProps<T> = {
  columnStructure: ColumnType<T>[];
  currentPage: number;
  totalDocs: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
  sourceData: T[];
  pagination?: boolean;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  loading: boolean;
};

export function ConfigDrivenTable<T extends { _id?: string | number }>({
  columnStructure,
  currentPage,
  totalDocs,
  totalPages,
  onPageChange,
  onRowsPerPageChange,
  sourceData,
  pagination = true,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50],
  loading = false
}: ConfigDrivenTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const handleSort = (dataIndex: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === dataIndex && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key: dataIndex, direction });

  };

  return (
    <div className="w-full">
      <div className="rounded">
        <Table>
          <TableHeader className="bg-indigo-100 dark:bg-indigo-900">
            <TableRow>
              {columnStructure.map((col, idx) => (
                <TableHead
                  key={idx}
                  style={{ width: col.width || "auto", cursor: col.sort ? "pointer" : "default" }}
                  onClick={() =>
                    typeof col.dataIndex === "string" && col.sort && handleSort(col.dataIndex)
                  }
                >
                  {col.title}
                  {col.sort &&
                    sortConfig.key === col.dataIndex &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Show loading placeholder
              <TableRow>
                <TableCell
                  colSpan={columnStructure.length}
                  className="text-center p-4"
                >
                  <div className="flex justify-center items-center gap-2 text-gray-500">
                    <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : sourceData.length > 0 ? (
              // Show data rows
              sourceData.map((row, rowIdx) => (
                <TableRow key={(row._id as string) ?? rowIdx}>
                  {columnStructure.map((col, colIdx) => {
                    const value = typeof col.dataIndex === "string" ? (row as any)[col.dataIndex] : "";
                    return (
                      <TableCell key={colIdx}>
                        {col.render ? col.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              // Show no data message
              <TableRow>
                <TableCell
                  colSpan={columnStructure.length}
                  className="text-center p-4 text-gray-500"
                >
                  No data found.
                </TableCell>
              </TableRow>
            )}

          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="mt-2 border-t-2 rounded p-4 border-bg-blue-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalDocs}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        </div>
      )}
    </div>
  );
}
