'use client';

import { useRouter } from 'next/navigation';
import SearchPage from '@/components/Search';

export default function SearchMainPage() {
    const router = useRouter();

    const handleResultClick = (id: number) => {
        router.push(`/search/${id}`);
    };

    return <SearchPage onResultClick={handleResultClick} />;
}