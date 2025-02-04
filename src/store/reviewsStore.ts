import { create } from "zustand";
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, getCountFromServer, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface BaseReview {
  id?: string;
  userId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: Date;
}

export interface HotelReview extends BaseReview {
  type: 'hotel';
  hotelId: string;
}

export interface OfferReview extends BaseReview {
  type: 'offer';
  offerId: string;
}

export type Review = HotelReview | OfferReview;

interface ReviewsStore {
  reviews: Review[];
  addReview: (review: Review) => Promise<void>;
  removeReview: (reviewId: string) => Promise<void>;
  getReviewsByHotelId: (hotelId: string) => Promise<HotelReview[]>;
  getReviewsByOfferId: (offerId: string) => Promise<OfferReview[]>;
  getUserReviews: (userId: string) => Promise<Review[]>;
  getTotalNumberOfReviewsByOfferId: (offerId: string) => Promise<number>;
  getTotalNumberOfReviewsByHotelId: (hotelId: string) => Promise<number>;
  getLastThreeReviewsByHotelId: (hotelId: string) => Promise<HotelReview[]>;
  getLastThreeReviewsByOfferId: (offerId: string) => Promise<OfferReview[]>;
  getAverageReviewByHotelId: (hotelId: string) => Promise<number>;
  getAverageReviewByOfferId: (offerId: string) => Promise<number>;
}

export const useReviewsStore = create<ReviewsStore>((set) => ({
  reviews: [],

  addReview: async (review) => {
    const reviewsRef = collection(db, "reviews");
    await addDoc(reviewsRef, {
      ...review,
      createdAt: new Date()
    });
  },

  removeReview: async (reviewId) => {
    const reviewRef = doc(db, "reviews", reviewId);
    await deleteDoc(reviewRef);
  },

  getReviewsByHotelId: async (hotelId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef, 
      where("type", "==", "hotel"),
      where("hotelId", "==", hotelId)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate()
    })) as HotelReview[];

    set({ reviews: reviews });
    return reviews;
  },

  getReviewsByOfferId: async (offerId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "offer"),
      where("offerId", "==", offerId)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate()
    })) as OfferReview[];

    set({ reviews: reviews });
    return reviews;
  },

  getUserReviews: async (userId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate()
    })) as Review[];

    set({ reviews: reviews });
    return reviews;
  },

  getTotalNumberOfReviewsByOfferId: async (offerId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "offer"),
      where("offerId", "==", offerId)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  getTotalNumberOfReviewsByHotelId: async (hotelId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "hotel"),
      where("hotelId", "==", hotelId)
    );
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  },

  getLastThreeReviewsByHotelId: async (hotelId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "hotel"),
      where("hotelId", "==", hotelId),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate()
    })) as HotelReview[];

    set({ reviews: reviews });
    return reviews;
  },

  getLastThreeReviewsByOfferId: async (offerId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "offer"),
      where("offerId", "==", offerId),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt.toDate()
    })) as OfferReview[];

    set({ reviews: reviews });
    return reviews;
  },

  getAverageReviewByHotelId: async (hotelId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "hotel"),
      where("hotelId", "==", hotelId)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => doc.data().rating);
    
    if (reviews.length === 0) return 0;
    
    const average = reviews.reduce((acc, rating) => acc + rating, 0) / reviews.length;
    return Number(average.toFixed(1));
  },

  getAverageReviewByOfferId: async (offerId) => {
    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("type", "==", "offer"),
      where("offerId", "==", offerId)
    );
    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => doc.data().rating);
    
    if (reviews.length === 0) return 0;
    
    const average = reviews.reduce((acc, rating) => acc + rating, 0) / reviews.length;
    return Number(average.toFixed(1));
  },
}));
