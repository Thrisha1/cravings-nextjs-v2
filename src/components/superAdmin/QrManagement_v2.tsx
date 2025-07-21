"use client";
import { fetchFromHasura } from "@/lib/hasuraClient";
import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { X } from "lucide-react";
import QrScanAssign from "./QrScanAssign";

type QrCode = {
  id: string;
  qr_number: string;
  table_number: number;
  partner_id?: string;
  partner?: {
    store_name: string;
  };
};

type Partner = {
  id: string;
  store_name: string;
};

const LIMIT = 10;

const GET_QRS_QUERY = `
  query GetQrsWithPagination($limit: Int!, $offset: Int!, $where: qr_codes_bool_exp!) {
    qr_codes(order_by: {created_at: desc_nulls_last}, limit: $limit, offset: $offset, where: $where) {
      id
      qr_number
      table_number
      partner_id
      partner {
        store_name
      }
    }
    qr_codes_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const SEARCH_PARTNERS_QUERY = `
  query SearchPartners($search: String!) {
    partners(where: {store_name: {_ilike: $search}}, limit: 5) {
      id
      store_name
    }
  }
`;

const ASSIGN_QRS_TO_PARTNER_MUTATION = `
  mutation AssignQrsToPartner($qrIds: [uuid!], $partnerId: uuid!) {
    update_qr_codes_many(updates: {where: {id: {_in: $qrIds}}, _set: {partner_id: $partnerId}}) {
      affected_rows
    }
  }
`;

const INSERT_QR_CODES_MUTATION = `
  mutation InsertQrCodes($objects: [qr_codes_insert_input!]!) {
    insert_qr_codes(objects: $objects) {
      affected_rows
    }
  }
`;

const DELETE_QRS_MUTATION = `
  mutation DeleteQrs($qrIds: [uuid!]) {
    delete_qr_codes(where: {id: {_in: $qrIds}}) {
      affected_rows
    }
  }
`;

const UPDATE_QR_TABLE_NUMBER_MUTATION = `
  mutation UpdateQrTableNumber($qrId: uuid!, $tableNumber: Int) {
    update_qr_codes_by_pk(pk_columns: {id: $qrId}, _set: {table_number: $tableNumber}) {
      id
    }
  }
