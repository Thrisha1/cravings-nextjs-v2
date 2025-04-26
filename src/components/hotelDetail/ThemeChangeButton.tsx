import { Partner } from "@/store/authStore";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paintbrush, LayoutGrid } from "lucide-react";
import ColorPickerModal from "./ColorPickerModal";
import MenuStyleModal from "./MenuStyleModal";
import { toast } from "sonner";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { updatePartnerThemeMutation } from "@/api/partners";
import { revalidateTag } from "@/app/actions/revalidate";

export interface ThemeConfig {
  colors: {
    text: string;
    bg: string;
    accent: string;
  };
  menuItemStyle: string;
}

const ThemeChangeButton = ({
  hotelData,
  theme,
}: {
  hotelData: Partner;
  theme: ThemeConfig | null;
}) => {
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [menuStyleModalOpen, setMenuStyleModalOpen] = useState(false);


  const onSave = async (theme: ThemeConfig) => {
    try {
      toast.loading("Saving theme...");
      await fetchFromHasura(updatePartnerThemeMutation, {
        userId: hotelData.id,
        theme: JSON.stringify(theme),
      });
      toast.dismiss();
      toast.success("Theme saved successfully");
      revalidateTag(hotelData.id);
    } catch (error) {
      toast.dismiss();
      console.error("Error saving theme:", error);
      toast.error("Failed to save theme");
    }
  };


  return (
    <div className="absolute top-5 right-5 z-50">
      {/* Main theme button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-10 h-10 bg-white shadow-md hover:bg-gray-100"
            aria-label="Change theme"
          >
            <Paintbrush className="h-4 w-4 text-black" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="w-[95%] max-w-[425px] rounded-xl px-2 sm:px-6">
          <DialogHeader>
            <DialogTitle>Theme Customization</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline"
              className="flex items-center justify-start gap-3 h-14"
              onClick={() => setColorModalOpen(true)}
            >
              <Paintbrush className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Change Colors</p>
                <p className="text-sm text-muted-foreground">
                  Customize primary and secondary colors
                </p>
              </div>
            </Button>
            
            {/* <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-14"
              onClick={() => setMenuStyleModalOpen(true)}
            >
              <LayoutGrid className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Change Menu Item Style</p>
                <p className="text-sm text-muted-foreground">
                  Modify how menu items are displayed
                </p>
              </div>
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Modal */}
      <ColorPickerModal
        theme={theme}
        open={colorModalOpen}
        onOpenChange={setColorModalOpen}
        onSave={(colors) => onSave({
          colors,
          menuItemStyle: "default" // Default value
        })}
      />

      {/* Menu Style Modal */}
      <MenuStyleModal
        open={menuStyleModalOpen}
        onOpenChange={setMenuStyleModalOpen}
        onSave={(style) => onSave({
          colors: {
            text: "#000000",
            bg: "#ffffff",
            accent: "#000000"
          },
          menuItemStyle: style
        })}
      />
    </div>
  );
};

export default ThemeChangeButton;