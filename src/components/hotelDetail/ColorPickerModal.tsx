import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThemeConfig } from "./ThemeChangeButton";
import { History, X } from "lucide-react";
import dynamic from "next/dynamic";

interface ColorPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (colors: { text: string; bg: string; accent: string }) => void;
  theme: ThemeConfig | null;
}

const DEFAULT_COLORS = {
  text: "#000000",
  bg: "#F5F5F5",
  accent: "#EA580C",
};

const PRESETS = [
  {
    text: "#000000",
    bg: "#FEF6EB",
    accent: "#E9701B",
  },
  {
    text: "#0D1321",
    bg: "#F0EBD8",
    accent: "#3E5C76",
  },
  {
    text: "#172121",
    bg: "#E5D0CC",
    accent: "#444554",
  },
  {
    text: "#000000",
    bg: "#FFEBE7",
    accent: "#7F95D1",
  }
];

const HexColorPicker = dynamic(
  () => import("react-colorful").then(mod => ({ default: mod.HexColorPicker })),
  { ssr: false }
);

const ColorPickerModal = ({
  theme,
  open,
  onOpenChange,
  onSave,
}: ColorPickerModalProps) => {
  const [colors, setColors] = React.useState({
    text: theme?.colors?.text || DEFAULT_COLORS.text,
    bg: theme?.colors?.bg || DEFAULT_COLORS.bg,
    accent: theme?.colors?.accent || DEFAULT_COLORS.accent,
  });
  const [currentPicker, setCurrentPicker] =
    React.useState<keyof typeof colors>("text");
  const [showColorPicker, setShowColorPicker] = React.useState(false);

  const handleReset = () => {
    setColors(DEFAULT_COLORS);
  };

  const handleCancel = () => {
    setColors({
      text: theme?.colors?.text || DEFAULT_COLORS.text,
      bg: theme?.colors?.bg || DEFAULT_COLORS.bg,
      accent: theme?.colors?.accent || DEFAULT_COLORS.accent,
    });
    onOpenChange(false);
  };

  useEffect(() => {
    setColors({
      text: theme?.colors?.text || DEFAULT_COLORS.text,
      bg: theme?.colors?.bg || DEFAULT_COLORS.bg,
      accent: theme?.colors?.accent || DEFAULT_COLORS.accent,
    });
  }, [open]);

  const handleColorButtonClick = (colorKey: keyof typeof colors) => {
    setCurrentPicker(colorKey);
    setShowColorPicker(true);
  };

  return (
    <>
      {/* Main customization dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        // Only allow opening, not closing when clicking outside
        if (isOpen) {
          onOpenChange(true);
        }
      }}>
        <DialogContent className="w-[95vw] max-w-[425px] rounded-xl mx-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader className="relative">
            <div className="flex items-center justify-between">
              <div></div>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-center">
                Color Customization
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <History className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between h-[150px] sm:h-[200px] gap-2">
              {Object.entries(colors).map(([key, value]) => (
                <div className="flex flex-col items-center gap-2" key={key}>
                  <Button
                    variant={currentPicker === key ? "default" : "outline"}
                    onClick={() => handleColorButtonClick(key as keyof typeof colors)}
                    style={{ backgroundColor: value }}
                    className={`transition-transform duration-200 rounded-full h-[80px] w-[80px] sm:h-[100px] sm:w-[100px] ${
                      currentPicker === key ? "scale-110" : "scale-100"
                    }`}
                  ></Button>
                  <div className="text-black capitalize font-medium text-sm sm:text-base"> {key}</div>
                </div>
              ))}
            </div>

            <div className="py-2">
              <h1 className="text-base sm:text-lg font-semibold mb-2">Presets</h1>
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2">
                {PRESETS.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => setColors(preset)}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: preset.accent }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onSave(colors);
                    onOpenChange(false);
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Color picker dialog */}
      <Dialog open={showColorPicker} onOpenChange={(isOpen) => {
        // Only allow opening, not closing when clicking outside
        if (isOpen) {
          setShowColorPicker(true);
        }
      }}>
        <DialogContent className="w-[95vw] max-w-[425px] rounded-xl mx-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader className="relative">
            <DialogTitle className="capitalize text-lg sm:text-xl font-semibold text-center">
              Pick {currentPicker} color
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(false)}
              className="absolute right-0 top-0 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 sm:gap-6 py-4">
            <HexColorPicker
              color={colors[currentPicker]}
              onChange={(color) =>
                setColors({ ...colors, [currentPicker]: color })
              }
              style={{ width: "100%", height: "180px" }}
            />
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border"
                style={{ backgroundColor: colors[currentPicker] }}
              />
              <div className="font-mono text-sm sm:text-base">{colors[currentPicker]}</div>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setShowColorPicker(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowColorPicker(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ColorPickerModal;