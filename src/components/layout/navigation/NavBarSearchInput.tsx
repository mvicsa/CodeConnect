import { Input } from "@/components/ui/input";

export function NavBarSearchInput() {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      console.log("Searching for:", e.currentTarget.value);
      // Add  search logic here
    }
  }

  return (
    <Input
      type="text"
      placeholder="#Search"
      onKeyDown={handleKeyDown}
      className="hidden sm:block w-[160px] md:w-[200px] h-[35px] text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
