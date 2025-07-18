import { SearchResult } from '@/types/search';

export const SearchAPI = {
    mockResults: <SearchResult[]>[
        {
            id: 1,
            title: "Advanced React Patterns and Best Practices",
            description: "Comprehensive guide covering advanced React patterns including render props, higher-order components, and custom hooks for building scalable applications.",
            category: "Tutorial",
            author: "Sarah Johnson",
            date: "2024-01-15",
            rating: 4.8,
            readTime: "12 min read",
            content: "This comprehensive tutorial covers advanced React patterns that will help you build more maintainable and scalable applications. We'll explore render props, higher-order components, custom hooks, and the compound component pattern. Each pattern includes practical examples and real-world use cases to help you understand when and how to apply them effectively."
        },
        {
            id: 2,
            title: "Modern CSS Grid Layout Techniques",
            description: "Learn how to create responsive layouts using CSS Grid with practical examples and real-world use cases for modern web development.",
            category: "Article",
            author: "Michael Chen",
            date: "2024-01-10",
            rating: 4.6,
            readTime: "8 min read",
            content: "CSS Grid has revolutionized the way we create layouts on the web. This article provides a deep dive into modern CSS Grid techniques, including implicit and explicit grids, grid areas, and responsive design patterns. You'll learn how to create complex layouts with minimal code and maximum flexibility."
        },
        {
            id: 3,
            title: "JavaScript Performance Optimization Guide",
            description: "Deep dive into JavaScript performance optimization techniques including code splitting, lazy loading, and memory management strategies.",
            category: "Guide",
            author: "Emma Davis",
            date: "2024-01-08",
            rating: 4.9,
            readTime: "15 min read",
            content: "Performance is crucial for modern web applications. This guide covers essential JavaScript performance optimization techniques including code splitting, lazy loading, tree shaking, and memory management. Learn how to identify performance bottlenecks and implement solutions that will make your applications faster and more efficient."
        },
        {
            id: 4,
            title: "Building Accessible Web Applications",
            description: "Complete guide to web accessibility covering WCAG guidelines, semantic HTML, ARIA attributes, and testing strategies for inclusive design.",
            category: "Tutorial",
            author: "David Wilson",
            date: "2024-01-05",
            rating: 4.7,
            readTime: "10 min read",
            content: "Web accessibility is not just a legal requirement—it's a moral imperative. This tutorial covers the fundamentals of building accessible web applications, including WCAG guidelines, semantic HTML, ARIA attributes, and testing strategies. Learn how to create inclusive experiences that work for everyone."
        },
        {
            id: 5,
            title: "Next.js 14 App Router Deep Dive",
            description: "Explore the latest features of Next.js 14 App Router including server components, streaming, and advanced routing patterns.",
            category: "Article",
            author: "Lisa Zhang",
            date: "2024-01-03",
            rating: 4.8,
            readTime: "18 min read",
            content: "Next.js 14 introduces powerful new features with the App Router. This article explores server components, streaming, advanced routing patterns, and the new file-based routing system. Learn how to leverage these features to build faster, more efficient React applications with better SEO and user experience."
        },
        {
            id: 6,
            title: "TypeScript Advanced Types Masterclass",
            description: "Master advanced TypeScript features including conditional types, mapped types, and utility types for type-safe development.",
            category: "Guide",
            author: "Alex Rodriguez",
            date: "2024-01-01",
            rating: 4.9,
            readTime: "20 min read",
            content: "TypeScript's advanced type system is incredibly powerful when used correctly. This masterclass covers conditional types, mapped types, utility types, and advanced type manipulation techniques. Learn how to create type-safe APIs and build robust applications with TypeScript's most advanced features."
        }
    ]
};