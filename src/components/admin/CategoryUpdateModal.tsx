// import React, { useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
// import { Input } from "../ui/input";
// import { Button } from "../ui/button";
// import { useCategoryStore } from "@/store/categoryStore_hasura";
// import { toast } from "sonner";

// const CategoryUpdateModal = ({
//   catId,
//   cat,
//   isOpen,
//   onOpenChange,
//   setCatUpdated,
//   catUpdated
// }: {
//   catId: string;
//   cat: string;
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   setCatUpdated: (updated: boolean) => void;
//     catUpdated: boolean;
// }) => {
//   const { updateCategory } = useCategoryStore();
//   const [updatedCat, setUpdtedCat] = useState(cat);

//   const handleUpdateCategory = async () => {
//     try {
//         console.log("Updating category:", updatedCat, catId);
        
//       await updateCategory(updatedCat, catId);
//       toast.success("Category updated successfully");
//       onOpenChange(false);
//       setCatUpdated(!catUpdated);
//     } catch (error) {
//       console.error("Error updating category:", error);
//       toast.error("Failed to update category");
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Update Category</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <Input
//             placeholder="Enter new category name"
//             value={updatedCat}
//             onChange={(e) => {
//               setUpdtedCat(e.target.value);
//             }}
//           />
//           <Button onClick={handleUpdateCategory}>Update</Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default CategoryUpdateModal;
