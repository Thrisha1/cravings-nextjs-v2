import { menuCatagories } from "@/store/menuStore";
import Link from "next/link";

interface KimiAiLinkProps {
  className?: string;
}

export function KimiAiLink({ className = "" }: KimiAiLinkProps) {
  const handleClick = () => {
    navigator.clipboard.writeText(
      `extract the menuitems as json { name : string, price : number, description : string (create a short description), category : string (select the most appropriate category from the list [${menuCatagories.join(", ")}])`
    );
  };

  return (
    <Link
      target="_blank"
      onClick={handleClick}
      className={`underline text-sm py-2 text-blue-500 hover:text-blue-600 block text-right ${className}`}
      href="https://kimi.moonshot.cn/chat"
    >
      Go to KIMI.ai {"(prompt is copied to clipboard)"} {"->"}
    </Link>
  );
} 