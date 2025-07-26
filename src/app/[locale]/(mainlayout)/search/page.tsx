'use client';

import SearchPage from '@/components/Search';
import BlockStatusChecker from '@/components/BlockStatusChecker';

export default function SearchMainPage() {

    return (
        <>
            <BlockStatusChecker />
            <SearchPage />
        </>
    );
}