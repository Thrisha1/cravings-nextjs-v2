"use client";
import { Offer } from "@/store/offerStore";
import React, { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { saveSurvey } from "@/app/actions/saveSurvey";

const SurveyDialog = ({ offers }: { offers: Offer[] }) => {
  const [isUserNearby, setIsUserNearby] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const nearestOffer = offers[0];

    if (nearestOffer) {
      const distance = nearestOffer.distance as number;
      const hasSurveySubmitted =
        localStorage.getItem("surveySubmitted") === "1";
      if (distance >= 35 && !hasSurveySubmitted) {
        setIsUserNearby(false);
      } else {
        setIsUserNearby(true);
      }
    }
  }, [offers]);

  const handleOpenChange = () => {
    setIsUserNearby(true);
  };

  if (isDesktop) {
    return (
      <Dialog open={!isUserNearby} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <SurveyForm setIsUserNearby={setIsUserNearby} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={!isUserNearby} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <SurveyForm setIsUserNearby={setIsUserNearby} className="px-4" />
      </DrawerContent>
    </Drawer>
  );
};

const districts = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

const SurveyForm = ({
  className,
  setIsUserNearby,
}: {
  className?: string;
  setIsUserNearby: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [favoriteHotel, setFavoriteHotel] = useState("");
  const [hotelSuggestions, setHotelSuggestions] = useState<string[]>([]);
  const [allHotels, setAllHotels] = useState([]);
  const [favoriteFood, setFavoriteFood] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid , setIsValid] = useState(false);

  useEffect(() => {
    if (selectedDistrict) {
      const query = `
          [out:json];
          area["name"="${selectedDistrict}"]->.a;
          node(area.a)["amenity"="restaurant"];
          out body;
          `;
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        query
      )}`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          // Extract hotel names (restaurant names in this case) from Overpass API response
          const restaurants = data.elements
            .filter((element: { tags: { name: string } }) => element.tags.name)
            .map((element: { tags: { name: string } }) => element.tags.name);

          setHotelSuggestions(restaurants); 
          setAllHotels(data.elements); 
        })
        .catch((error) => console.error("Error fetching hotels:", error));
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedDistrict && favoriteFood && favoriteFood) {
      setIsValid(true);
    }
  }, [selectedDistrict, favoriteHotel, favoriteFood]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const selectedHotel = allHotels?.length > 0 && allHotels?.find(
      (hotel: { tags: { name: string } }) => hotel.tags.name === favoriteHotel
    );

    const formData = {
      district: selectedDistrict,
      favoriteHotel,
      favoriteFood,
      hotelDetails: selectedHotel ?? null,
    };

    try {
      await saveSurvey(formData);
      alert("Survey submitted successfully!");
    } catch (error) {
      console.error("Error submitting survey:", error);
      alert("Failed to submit survey. Please try again.");
    }

    setIsLoading(false);
    setIsUserNearby(true);
    localStorage.setItem("surveySubmitted", "1");
  };

  return (
    <form
      onSubmit={isLoading ? () => {} : handleSubmit}
      className={`p-4 bg-white ${className}`}
    >
      <h2 className="text-lg font-semibold text-orange-600">Customer Survey</h2>
      <p className="mb-4 text-sm text-black/30">
        Since you're too far to enjoy our offers, tell us your favorite food and restaurant so we can serve you better.
      </p>

      <label className="block mb-2">Select your district</label>
      <Select onValueChange={(value) => setSelectedDistrict(value)}>
        <SelectTrigger>{selectedDistrict || "Choose a district"}</SelectTrigger>
        <SelectContent>
          {districts.map((district) => (
            <SelectItem key={district} value={district}>
              {district}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="block mt-4 mb-2">Favorite Hotel</label>
      <Input
        value={favoriteHotel}
        onChange={(e) => setFavoriteHotel(e.target.value)}
        list="hotelSuggestions"
        placeholder="Type to search..."
      />
      <datalist id="hotelSuggestions">
        {hotelSuggestions.map((hotel, index) => (
          <option key={index} value={hotel} />
        ))}
      </datalist>

      <label className="block mt-4 mb-2">Favorite Food</label>
      <Input
        value={favoriteFood}
        onChange={(e) => setFavoriteFood(e.target.value)}
        placeholder="Enter your favorite food"
      />

      <Button
        disabled={isLoading || !isValid}
        type="submit"
        className="mt-6 w-full disabled:pointer-events-none disabled:opacity-50 bg-orange-600 hover:bg-orange-500 text-white font-medium"
      >
        {isLoading && isValid ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};

export default SurveyDialog;
