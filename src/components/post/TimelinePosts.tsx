import PostsContainer from './PostsContainer'

interface TimelinePostsProps {
  type?: string
  limit?: number
  title?: string
}

export default function TimelinePosts(props: TimelinePostsProps) {
  return <PostsContainer {...props} />
}
