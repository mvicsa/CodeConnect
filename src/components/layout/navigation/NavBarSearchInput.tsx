import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"
export function NavBarSearchInput() {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      console.log("Searching for:", e.currentTarget.value);
      // Add  search logic here
    }
  }
  
  return (
<div className="relative">
  <Input
    type="text"
    placeholder="Search"
    onKeyDown={handleKeyDown}
    className="transition-all duration-300 ease-in-out hidden sm:block w-[160px] focus:w-[240px] rounded-full"
  />
</div>

  );
}
