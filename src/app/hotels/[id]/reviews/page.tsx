// "use client";
// import React, { useEffect, useState } from "react";
// // import { useReviewsStore } from "@/store/reviewsStore";
// // import ReviewCard from "@/components/ReviewCard";
// import { Star, X } from "lucide-react";
// import { useParams, useRouter } from "next/navigation";
// import { useAuthStore, userData } from "@/store/authStore";
// import RateThis from "@/components/RateThis";

// const ReviewsPage = () => {
//   const router = useRouter();
//   // const { reviews, getReviewsByHotelId } = useReviewsStore();
//   const [isLoading, setIsLoading] = useState(true);
//   const params = useParams();
//   const { userData } = useAuthStore();
//   const [hotelData, setHotelData] = useState<UserData | null>(null);

//   useEffect(() => {
//     getReviewsByHotelId(params.id as string).then(() => {
//       setIsLoading(false);
//     });

//     if (params.id) {
//       fetchUserData(params.id as string, false).then((data) => {
//         setHotelData(data as UserData);
//       });
//     }
//   }, [params.id]);

//   return (
//     <section className="min-h-screen bg-gradient-to-b from-orange-500/10 to-orange-500/20">
//       {/* App Bar */}
//       <div className="bg-white px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shadow-sm">
//         <div className="flex items-center gap-3 md:gap-4">
//           <button onClick={() => router.back()}>
//             <X className="w-6 h-6 md:w-7 md:h-7" />
//           </button>
//           {isLoading ? (
//             <div>
//               <div className="h-5 md:h-6 w-32 md:w-40 bg-gray-200 rounded-full animate-pulse"></div>
//               <div className="h-4 md:h-5 w-24 md:w-32 bg-gray-200 rounded-full animate-pulse mt-1"></div>
//             </div>
//           ) : (
//             <div>
//               <h1 className="font-semibold text-base md:text-xl">{hotelData?.hotelName}</h1>
//               <p className="text-sm md:text-base text-gray-500">{hotelData?.area}</p>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="container mx-auto px-4 md:px-8 py-6 md:py-10">
//         <div className="pb-10 max-w-2xl mx-auto">
//           <RateThis type="hotel" />
//         </div>

//         <div className="max-w-4xl mx-auto">
//           <h1 className="text-xl md:text-2xl font-semibold py-3 md:py-5">All Reviews</h1>
//           <div className="grid gap-5 md:gap-8 divide-y-2 divide-orange-200">
//             {!isLoading ? (
//               <>
//                 {reviews.length > 0 ? (
//                   <>
//                     {reviews.map((review) => (
//                       <ReviewCard key={review.id} review={review} />
//                     ))}
//                   </>
//                 ) : (
//                   <p className="text-gray-500 text-sm font-medium py-5">
//                     No reviews yet
//                   </p>
//                 )}
//               </>
//             ) : (
//               <>
//                 {[...Array(5)].map((_, i) => (
//                   <div key={i} className="animate-pulse py-3 md:py-5">
//                     <span className="block bg-gray-200 rounded-full w-[150px] md:w-[200px] h-4 md:h-5" />

//                     <div className="flex items-center gap-2 mt-3 md:mt-4">
//                       <div className="flex items-center">
//                         {[...Array(5)].map((_, i) => (
//                           <Star
//                             key={i}
//                             className={`w-4 h-4 md:w-5 md:h-5 fill-gray-200 text-gray-200`}
//                           />
//                         ))}
//                       </div>
//                       <span className="block bg-gray-200 rounded-full w-[50px] md:w-[70px] h-3 md:h-4" />
//                     </div>

//                     <div className="grid gap-1 md:gap-2 mt-2 md:mt-4">
//                       <span className="block bg-gray-200 rounded-full w-full h-4 md:h-5" />
//                       <span className="block bg-gray-200 rounded-full w-[80%] h-4 md:h-5" />
//                       <span className="block bg-gray-200 rounded-full w-[30%] h-4 md:h-5" />
//                     </div>
//                   </div>
//                 ))}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ReviewsPage;

import React from 'react'

const page = () => {
  return (
    <div>page</div>
  )
}

export default page