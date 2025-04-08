import { useCategoryStore } from "@/store/categoryStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface KimiAiLinkProps {
  className?: string;
}



export function KimiAiLink({ className = "" }: KimiAiLinkProps) {
  const { fetchCategories } = useCategoryStore();

  const handleClick = async () => {
    await fetchCategories().then((categories) => {
      if (!document.hasFocus()) {
        window.focus();
      }
      navigator.clipboard.writeText(
        `Extract the menu items from the provided text and convert them into a valid JSON array following these specifications:
      
      1. Required JSON Structure for each item:
      {
        "name": "string (item name)",
        "price": number (numeric value only),
        "description": "string (brief 5-10 word description)",
        "category": "string (must match exactly from allowed categories below)"
      }
      
      2. Allowed Categories (case-sensitive):
      ${categories.map(cat => `- ${cat}`).join('\n')}
      
      3. Rules:
      - Only use the exact category names listed above
      - Price must be a number (no currency symbols)
      - Descriptions should be concise but descriptive
      - Output must be valid JSON (no trailing commas)
      - Return only the JSON array with no additional text
      
      4. Example Output:
      [
        {
          "name": "Example Dish",
          "price": 200,
          "description": "Brief description of the dish",
          "category": "${categories.length > 0 ? categories[0] : 'Category'}"
        }
      ]`
      );
      toast.success("Prompt copied to clipboard!");
      window.open(
        "https://kimi.moonshot.cn/",
        "_blank"
      );
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`underline text-sm py-2 text-blue-500 hover:text-blue-600 block text-right ${className}`}
    >
      Go to KIMI.ai {"(prompt is copied to clipboard)"} {"->"}
    </div>
  );
}
