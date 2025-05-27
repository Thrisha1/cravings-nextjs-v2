import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Order } from "@/store/orderStore";
import { toast } from "sonner";
import { fetchFromHasura } from "@/lib/hasuraClient";

const AddNoteComponent = ({
  setOrder,
  order,
}: {
  setOrder: Dispatch<SetStateAction<Order>>;
  order: Order;
}) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (order.notes) {
      setNote(order.notes);
    } else {
      setNote("");
    }
  }, [order]);

  const handleAddNote = () => {
    if (showNoteInput) {
      setShowNoteInput(false);
    } else {
      setShowNoteInput(true);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note before saving.");
      return;
    }

    const prevNote = order.notes || "";

    try {
      setOrder({
        ...order,
        notes: note.trim(),
      });

      setShowNoteInput(false);

      await fetchFromHasura(
        `
        mutation UpdateOrderNotes($orderId: uuid!, $notes: String!) {
          update_orders_by_pk(pk_columns: {id: $orderId}, _set: {notes: $notes}) {
            id
          }
        }
      `,
        {
          orderId: order.id,
          notes: note.trim(),
        }
      );

      toast.success("Note added successfully!");
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
      setOrder({
        ...order,
        notes: prevNote,
      });
    }
  };

  return (
    <>
      <div
        className=" text-orange-500 text-sm cursor-pointer"
        onClick={handleAddNote}
      >
        + Add Note
      </div>

      {showNoteInput && (
        <div className="flex flex-col mt-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border border-gray-300 rounded p-2 bg-white text-balck"
            placeholder="Add your note here..."
          ></Textarea>
          <Button
            className="mt-2 bg-orange-500 text-white px-4 py-2 rounded"
            onClick={() => {
              handleSaveNote();
            }}
          >
            Save Note
          </Button>
        </div>
      )}
    </>
  );
};

export default AddNoteComponent;
