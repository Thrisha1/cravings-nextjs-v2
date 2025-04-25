import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import { ThemeConfig } from "./ThemeChangeButton";

interface ColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (colors: {
    text: string;
    bg: string;
    navbar: string;
    accent: string;
  }) => void;
  theme: ThemeConfig;
}

const DEFAULT_COLORS = {
  text: "#000000",
  bg: "#FEF6EB",
  navbar: "#ffffff",
  accent: "#E9701B",
};

const ColorPickerModal = ({
  theme,
  open,
  onOpenChange,
  onSave,
}: ColorPickerModalProps) => {
  const [colors, setColors] = React.useState({
    text: theme?.colors?.text || DEFAULT_COLORS.text,
    bg: theme?.colors?.bg || DEFAULT_COLORS.bg,
    navbar: theme?.colors?.navbar || DEFAULT_COLORS.navbar,
    accent: theme?.colors?.accent || DEFAULT_COLORS.accent,
  });
  const [currentPicker, setCurrentPicker] =
    React.useState<keyof typeof colors>("text");

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
  };

  useEffect(() => {
    setColors({
      text: theme?.colors?.text || DEFAULT_COLORS.text,
      bg: theme?.colors?.bg || DEFAULT_COLORS.bg,
      navbar: theme?.colors?.navbar || DEFAULT_COLORS.navbar,
      accent: theme?.colors?.accent || DEFAULT_COLORS.accent,
    });
  }
  , [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Color Customization</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(colors).map(([key, value]) => (
              <Button
                key={key}
                variant={currentPicker === key ? "default" : "outline"}
                onClick={() => setCurrentPicker(key as keyof typeof colors)}
                style={{ backgroundColor: value }}
                className={`transition-transform duration-200 ${
                  currentPicker === key ? "scale-110" : "scale-100"
                }`}
              >
                <span className="mix-blend-difference"> {key}</span>
              </Button>
            ))}
          </div>

          <HexColorPicker
            color={colors[currentPicker]}
            onChange={(color: string) =>
              setColors({ ...colors, [currentPicker]: color })
            }
            className="w-full h-64"
          />

          <div className="flex flex-col gap-2 items-end">
            <Button variant="outline" onClick={handleReset}>
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSave(colors);
                  onOpenChange(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColorPickerModal;
