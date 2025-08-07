'use client'

import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { createPost, updatePost } from '@/store/slices/postsSlice'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { 
  Code, 
  Image as ImageIcon, 
  Video, 
  X, 
  Send, 
  Hash,
  Plus,
  ArrowLeft,
  Save,
  Loader2
} from 'lucide-react'
import CodeEditor from '../code/CodeEditor'
import UserAvatar from '../UserAvatar'
import { PostType } from '@/types/post'
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import Image from 'next/image'
import { uploadToImageKit } from '@/lib/imagekitUpload';
import EmojiMenu from '@/components/ui/emoji-menu';
import { getAuthToken } from '@/lib/cookies';

interface PostFormProps {
  mode: 'create' | 'edit'
  post?: PostType // Only required for edit mode
  onCancel: () => void
  onSuccess: (postData?: { code?: string }) => void
  className?: string
}

type PostContent = {
  text: string
  code?: {
    code: string
    language: string
  }
  image?: File | string
  video?: File | string
  tags: string[]
}

export default function PostForm({ mode, post, onCancel, onSuccess, className = '' }: PostFormProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const t = useTranslations()
  
  const [content, setContent] = useState<PostContent>({
    text: post?.text || '',
    code: post?.code ? { code: post.code, language: post.codeLang || 'javascript' } : undefined,
    image: post?.image,
    video: post?.video,
    tags: post?.tags || []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCodeEditor, setShowCodeEditor] = useState(!!post?.code)
  const [showImageUpload, setShowImageUpload] = useState(!!post?.image)
  const [showVideoUpload, setShowVideoUpload] = useState(!!post?.video)
  const [tagInput, setTagInput] = useState('')
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [imageUploadPercent, setImageUploadPercent] = useState(0);
  const [videoUploadPercent, setVideoUploadPercent] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Reset form when post changes (for edit mode)
  useEffect(() => {
    if (post) {
      setContent({
        text: post.text || '',
        code: post.code ? { code: post.code, language: post.codeLang || 'javascript' } : undefined,
        image: post.image,
        video: post.video,
        tags: post.tags || []
      })
      setShowCodeEditor(!!post.code)
      setShowImageUpload(!!post.image)
      setShowVideoUpload(!!post.video)
    }
  }, [post])

  const handleTextChange = (text: string) => {
    setContent(prev => ({ ...prev, text }))
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => ({ ...prev, text: prev.text + emoji }))
  }

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAddCode = () => {
    setShowCodeEditor(true)
    setShowImageUpload(false)
    setShowVideoUpload(false)
    setContent(prev => ({
      ...prev,
      code: { code: '', language: 'javascript' },
      image: "",
      video: ""
    }))
  }

  const handleRemoveCode = () => {
    setShowCodeEditor(false)
    // Set code to empty code object instead of undefined to ensure backend recognizes it as removed
    setContent(prev => ({ ...prev, code: { code: "", language: "javascript" } }))
  }

  const handleCodeChange = (code: string) => {
    setContent(prev => ({
      ...prev,
      code: { code, language: prev.code?.language || 'javascript' }
    }))
  }

  const handleLanguageChange = (language: string) => {
    setContent(prev => ({
      ...prev,
      code: prev.code ? { ...prev.code, language } : { code: '', language }
    }))
  }

  const handleAddImage = () => {
    setShowImageUpload(true)
    setShowCodeEditor(false)
    setShowVideoUpload(false)
    // Clear other content types when adding image
    setContent(prev => ({
      ...prev,
      code: { code: "", language: "javascript" },
      video: ""
    }))
    fileInputRef.current?.click()
  }

  const handleRemoveImage = () => {
    setShowImageUpload(false)
    // Set to empty string instead of undefined to ensure backend recognizes it as removed
    setContent(prev => ({ ...prev, image: "" }))
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, etc.)');
      return;
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`Image file size must be less than 5MB (current: ${formatFileSize(file.size)})`);
      return;
    }
    
    setImageUploading(true);
    setImageUploadPercent(0);
    try {
      toast.info('Uploading image...');
      const url = await uploadToImageKit(file, '/posts', (percent) => setImageUploadPercent(percent));
      setContent(prev => ({ ...prev, image: url }));
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Failed to upload image => ' + error);
    }
    setImageUploading(false);
    setShowImageUpload(true);
  };

  const handleAddVideo = () => {
    setShowVideoUpload(true)
    setShowCodeEditor(false)
    setShowImageUpload(false)
    // Clear other content types when adding video
    setContent(prev => ({
      ...prev,
      code: { code: "", language: "javascript" },
      image: ""
    }))
    videoInputRef.current?.click()
  }

  const handleRemoveVideo = () => {
    setShowVideoUpload(false)
    // Set to empty string instead of undefined to ensure backend recognizes it as removed
    setContent(prev => ({ ...prev, video: "" }))
  }

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file (MP4, AVI, MOV, etc.)');
      return;
    }
    
    // Check file size (max 20MB for videos)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error(`Video file size must be less than 20MB (current: ${formatFileSize(file.size)})`);
      return;
    }
    
    // Check video duration (max 1 minute)
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const checkVideoDuration = (): Promise<boolean> => {
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const durationInSeconds = video.duration;
          const maxDuration = 60; // 1 minute
          
          if (durationInSeconds > maxDuration) {
            toast.error(`Video duration must be less than 1 minute (current: ${formatDuration(durationInSeconds)})`);
            resolve(false);
          } else {
            resolve(true);
          }
        };
        
        video.onerror = () => {
          toast.error('Could not read video duration. Please try another video file.');
          resolve(false);
        };
        
        video.src = URL.createObjectURL(file);
      });
    };
    
    const isDurationValid = await checkVideoDuration();
    if (!isDurationValid) {
      return;
    }
    
    setVideoUploading(true);
    setVideoUploadPercent(0);
    try {
      toast.info('Uploading video...');
      const url = await uploadToImageKit(file, '/posts', (percent) => setVideoUploadPercent(percent));
      setContent(prev => ({ ...prev, video: url }));
      toast.success('Video uploaded!');
    } catch (error) {
      toast.error('Failed to upload video => ' + error);
    }
    setVideoUploading(false);
    setShowVideoUpload(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim().length > 15) {
      toast.error('Tag cannot be more than 15 characters.');
      return;
    }
    if (tagInput.trim() && !content.tags.includes(tagInput.trim())) {
      setContent(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setContent(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleSubmit = async () => {
    if (!content.text.trim() && !content.code?.code.trim() && !content.image && !content.video) {
      return
    }

    if (tagInput.trim() && !content.tags.includes(tagInput.trim())) {
      toast.error('You have a tag typed but not added. Please add it or clear the input.');
      return;
    }

    setIsSubmitting(true)
    try {
      // Images and videos are already converted to base64 at upload time
      // Just use the content values directly or empty strings
      const imageUrl = typeof content.image === 'string' ? content.image : ""
      const videoUrl = typeof content.video === 'string' ? content.video : ""

      if (mode === 'create') {
        const newPost: Omit<PostType, '_id' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
          text: content.text.trim(),
          code: content.code?.code ? content.code.code.trim() : "",
          codeLang: content.code?.language || "",
          image: imageUrl,
          video: videoUrl,
          tags: content.tags,
          reactions: { like: 0, love: 0, wow: 0, funny: 0, dislike: 0, happy: 0 },
          userReactions: []
        }

        await dispatch(createPost({ postData: newPost, token: getAuthToken() || '' })).unwrap();
        toast.success('Post created successfully!');
        
        // Reset form for create mode
        setContent({
          text: '',
          tags: []
        })
        setShowCodeEditor(false)
        setShowImageUpload(false)
        setShowVideoUpload(false)
        setTagInput('')
        
        // Pass post data to onSuccess for AI suggestions
        onSuccess({ code: newPost.code })
      } else {
        // Edit mode
        if (!post) return

        const updatedPost: Partial<PostType> = {
          text: content.text.trim(),
          code: content.code?.code ? content.code.code.trim() : "",
          codeLang: content.code?.language || "",
          image: imageUrl,
          video: videoUrl,
          tags: content.tags,
          updatedAt: new Date().toISOString(),
          createdBy: post.createdBy
        }

        await dispatch(updatePost({ id: post._id, data: updatedPost, token: getAuthToken() || '' })).unwrap();
        toast.success('Post updated successfully!');
      }
      
      onSuccess()
    } catch (error) {
      const message = (error && typeof error === 'object' && 'message' in error)
        ? (error as Error).message
        : String(error);
      toast.error(`Failed to ${mode} post. ${message}`);
    } finally {
      setIsSubmitting(false)
    }
  }

  // File to base64 conversion is now done at upload time

  const hasContent = content.text.trim() || content.code?.code.trim() || content.image || content.video

  const isEditMode = mode === 'edit'
  const submitButtonText = isSubmitting 
    ? (isEditMode ? 'Saving...' : 'Creating...') 
    : (isEditMode ? 'Save Changes' : 'Create Post')
  const SubmitButtonIcon = isEditMode ? Save : Send

  return (
    <Card className={`w-full dark:border-none shadow-none gap-4 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserAvatar src={isEditMode ? post?.createdBy?.avatar as string : user?.avatar as string} firstName={isEditMode ? post?.createdBy?.firstName as string : user?.firstName as string} />
          <div className="flex-1">
            <h3 className="font-semibold">{isEditMode ? 'Edit Post' : 'Create Post'}</h3>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? 'Update your post content' : 'Share your thoughts, code, or media'}
            </p>
          </div>
          {isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Text Input */}
        <div className="relative">
          <Textarea
            value={content.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="What's on your mind?"
            className="resize-none min-h-[100px] max-h-[200px] pr-10"
            autoComplete='off'
          />
          <div className="absolute bottom-2 right-2">
            <EmojiMenu
              onEmojiSelect={handleEmojiSelect}
              position="top"
              align="end"
            />
          </div>
        </div>

        {/* Content Type Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCode}
            className={`flex items-center gap-2 ${showCodeEditor ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Code className="size-4" />
            Code
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddImage}
            className={`flex items-center gap-2 ${showImageUpload ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <ImageIcon className="size-4" />
            Image
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddVideo}
            className={`flex items-center gap-2 ${showVideoUpload ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Video className="size-4" />
            Video
          </Button>
        </div>

        {/* Code Editor */}
        {showCodeEditor && (
          <div className="border rounded-lg p-4 dark:bg-accent">
            <CodeEditor
              value={content.code?.code || ''}
              onChange={handleCodeChange}
              language={content.code?.language || 'javascript'}
              onLanguageChange={handleLanguageChange}
              onRemove={handleRemoveCode}
            />
          </div>
        )}

        {/* Image Upload */}
        {showImageUpload && (
          <div className="border rounded-lg p-4 dark:bg-accent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium flex items-center gap-2">
                  <ImageIcon className="size-4" />
                  Image
                </h4>
                <span className="text-xs text-muted-foreground">(Max 5MB)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>
            {imageUploading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative flex items-center justify-center h-24 w-24">
                  <Loader2 className="animate-spin text-primary h-14 w-14" />
                  <span className="absolute text-sm font-semibold text-primary">
                    {imageUploadPercent}%
                  </span>
                </div>
                <span className="mt-2 text-sm text-muted-foreground">Uploading image...</span>
              </div>
            ) : content.image ? (
              <div className="space-y-3">
                <Image
                  src={content.image instanceof File ? URL.createObjectURL(content.image) : content.image}
                  alt="Preview"
                  className="max-w-full max-h-64 rounded-lg object-cover"
                  width={400}
                  height={256}
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <ImageIcon className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select an image</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  Select Image
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        )}

        {/* Video Upload */}
        {(showVideoUpload || content.video) && (
          <div className="border rounded-lg p-4 dark:bg-accent">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Video className="size-4" />
                  Video
                </h4>
                <span className="text-xs text-muted-foreground">Max 20MB (1 minute)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveVideo}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <X className="size-4" />
              </Button>
            </div>
            {videoUploading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative flex items-center justify-center h-24 w-24">
                  <Loader2 className="animate-spin text-primary h-16 w-16" />
                  <span className="absolute text-lg font-semibold text-primary">{videoUploadPercent}%</span>
                </div>
                <span className="mt-2 text-sm text-muted-foreground">Uploading video...</span>
              </div>
            ) : content.video ? (
              <div className="space-y-3">
                <video
                  src={content.video instanceof File ? URL.createObjectURL(content.video) : content.video}
                  controls
                  className="max-w-full max-h-64 rounded-lg"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Video className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select a video</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum: 20MB (1 minute)</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  className="mt-2"
                >
                  Select Video
                </Button>
              </div>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('tags.tags')}</span>
          </div>
          {content.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {content.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemoveTag(tag)}
                >
                  #{tag}
                  <X className="size-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('tags.addTag')}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          {isEditMode && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!hasContent || isSubmitting}
            className="flex items-center gap-2"
          >
            <SubmitButtonIcon className="size-4" />
            {submitButtonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 