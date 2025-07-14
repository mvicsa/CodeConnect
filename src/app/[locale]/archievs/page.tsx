import React from "react";
import ExampleArchiveCard from "@/components/Archives";

export default function ArchivePage() {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen px-6 py-12 bg-background">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-primary">
                    Welcome to the CodeConnect Archives!
                </h1>
                <p className="text-muted-foreground text-base md:text-lg mb-2">
                    Explore a collection of coding challenges and solutions shared by our community.
                </p>
                <p className="text-muted-foreground text-base md:text-lg">
                    Discover, learn, and contribute to the coding community.
                </p>
            </div>

            <div className="w-full max-w-4xl bg-muted/40 border border-border rounded-2xl shadow-sm p-6">
                <ExampleArchiveCard />
            </div>
        </div>
    );
}
