// "use client";
// import React, { useEffect, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useReviewsStore } from "@/store/reviewsStore";
// import { useAuthStore } from "@/store/authStore";
// import { Textarea } from "@/components/ui/textarea";
// import { toast } from "sonner";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { MenuItem } from "@/store/menuStore";

// const CreateNewReviewPage = () => {
//   const router = useRouter();
//   const [rating, setRating] = useState(0);
//   const [comment, setComment] = useState("");
//   const { addReview } = useReviewsStore();
//   const { userData, user, fetchUserData } = useAuthStore();
//   const params = useParams();
//   const [menuItemDetails, setMenuItemDetails] = useState<MenuItem | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     if (!user) {
//       router.push("/login");
//       return;
//     }

//     if (!userData) {
//       fetchUserData(user.uid as string);
//     }

//     if (params.mId) {
//       const fetchMenuItemDetails = async () => {
//         const menuItemDoc = await getDoc(doc(db, "menuItems", params.mId as string));
//         if (menuItemDoc.exists()) {
//           setMenuItemDetails(menuItemDoc.data() as MenuItem);
//         }
//         setIsLoading(false);
//       };
//       fetchMenuItemDetails();
//     }

//     const savedRating = localStorage.getItem(`menuItem_${params.mId}_rating`);
//     if (savedRating) {
//       setRating(parseInt(savedRating));
//     }
//   }, [fetchUserData, user, params.mId]);

//   const handleSubmit = async () => {
//     if (!userData) return;

//     await addReview({
//       type: "menuItem",
//       menuId: params.mId as string,
//       userId: user?.uid as string,
//       userName: (userData.full_name as string),
//       rating,
//       comment,
//       createdAt: new Date(),
//     });

//     toast.success("Review added successfully");
//     localStorage.removeItem(`menuItem_${params.mId}_rating`);
//     router.back();
//   };

//   return (
//     <section className="min-h-screen bg-gradient-to-b from-orange-500/10 to-orange-500/20">
//       {/* App Bar */}
//       <div className="bg-white px-4 py-3 md:px-8 md:py-4 flex items-center justify-between shadow-sm">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => {
//               localStorage.removeItem(`menuItem_${params.mId}_rating`);
//               router.back();
//             }}
//           >
//             <X className="w-6 h-6" />
//           </button>
//           {isLoading ? (
//             <div>
//               <div className="h-5 w-32 md:h-6 md:w-40 bg-gray-200 rounded-full animate-pulse"></div>
//               <div className="h-4 w-24 md:h-5 md:w-32 bg-gray-200 rounded-full animate-pulse mt-1"></div>
//             </div>
//           ) : (
//             <div>
//               <h1 className="font-semibold md:text-xl">{menuItemDetails?.name}</h1>
//               <p className="text-sm md:text-base text-gray-500">₹{menuItemDetails?.price}</p>
//             </div>
//           )}
//         </div>
//         <Button
//           onClick={handleSubmit}
//           disabled={rating === 0}
//           className="text-orange-600 hover:text-orange-500 hover:bg-transparent bg-transparent shadow-none border-none outline-none md:text-lg"
//         >
//           Post
//         </Button>
//       </div>

//       {/* Review Content */}
//       <div className="container mx-auto px-4 py-6 md:px-8 md:py-10 space-y-6 md:space-y-8 max-w-3xl">
//         {isLoading ? (
//           <div className="space-y-2">
//             <div className="h-5 w-40 md:h-6 md:w-48 bg-gray-200 rounded-full animate-pulse"></div>
//             <div className="h-4 w-64 md:h-5 md:w-72 bg-gray-200 rounded-full animate-pulse"></div>
//           </div>
//         ) : (
//           <div className="space-y-2">
//             <p className="font-medium md:text-lg">
//               {userData?.full_name}
//             </p>
//             <p className="text-sm md:text-base text-gray-600">
//               Reviews are public and include your account info
//             </p>
//           </div>
//         )}

//         {/* Star Rating */}
//         <div className="flex gap-2 md:gap-4 justify-between max-w-sm mx-auto">
//           {[1, 2, 3, 4, 5].map((star) => (
//             <button
//               key={star}
//               onClick={() => setRating(star)}
//               className={`text-4xl md:text-5xl transition-colors duration-200 hover:scale-110 ${
//                 rating >= star ? "text-orange-600" : "text-gray-200"
//               }`}
//             >
//               ★
//             </button>
//           ))}
//         </div>

//         {/* Comment Input */}
//         <Textarea
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           maxLength={500}
//           placeholder="Describe your experience (optional)"
//           className="h-32 md:h-40 resize-none bg-white/90 focus-visible:ring-orange-600 md:text-lg"
//         />
//         <p className="text-sm md:text-base text-gray-500 text-right">{comment.length}/500</p>
//       </div>
//     </section>
//   );
// };

// export default CreateNewReviewPage;

import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page