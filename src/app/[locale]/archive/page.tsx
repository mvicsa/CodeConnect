
import React from "react";
import Link from "next/link";
import { ArchiveService } from "@/services/archiveAPI";
import { ArchiveCard } from "@/components/Archive";

export default async function ArchivePage() {
    try {
        const items = await ArchiveService.getAllArchiveItems();

        // Debug log to check if items are loaded correctly
        console.log("Loaded archive items:", items?.length || 0);

        if (!items || items.length === 0) {
            return (
                <div className="flex flex-col justify-center items-center min-h-screen px-6 py-12 bg-background">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-primary">
                            No Archives Found
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg">
                            There are no archive items available at the moment.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col justify-center items-center min-h-screen px-6 py-12 bg-background">
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-primary">
                        Welcome to the CodeConnect Archives!
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg mb-2">
                        Explore a collection of coding challenges and solutions shared by our community.
                    </p>
                </div>

                <div className="w-full max-w-4xl space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="mb-5">
                            <Link
                                href={`/archive/${encodeURIComponent(item.id)}`}
                                className="block hover:scale-[1.02] transition-transform duration-200"
                            >
                                <ArchiveCard
                                    name={item.name}
                                    problem={item.problem}
                                    date={item.date}
                                    status={item.status}
                                    difficulty={item.difficulty}
                                    tags={item.tags}
                                />
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error loading archive items:", error);
        return (
            <div className="flex flex-col justify-center items-center min-h-screen px-6 py-12 bg-background">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-destructive">
                        Error Loading Archives
                    </h1>
                    <p className="text-muted-foreground text-base md:text-lg">
                        Something went wrong while loading the archive items. Please try again later.
                    </p>
                </div>
            </div>
        );
    }
}

