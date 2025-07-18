
'use client'
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Option 1: Extract props type directly from Badge component
type BadgeProps = React.ComponentProps<typeof Badge>;

// Option 2: Define the variants explicitly (safer if the component changes)
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface BadgeConfig {
    variant?: BadgeVariant;
    className?: string;
}

type ArchiveStatus = "solved" | "unsolved" | "pending";
type DifficultyLevel = "easy" | "medium" | "hard";

interface ArchiveCardProps {
    name: string;
    problem: string;
    date: string;
    status?: ArchiveStatus;
    difficulty?: DifficultyLevel;
    tags?: string[];
    className?: string;
}

export function ArchiveCard({
    name,
    problem,
    date,
    status = "unsolved",
    difficulty,
    tags = [],
    className,
}: ArchiveCardProps) {
    // Status badge configuration
    const getStatusBadgeConfig = (status: ArchiveStatus): BadgeConfig => {
        switch (status) {
            case "solved":
                return {
                    variant: "default",
                    className: "bg-green-500 hover:bg-green-600 text-white",
                };
            case "pending":
                return {
                    variant: "default",
                    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
                };
            default:
                return { variant: "secondary" };
        }
    };

    // Difficulty badge configuration
    const getDifficultyBadgeConfig = (difficulty: DifficultyLevel): BadgeConfig => {
        switch (difficulty) {
            case "easy":
                return {
                    variant: "default",
                    className: "bg-green-500 hover:bg-green-600 text-white",
                };
            case "medium":
                return {
                    variant: "default",
                    className: "bg-yellow-500 hover:bg-yellow-600 text-white",
                };
            case "hard":
                return {
                    variant: "default",
                    className: "bg-red-500 hover:bg-red-600 text-white",
                };
            default:
                return { variant: "default" };
        }
    };

    return (
        <Card className={cn("w-full hover:shadow-md transition-shadow", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://github.com/shadcn.png" alt={name} />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{name}</span>
                </div>

                <div className="flex items-center space-x-2">
                    {status && (
                        <Badge
                            variant={getStatusBadgeConfig(status).variant}
                            className={cn("text-xs", getStatusBadgeConfig(status).className)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {date}
                    </span>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-center flex-1">
                        {problem.split("\n").map((line, i) => (
                            <span key={i}>
                                {line}
                                <br />
                            </span>
                        ))}
                    </p>
                </div>

                {(difficulty || tags.length > 0) && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        {difficulty && (
                            <Badge
                                variant={getDifficultyBadgeConfig(difficulty).variant}
                                className={cn("text-xs", getDifficultyBadgeConfig(difficulty).className)}
                            >
                                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </Badge>
                        )}
                        {tags.map((tag) => (
                            <Badge variant="outline" className="text-xs" key={tag}>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
export default function ExampleArchiveCard() {
    return (
        <div className="p-4">
            <ArchiveCard
                name="John Doe"
                problem="Implement a function to reverse a string."
                date="2023-10-01"
                status="solved"
                difficulty="medium"
                tags={["JavaScript", "String Manipulation"]}
                className="max-w-md mx-auto my-4"
            />
        </div>
    );
}




