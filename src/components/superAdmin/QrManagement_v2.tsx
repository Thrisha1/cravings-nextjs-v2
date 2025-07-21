"use client";
import { fetchFromHasura } from "@/lib/hasuraClient";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";

type QrCode = {
  id: string;
  qr_number: string;
  partner_id?: string;
  partner?: {
    store_name: string;
  };
};

const LIMIT = 10;

const GET_QRS_QUERY = `
  query GetQrsWithPagination($limit: Int!, $offset: Int!) {
    qr_codes(order_by: {partner_id: asc_nulls_first}, limit: $limit, offset: $offset) {
      id
      qr_number
      partner_id
      partner {
        store_name
      }
    }
    qr_codes_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const QrManagement_v2 = () => {
  const [qrs, setQrs] = useState<QrCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalQrs, setTotalQrs] = useState(0);
  const [loading, setLoading] = useState(true);

  // NEW: State for managing selections
  const [selectedQrs, setSelectedQrs] = useState(new Set<string>());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQrs = async () => {
      setLoading(true);
      // NEW: Clear selection when fetching new data for a new page
      setSelectedQrs(new Set());
      setLastSelectedId(null);

      try {
        const offset = (page - 1) * LIMIT;
        const { qr_codes, qr_codes_aggregate } = await fetchFromHasura(
          GET_QRS_QUERY,
          { limit: LIMIT, offset: offset }
        );

        setQrs(qr_codes);
        setTotalQrs(qr_codes_aggregate.aggregate.count);
      } catch (error) {
        console.error("Error fetching QR codes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQrs();
  }, [page]);

  // NEW: Click handler for table rows
  const handleRowClick = (
    clickedId: string,
    event: React.MouseEvent<HTMLTableRowElement>
  ) => {
    // For Cmd + Click on MacOS
    const isCtrlOrCmdClick = event.ctrlKey || event.metaKey;

    const newSelection = new Set(selectedQrs);

    // 1. Handle Shift + Click for range selection
    if (event.shiftKey && lastSelectedId) {
      const lastIndex = qrs.findIndex((qr) => qr.id === lastSelectedId);
      const currentIndex = qrs.findIndex((qr) => qr.id === clickedId);

      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);

      for (let i = start; i <= end; i++) {
        newSelection.add(qrs[i].id);
      }
      setSelectedQrs(newSelection);
      return; // Exit after handling
    }

    // 2. Handle Ctrl/Cmd + Click for toggling single items
    if (isCtrlOrCmdClick) {
      if (newSelection.has(clickedId)) {
        newSelection.delete(clickedId);
      } else {
        newSelection.add(clickedId);
      }
      setLastSelectedId(clickedId); // Set this as the new anchor for shift-click
      setSelectedQrs(newSelection);
      return; // Exit after handling
    }

    // 3. Handle a normal single click
    // If the clicked item is the only one selected, deselect it. Otherwise, select only the clicked item.
    if (newSelection.has(clickedId) && newSelection.size === 1) {
      setSelectedQrs(new Set());
      setLastSelectedId(null);
    } else {
      setSelectedQrs(new Set([clickedId]));
      setLastSelectedId(clickedId);
    }
  };

  const totalPages = Math.ceil(totalQrs / LIMIT);

  return (
    <div className="p-4">

        {/* functions  */}
        <div>
            {/* create new qr button  */}
            {/* assging qr to partner  */}
        </div>

      {/* qr codes table  */}
      <div className="rounded-md border">
        <Table className="bg-white overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead>QR Id</TableHead>
              <TableHead>Partner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : qrs.length > 0 ? (
              qrs.map((qr) => (
                <TableRow
                  key={qr.id}
                  // NEW: Add click handler and data-state for styling selected rows
                  onClick={(e) => handleRowClick(qr.id, e)}
                  data-state={selectedQrs.has(qr.id) ? "selected" : ""}
                  className="cursor-pointer data-[state=selected]:bg-green-100 select-none" // shadcn/ui style for selected state
                >
                  <TableCell className="font-medium">{qr.id}</TableCell>
                  <TableCell>
                    {qr.partner?.store_name ?? (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  No QR codes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-4 py-4">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QrManagement_v2;
