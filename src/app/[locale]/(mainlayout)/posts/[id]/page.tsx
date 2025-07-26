import { getTranslations } from 'next-intl/server';
import SinglePostClient from '@/components/post/SinglePostClient';
import BlockStatusChecker from '@/components/BlockStatusChecker';


export async function generateMetadata({ params }: { params: Promise<{ id: string; locale: string }> }) {
  // You can fetch the post data here to generate dynamic metadata
  // For now, using a generic title
  const { id, locale } = await params;
  console.log(id, locale);
  const t = await getTranslations('PostPage');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  // Await the params to ensure they are properly resolved
  const { id, locale } = await params;
  console.log(id, locale);
  
  return (
    <div className="max-w-3xl mx-auto">
        <BlockStatusChecker />
        <SinglePostClient postId={id} />
    </div>
  );
} 