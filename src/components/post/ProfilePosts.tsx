import PostsContainer from './PostsContainer'

interface ProfilePostsProps {
  userId?: string
  limit?: number
  title?: string
}

export default function ProfilePosts(props: ProfilePostsProps) {
  return <PostsContainer {...props} />
}
