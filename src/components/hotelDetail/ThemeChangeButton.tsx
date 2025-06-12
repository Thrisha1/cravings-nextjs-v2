"use client";

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
import { Paintbrush, LayoutGrid, Palette, Type, X } from "lucide-react";
import ColorPickerModal from "./ColorPickerModal";
import MenuStyleModal from "./MenuStyleModal";
import { toast } from "sonner";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { updatePartnerMutation } from "@/api/partners";
import { revalidateTag } from "@/app/actions/revalidate";
import { FontPickerModal } from "../FontPickerModal";

export interface ThemeConfig {
  colors: {
    text: string;
    bg: string;
    accent: string;
  };
  menuItemStyle: string;
  infoAlignment?: string;
  fontFamily?: string;
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
  const [fontModalOpen, setFontModalOpen] = useState(false);
  const [mainModalOpen, setMainModalOpen] = useState(false);

  const onSave = async (theme: ThemeConfig) => {
    try {
      toast.loading("Saving theme...");
      await fetchFromHasura(updatePartnerMutation, {
        id: hotelData.id,
        updates: {
          theme: JSON.stringify(theme),
        },
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

  const handleColorClick = () => {
    setColorModalOpen(true);
    setMainModalOpen(false);
  };

  const handleFontClick = () => {
    setFontModalOpen(true);
    setMainModalOpen(false);
  };

  const handleMenuStyleClick = () => {
    setMenuStyleModalOpen(true);
    setMainModalOpen(false);
  };

  const handleMainModalClose = () => {
    setMainModalOpen(false);
  };

  return (
    <>
      {/* Main theme button */}
      <Dialog open={mainModalOpen} onOpenChange={(open) => {
        // Only allow opening, not closing when clicking outside
        if (open) {
          setMainModalOpen(true);
        }
      }}>
        <DialogTrigger asChild>
          <button aria-label="Change theme">
            <Palette
              style={{
                color: theme?.colors?.text || "#000000",
              }}
              className="h-8 w-8 "
              strokeWidth={1.8}
            />
          </button>
        </DialogTrigger>

        <DialogContent className="w-[95vw] max-w-[425px] rounded-xl px-4 sm:px-6 mx-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader className="relative">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
              Theme Customization
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMainModalClose}
              className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 sm:h-14 text-left p-3 sm:p-4"
              onClick={handleColorClick}
            >
              <Paintbrush className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Change Colors</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Customize primary and secondary colors
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 sm:h-14 text-left p-3 sm:p-4"
              onClick={handleFontClick}
            >
              <Type className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Change Font</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Customize the font family
                </p>
              </div>
            </Button>

            {/* <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-12 sm:h-14 text-left p-3 sm:p-4"
              onClick={handleMenuStyleClick}
            >
              <LayoutGrid className="h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">Change Menu Item Style</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Modify how menu items are displayed
                </p>
              </div>
            </Button> */}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={handleMainModalClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color Picker Modal */}
      <ColorPickerModal
        theme={theme}
        open={colorModalOpen}
        onOpenChange={setColorModalOpen}
        onSave={(colors) =>
          onSave({
            colors,
            menuItemStyle: "default", // Default value
          })
        }
      />

      {/* Menu Style Modal */}
      <MenuStyleModal
        open={menuStyleModalOpen}
        onOpenChange={setMenuStyleModalOpen}
        onSave={(style) =>
          onSave({
            colors: {
              text: "#000000",
              bg: "#ffffff",
              accent: "#000000",
            },
            menuItemStyle: style,
          })
        }
      />

      <FontPickerModal
        theme={theme}
        open={fontModalOpen}
        onOpenChange={setFontModalOpen}
        onSave={(fontFamily) =>
          onSave({
            colors: theme?.colors || {
              text: "#000000",
              bg: "#ffffff",
              accent: "#000000",
            },
            menuItemStyle: theme?.menuItemStyle || "default",
            fontFamily,
          })
        }
      />
    </>
  );
};

export default ThemeChangeButton;
