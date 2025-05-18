import { toast } from "sonner";

interface KimiAiLinkProps {
  className?: string;
}

export function KimiAiLink({ className = "" }: KimiAiLinkProps) {
  const handleClick = async () => {
    if (!document.hasFocus()) {
      window.focus();
    }
    navigator.clipboard.writeText(
      `You are an expert in extracting structured data from restaurant menu images. Your task is to extract each dish along with its variant (e.g., Quarter, Half, Full) as separate items.
            
            - The main heading in the image (e.g., AL FAHAM) should be used as the category.
            - For each dish like "Al Faham Normal", if there are sizes like Quarter, Half, Full, then extract them as separate items: "Al Faham Normal (Quarter)", "Al Faham Normal (Half)", etc.
            - The name should include the size (e.g., "Al Faham Honey (Full)").
            - The description should describe the item based on its name and size. Example: "A full portion of Al Faham Honey-flavored grilled chicken."
            - The price must be the correct number (ignore struck-through or older prices if new prices are written nearby if price is not given give price as 1).
            - Format your response as a JSON array only, with each object in this format:
            {
              "name": string,
              "price": number,
              "description": string,
              "category": string
            }`
    );
    toast.success("Prompt copied to clipboard!");
    window.open("https://aistudio.google.com/prompts/new_chat", "_blank");
  };

  return (
    <div
      onClick={handleClick}
      className={`underline text-sm py-2 text-blue-500 hover:text-blue-600 block text-right ${className}`}
    >
      Go to Gemini PRO {"(prompt is copied to clipboard)"} {"->"}
    </div>
  );
}
