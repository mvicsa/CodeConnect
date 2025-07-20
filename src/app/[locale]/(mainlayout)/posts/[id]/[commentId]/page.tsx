import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import SinglePostWithHighlightedComment from '@/components/post/SinglePostWithHighlightedComment';

type Props = {
  params: {
    id: string;
    commentId: string;
    locale: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('PostPage');
  
  return {
    title: t('commentTitle'),
    description: t('commentDescription'),
  };
}

export default async function PostWithCommentPage({ params }: Props) {
  // Await the params to ensure they are properly resolved
  const { id, commentId } = await Promise.resolve(params);
  
  // We pass the same ID as both highlightedCommentId and highlightedReplyId
  // The component will determine which one it is
  return (
    <div className="max-w-3xl mx-auto">
      <SinglePostWithHighlightedComment 
        postId={id} 
        highlightedCommentId={commentId}
        highlightedReplyId={commentId}
      />
    </div>
  );
}
