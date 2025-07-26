// import { getTranslations } from 'next-intl/server';
import SinglePostWithHighlightedComment from '@/components/post/SinglePostWithHighlightedComment';

// export async function generateMetadata({ params }: Props) {
//   const { id, commentId } = params;
//   const t = await getTranslations('PostPage');
//   console.log(id, commentId);
//   return {
//     title: t('commentTitle'),
//     description: t('commentDescription'),
//   };
// }

export default async function PostWithCommentPage({ params }: { params: Promise<{ id: string; commentId: string; locale: string }> }) {
  // Await the params to ensure they are properly resolved
  const { id, commentId, locale } = await params;
  console.log(id, commentId, locale);
  
  // We pass the same ID as both highlightedCommentId and highlightedReplyId
  // The component will determine which one it is
  return (
    <div className="max-w-3xl mx-auto px-5">
      <SinglePostWithHighlightedComment 
        postId={id} 
        highlightedCommentId={commentId}
        highlightedReplyId={commentId}
      />
    </div>
  );
}
