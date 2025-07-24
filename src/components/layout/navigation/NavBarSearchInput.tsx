import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { searchAll } from '@/store/slices/searchSlice';
import type { AppDispatch } from '@/store/store';

export function NavBarSearchInput() {
  const [value, setValue] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const trimmed = value.trim();
    if (e.key === "Enter" && trimmed) {
      dispatch(searchAll({ query: trimmed }));
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="transition-all duration-300 ease-in-out hidden sm:block w-[160px] focus:w-[240px] rounded-full"
      />
    </div>
  );
}
