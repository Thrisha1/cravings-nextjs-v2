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
import { Paintbrush, LayoutGrid, Palette, Type } from "lucide-react";
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
  menuStyle: string;
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

  return (
    <>
      <Dialog>
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

        <DialogContent className="w-[95%] max-w-[425px] rounded-xl px-2 sm:px-6 grid h-fit top-[50%] translate-y-[-50%]">
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

            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-14"
              onClick={() => setFontModalOpen(true)}
            >
              <Type className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Change Font</p>
                <p className="text-sm text-muted-foreground">
                  Customize the font family
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-3 h-14"
              onClick={() => setMenuStyleModalOpen(true)}
            >
              <LayoutGrid className="h-5 w-5" />
              <div className="text-left">
                <p className="font-medium">Change Menu Style</p>
                <p className="text-sm text-muted-foreground">
                  Modify how menu items are displayed
                </p>
              </div>
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
            menuStyle: theme?.menuStyle || "default", // Default value
          })
        }
      />

      {/* Menu Style Modal */}
      <MenuStyleModal
        theme={theme}
        open={menuStyleModalOpen}
        onOpenChange={setMenuStyleModalOpen}
        onSave={(style) =>
          onSave({
            colors: {
              text: theme?.colors?.text || "#000000",
              bg: theme?.colors?.bg || "#ffffff",
              accent: theme?.colors?.accent || "#000000",
            },
            menuStyle: style,
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
            menuStyle: theme?.menuStyle || "default",
            fontFamily,
          })
        }
      />
    </>
  );
};

export default ThemeChangeButton;
