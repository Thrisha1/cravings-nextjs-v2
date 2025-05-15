import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

interface Partner {
  id: string;
  name: string;
  email: string;
  store_name: string;
  location: string;
  status: string;
  upi_id: string;
  description: string | null;
  phone?: string;
  district?: string;
}

interface CreatePartnerStore {
  step: number;
  setStep: (step: number) => void;
  jsonInput: string;
  setJsonInput: (json: string) => void;
  parsedJson: object | null;
  setParsedJson: (json: object | null) => void;
  partner: Partner | null;
  setPartner: (partner: Partner) => void;
  clearData: () => void;
  imageGenerationLoading: boolean;
  partialImageLoading: boolean;
  aiImageLoading: boolean;
  imageProcessedCount: number;
  aiImageProcessedCount: number;
  setImageGenerationLoading: (loading: boolean) => void;
  setPartialImageLoading: (loading: boolean) => void;
  setAiImageLoading: (loading: boolean) => void;
  setImageProcessedCount: (count: number) => void;
  setAiImageProcessedCount: (count: number) => void;
  handleGenerateImages: () => Promise<void>;
  handlePartialImageGeneration: () => Promise<void>;
  handleGenerateAIImages: () => Promise<void>;
}

export const useCreatePartnerStore = create<CreatePartnerStore>()(
  persist(
    (set, get) => ({
      step: 1,
      setStep: (step) => set({ step }),
      jsonInput: "",
      setJsonInput: (json) => set({ jsonInput: json }),
      parsedJson: null,
      setParsedJson: (json) => set({ parsedJson: json }),
      partner: null,
      setPartner: (partner) => set({ partner }),
      clearData: () => set({ step: 1, jsonInput: "", parsedJson: null, partner: null }),
      imageGenerationLoading: false,
      partialImageLoading: false,
      aiImageLoading: false,
      imageProcessedCount: 0,
      aiImageProcessedCount: 0,
      setImageGenerationLoading: (loading) => set({ imageGenerationLoading: loading }),
      setPartialImageLoading: (loading) => set({ partialImageLoading: loading }),
      setAiImageLoading: (loading) => set({ aiImageLoading: loading }),
      setImageProcessedCount: (count) => set({ imageProcessedCount: count }),
      setAiImageProcessedCount: (count) => set({ aiImageProcessedCount: count }),
      handleGenerateImages: async () => {
        const { setImageGenerationLoading, setImageProcessedCount, jsonInput,setParsedJson } = get();
        if (!jsonInput) return;

        setImageGenerationLoading(true);
        setImageProcessedCount(0);

        try {
          const response = await axios.post("http://localhost:8000/fullImages", jsonInput, {
            headers: { "Content-Type": "application/json" },
          });

          if (response.data && Array.isArray(response.data)) {
            // Process response data
            setParsedJson((response.data));
            setImageProcessedCount(response.data.length);
          } else {
            throw new Error("Invalid response from image generation server");
          }
        } catch (err) {
          console.error(`Image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setImageGenerationLoading(false);
        }
      },
      handlePartialImageGeneration: async () => {
        const { setPartialImageLoading, setImageProcessedCount, jsonInput,setParsedJson } = get();
        if (!jsonInput) return;

        setPartialImageLoading(true);
        setImageProcessedCount(0);

        try {
          const response = await axios.post("http://localhost:8000/partialImages", jsonInput, {
            headers: { "Content-Type": "application/json" },
          });

          if (response.data && Array.isArray(response.data)) {
            // Process response data
            setParsedJson((response.data));
            setImageProcessedCount(response.data.length);
          } else {
            throw new Error("Invalid response from partial image generation server");
          }
        } catch (err) {
          console.error(`Partial image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setPartialImageLoading(false);
        }
      },
      handleGenerateAIImages: async () => {
        const { setAiImageLoading, setAiImageProcessedCount, jsonInput,setParsedJson } = get();
        if (!jsonInput) return;

        setAiImageLoading(true);
        setAiImageProcessedCount(0);

        try {
          const response = await axios.post("http://localhost:8000/generateAIImages", jsonInput, {
            headers: { "Content-Type": "application/json" },
          });

          if (response.data && Array.isArray(response.data)) {
            // Process response data
            setParsedJson((response.data));
            setAiImageProcessedCount(response.data.length);
          } else {
            throw new Error("Invalid response from AI image generation server");
          }
        } catch (err) {
          console.error(`AI Image generation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setAiImageLoading(false);
        }
      },
    }),
    {
      name: "create-partner-storage",
    }
  )
); 