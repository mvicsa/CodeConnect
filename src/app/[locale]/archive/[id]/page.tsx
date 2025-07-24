import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArchiveService } from "@/services/archiveAPI";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';
import { ArchiveItem } from '@/types/archive';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag, Lightbulb, Code } from 'lucide-react';

export const dynamicParams = true;
export const revalidate = 60;

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export async function generateStaticParams() {
    try {
        const ids = await ArchiveService.getAllArchiveIds();
        console.log('[DEBUG] Generating static params for IDs:', ids);
        return ids.map((id) => ({ id }));
    } catch (error) {
        console.error('[ERROR] Failed to generate static params:', error);
        return [];
    }
}

const getStatusBadgeConfig = (status: ArchiveItem['status']): { variant: BadgeVariant; className: string } => {
    switch (status) {
        case "solved":
            return { variant: "default", className: "bg-green-500 text-white" };
        case "pending":
            return { variant: "secondary", className: "bg-yellow-500 text-white" };
        default:
            return { variant: "secondary", className: "" };
    }
};

const getDifficultyBadgeConfig = (difficulty: ArchiveItem['difficulty']): { variant: BadgeVariant; className: string } => {
    return {
        variant: "default",
        className: difficulty === "easy" ? "bg-green-500" :
            difficulty === "medium" ? "bg-yellow-500" : "bg-red-500"
    };
};

export default async function ArchiveDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id, locale } = await params;
    console.log(id, locale);
    console.log('[DEBUG] Rendering page for ID:', id);
    const item = await ArchiveService.getArchiveItemById(id);

    if (!item) {
        console.error('[ERROR] Item not found for ID:', id);
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">

                    <Link href="/archives">
                        <Button variant="ghost">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Archives
                        </Button>
                    </Link>

                    <h1 className="text-3xl font-extrabold tracking-tight mt-4">
                        Problem Details
                    </h1>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar>
                                            <AvatarImage src="https://github.com/shadcn.png" />
                                            <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{item.name}</h3>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {item.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Badge
                                            variant={getStatusBadgeConfig(item.status).variant}
                                            className={getStatusBadgeConfig(item.status).className}
                                        >
                                            {item.status}
                                        </Badge>
                                        <Badge
                                            variant={getDifficultyBadgeConfig(item.difficulty).variant}
                                            className={getDifficultyBadgeConfig(item.difficulty).className}
                                        >
                                            {item.difficulty}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <h2 className="text-xl font-semibold mb-3">{item.problem}</h2>
                                {item.description && (
                                    <p className="text-muted-foreground mb-4">{item.description}</p>
                                )}
                                {item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {item.tags.map((tag) => (
                                            <Badge variant="outline" key={tag}>
                                                <Tag className="h-3 w-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {item.solution && (
                            <Card>
                                <CardHeader>
                                    <h3 className="flex items-center">
                                        <Code className="h-5 w-5 mr-2" />
                                        Solution
                                    </h3>
                                </CardHeader>
                                <CardContent>
                                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                                        <code>{item.solution}</code>
                                    </pre>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="space-y-6">
                        {item.hints && item.hints.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <h3 className="flex items-center">
                                        <Lightbulb className="h-5 w-5 mr-2" />
                                        Hints
                                    </h3>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {item.hints.map((hint, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <div className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs mt-0.5">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm">{hint}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}