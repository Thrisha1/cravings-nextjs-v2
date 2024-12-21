import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface LocationSelectionProps {
  locations: string[];
}

const LocationSelection: React.FC<LocationSelectionProps> = ({
  locations,
}) => {
  const searchParams = useSearchParams();
  const location = searchParams.get("location");
  const router = useRouter();

  const setLocation = (location: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (location) {
      params.set("location", location);
    } else {
      params.delete("location");
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.replace("?" + params.toString());

  };

  return (
    <div className="w-full md:w-64">
      <Select
        value={location || "all"}
        onValueChange={(value) =>
          setLocation(value === "all" ? null : value)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All locations</SelectItem>
          {locations.map((location) => (
            <SelectItem key={location} value={location}>
              {location}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSelection;
