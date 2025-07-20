import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Container from '@/components/Container';
import { Card } from '@/components/ui/card';
import SinglePostClient from '@/components/post/SinglePostClient';

type Props = {
  params: {
    id: string;
    locale: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // You can fetch the post data here to generate dynamic metadata
  // For now, using a generic title
  const t = await getTranslations('PostPage');
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PostPage({ params }: Props) {
  // Await the params to ensure they are properly resolved
  const { id } = await Promise.resolve(params);
  
  return (
    <div className="max-w-3xl mx-auto">
        <SinglePostClient postId={id} />
    </div>
  );
} 