`;

const QrManagement_v2 = () => {
  const [qrs, setQrs] = useState<QrCode[]>([]);
  const [page, setPage] = useState(1);
  const [totalQrs, setTotalQrs] = useState(0);
  const [loading, setLoading] = useState(true);

  const [mainSearch, setMainSearch] = useState("");
  const [debouncedMainSearch, setDebouncedMainSearch] = useState("");
  const mainSearchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [selectedQrs, setSelectedQrs] = useState(new Set<string>());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isTouchEvent = useRef(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchQrs = async () => {
    setLoading(true);
    exitSelectionMode();
    try {
      const offset = (page - 1) * LIMIT;
      let whereClause = {};
      if (debouncedMainSearch.trim()) {
        const searchPattern = `%${debouncedMainSearch.trim()}%`;
        whereClause = {
          _or: [{ partner: { store_name: { _ilike: searchPattern } } }],
        };
      }

      const { qr_codes, qr_codes_aggregate } = await fetchFromHasura(
        GET_QRS_QUERY,
        { limit: LIMIT, offset, where: whereClause }
      );

      setQrs(qr_codes);
      setTotalQrs(qr_codes_aggregate.aggregate.count);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrs();
  }, [page, debouncedMainSearch]);

  useEffect(() => {
    if (mainSearchDebounceTimer.current) {
      clearTimeout(mainSearchDebounceTimer.current);
    }
    mainSearchDebounceTimer.current = setTimeout(() => {
      setPage(1);
      setDebouncedMainSearch(mainSearch);
    }, 500);

    return () => {
      if (mainSearchDebounceTimer.current) {
        clearTimeout(mainSearchDebounceTimer.current);
      }
    };
  }, [mainSearch]);

  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    if (searchTerm.trim() !== "" && !selectedPartner) {
      searchDebounceTimer.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const { partners } = await fetchFromHasura(SEARCH_PARTNERS_QUERY, {
            search: `%${searchTerm}%`,
          });
          setSearchResults(partners);
        } catch (error) {
          console.error("Error searching for partners:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedPartner]);

  const exitSelectionMode = () => {
    setSelectedQrs(new Set());
    setLastSelectedId(null);
    setSelectionMode(false);
    setSearchTerm("");
    setSelectedPartner(null);
    setSearchResults([]);
  };

  const handleCreateQrs = async () => {
    const numToCreateStr = prompt(
      "How many QR codes do you want to create? (Max 1000)"
    );
    if (!numToCreateStr) return;

    const numToCreate = parseInt(numToCreateStr, 10);
    if (isNaN(numToCreate) || numToCreate <= 0 || numToCreate > 1000) {
      alert("Please enter a valid positive number up to 1000.");
      return;
    }

    const newQrObjects = Array.from({ length: numToCreate }, (_, i) => {
      const uniquePart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      return {
        qr_number: `QR-${Date.now()}-${uniquePart}${i}`,
        created_at: new Date().toISOString(),
      };
    });

    setIsCreating(true);
    try {
      await fetchFromHasura(INSERT_QR_CODES_MUTATION, {
        objects: newQrObjects,
      });
      alert(`${numToCreate} QR codes created successfully!`);
      if (mainSearch) {
        setMainSearch("");
      } else {
        if (page !== 1) setPage(1);
        else await fetchQrs();
      }
    } catch (error) {
      console.error("Error creating QR codes:", error);
      alert("Failed to create QR codes. Check the console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignQrs = async () => {
    if (!selectedPartner || selectedQrs.size === 0) return;
    setIsAssigning(true);
    try {
      await fetchFromHasura(ASSIGN_QRS_TO_PARTNER_MUTATION, {
        qrIds: Array.from(selectedQrs),
        partnerId: selectedPartner.id,
      });
      await fetchQrs();
    } catch (error) {
      console.error("Error assigning QRs:", error);
      alert("Failed to assign QR codes.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteQrs = async () => {
    if (selectedQrs.size === 0) return;

    const confirmation = window.confirm(
      `Are you sure you want to delete ${selectedQrs.size} QR code(s)? This action cannot be undone.`
    );

    if (!confirmation) return;

    setIsDeleting(true);
    try {
      await fetchFromHasura(DELETE_QRS_MUTATION, {
        qrIds: Array.from(selectedQrs),
      });
      alert(`${selectedQrs.size} QR code(s) deleted successfully!`);
      setQrs((prev) => prev.filter((qr) => !selectedQrs.has(qr.id)));
      setSelectedQrs(new Set());
      setLastSelectedId(null);
    } catch (error) {
      console.error("Error deleting QR codes:", error);
      alert("Failed to delete QR codes.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeTableNumber = async () => {
    if (selectedQrs.size !== 1) return;

    const qrId = Array.from(selectedQrs)[0];
    const currentQr = qrs.find((qr) => qr.id === qrId);

    const newTableNumStr = prompt(
      `Enter new table number for QR: ${currentQr?.id}`,
      currentQr?.table_number?.toString() || ""
    );

    if (newTableNumStr === null || newTableNumStr.trim() === "") return;

    const newTableNumber = parseInt(newTableNumStr, 10);
    if (isNaN(newTableNumber)) {
      alert("Please enter a valid number.");
      return;
    }

    setIsUpdating(true);
    try {
      await fetchFromHasura(UPDATE_QR_TABLE_NUMBER_MUTATION, {
        qrId,
        tableNumber: newTableNumber,
      });
      setQrs((prev) =>
        prev.map((qr) =>
          qr.id === qrId ? { ...qr, table_number: newTableNumber } : qr
        )
      );
      setSelectedQrs(new Set());
      setLastSelectedId(null);
    } catch (error) {
      console.error("Error updating table number:", error);
      alert("Failed to update table number.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTouchStart = (qrId: string) => {
    isTouchEvent.current = true;
    longPressTimer.current = setTimeout(() => {
      setSelectionMode(true);
      setSelectedQrs(new Set([qrId]));
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleRowInteraction = (
    clickedId: string,
    event: React.MouseEvent<HTMLTableRowElement>
  ) => {
    if (isTouchEvent.current) {
      isTouchEvent.current = false;
      if (selectionMode) {
        const newSelection = new Set(selectedQrs);
        if (newSelection.has(clickedId)) newSelection.delete(clickedId);
        else newSelection.add(clickedId);
        if (newSelection.size === 0) exitSelectionMode();
        else setSelectedQrs(newSelection);
      }
      return;
    }

    const isCtrlOrCmdClick = event.ctrlKey || event.metaKey;
    const newSelection = new Set(selectedQrs);
    if (event.shiftKey && lastSelectedId) {
      const lastIndex = qrs.findIndex((qr) => qr.id === lastSelectedId);
      const currentIndex = qrs.findIndex((qr) => qr.id === clickedId);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      for (let i = start; i <= end; i++) newSelection.add(qrs[i].id);
      setSelectedQrs(newSelection);
      return;
    }
    if (isCtrlOrCmdClick) {
      if (newSelection.has(clickedId)) newSelection.delete(clickedId);
      else newSelection.add(clickedId);
      setLastSelectedId(clickedId);
      setSelectedQrs(newSelection);
      return;
    }
    if (newSelection.has(clickedId) && newSelection.size === 1) {
      exitSelectionMode();
    } else {
      setSelectedQrs(new Set([clickedId]));
      setLastSelectedId(clickedId);
    }
  };

  const totalPages = Math.ceil(totalQrs / LIMIT);
  const isAnythingSelected = selectedQrs.size > 0;
  const isActionRunning = isAssigning || isDeleting || isUpdating;

  return (
    <div className="p-4">

      <QrScanAssign/>

      <div className="flex items-center justify-between mb-4 h-auto">
        {isAnythingSelected || selectionMode ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 w-full">
              <Button variant="ghost" size="icon" onClick={exitSelectionMode}>
                <X className="h-5 w-5" />
              </Button>
              <span className="font-medium text-sm whitespace-nowrap">
                {selectedQrs.size} selected
              </span>
              <div className="relative w-full max-w-xs">
                <Input
                  placeholder="Search for a partner to assign..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedPartner(null);
                  }}
                  className="text-sm"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    <ul>
                      {searchResults.map((partner) => (
                        <li
                          key={partner.id}
                          onClick={() => {
                            setSelectedPartner(partner);
                            setSearchTerm(partner.store_name);
                            setSearchResults([]);
                          }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                        >
                          {partner.store_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleAssignQrs}
                disabled={!selectedPartner || isActionRunning}
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full">
              <div className="flex" />
              {selectedQrs.size === 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangeTableNumber}
                  disabled={isActionRunning}
                >
                  {isUpdating ? "Saving..." : "Change Table"}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteQrs}
                disabled={isActionRunning}
              >
                {isDeleting ? "Deleting..." : `Delete (${selectedQrs.size})`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 w-full">
            <div className="relative flex-1">
              <Input
                placeholder="Search by QR Number or Partner Name..."
                value={mainSearch}
                onChange={(e) => setMainSearch(e.target.value)}
                className="text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreateQrs}
              disabled={isCreating || loading}
            >
              {isCreating ? "Creating..." : "Create New QR"}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table className="bg-white overflow-hidden">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>QR Id</TableHead>
              <TableHead>Table Number</TableHead>
              <TableHead>Partner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : qrs.length > 0 ? (
              qrs.map((qr) => (
                <TableRow
                  key={qr.id}
                  onClick={(e) => handleRowInteraction(qr.id, e)}
                  onTouchStart={() => handleTouchStart(qr.id)}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => e.preventDefault()}
                  data-state={selectedQrs.has(qr.id) ? "selected" : ""}
                  className="cursor-pointer data-[state=selected]:bg-green-100 select-none"
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={selectedQrs.has(qr.id)}
                      aria-label={`Select QR code ${qr.id}`}
                      className={
                        isAnythingSelected || selectionMode
                          ? "opacity-100 transition-opacity"
                          : "opacity-0 transition-opacity"
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium text-xs sm:text-base">
                    {qr.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {qr.table_number}
                  </TableCell>
                  <TableCell>
                    {qr.partner?.store_name ?? (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No QR codes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-4 py-4">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
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
