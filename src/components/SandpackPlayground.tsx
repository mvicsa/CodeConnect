'use client'
import React, { useState, useEffect } from 'react';
import { SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackPreview } from '@codesandbox/sandpack-react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchSparkById,
  fetchSparksByUser,
  createSpark,
  updateSpark,
  deleteSpark,
  setCurrentSpark,
  rateSpark,
  fetchSparkRatings,
} from '@/store/slices/sparksSlice';
import { useTheme } from "next-themes";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { FilePlus, Save, Trash2 } from 'lucide-react';
import { StarRating, StarRatingDisplay } from './ui/star-rating';
import Link from 'next/link';
import Container from './Container';
import SparkCard, { SparkCardSkeleton } from './SparkCard';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
} from './ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';
import { uploadToImageKit } from '@/lib/imagekitUpload';
import { toast } from 'sonner';

const fileTemplates = {
  js: {
    ext: '.js',
    code: '// JavaScript file\n',
  },
  ts: {
    ext: '.ts',
    code: '// TypeScript file\n',
  },
  css: {
    ext: '.css',
    code: '/* CSS file */\n',
  },
};

function getUniqueFileName(files: Record<string, any>, base: string, ext: string): string {
  let i = 1;
  let name = `/${base}${ext}`;
  while (files[name]) {
    name = `/${base}${i}${ext}`;
    i++;
  }
  return name;
}

function getSparkIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('spark');
}

const defaultFiles = {
  '/App.js': {
    code: `import React from "react";

export default function App() {
  return <h1>Hello, Amazing Spark! ⚡</h1>;
}
`,
    active: true,
  },
  '/index.js': {
    code: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
`,
  },
  '/styles.css': {
    code: `body { font-family: sans-serif; background: #f5f5f5; }`,
  },
};

// Loading Skeleton Component
function PlaygroundSkeleton() {
  return (
    <Container>
      <Card className="w-full mx-auto dark:border-transparent gap-0 py-0">
        <CardHeader className="border-b !p-6">
          <div className='flex justify-between items-center'>
            <div className='flex flex-col space-y-2'>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="border-t pt-6">
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

// Custom Sandpack theme using shadcn variables
const sandpackTheme = {
  colors: {
    surface1: 'var(--background)',
    surface2: 'var(--card)',
    surface3: 'var(--muted)',
    clickable: 'var(--foreground)',
    base: 'var(--foreground)',
    hover: 'var(--muted-foreground)',
    accent: 'var(--primary)',
    disabled: 'var(--muted-foreground)',
    error: 'var(--danger)',
    errorSurface: 'var(--danger)',
    warning: 'var(--warning)',
    warningSurface: 'var(--warning)',
  },
};

function SandpackEditorAndPreview({ siteTheme, activeFile, setActiveFile }: { siteTheme: string; activeFile: string; setActiveFile: (file: string) => void }) {
  const { sandpack } = useSandpack();
  // Update active file when tab is clicked
  useEffect(() => {
    if (sandpack.activeFile !== activeFile) {
      setActiveFile(sandpack.activeFile);
    }
  }, [sandpack.activeFile, activeFile, setActiveFile]);
  return (
    <SandpackLayout>
      <SandpackCodeEditor showTabs showLineNumbers wrapContent closableTabs />
      <SandpackPreview />
    </SandpackLayout>
  );
}

interface SaveButtonProps {
  sparkId: string | null;
  title: string;
  dispatch: any;
  setSparkId: (id: string) => void;
  setSaveMsg: (msg: string | null) => void;
  setSaving: (saving: boolean) => void;
  saving: boolean;
  setFiles: (files: Record<string, any>) => void;
}

function SaveButton({ sparkId, title, dispatch, setSparkId, setSaveMsg, setSaving, saving, previewImage, setFiles }: SaveButtonProps & { previewImage: string | null }) {
  const { sandpack } = useSandpack();
  const router = useRouter();
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      let action;
      if (sparkId) {
        action = await dispatch(updateSpark({ id: sparkId, files: sandpack.files, title, previewImage: previewImage || undefined }));
      } else {
        action = await dispatch(createSpark({ files: sandpack.files, title, previewImage: previewImage || undefined }));
      }
      if (action.meta.requestStatus === 'fulfilled') {
        const data = action.payload;
        if (data && data._id) {
          setSparkId(data._id);
          setSaveMsg('Saved!');
          dispatch(setCurrentSpark(data));
          if (data.files) setFiles(data.files); // <-- Update files state
          router.push(`/sparks/${data._id}`);
        } else {
          setSaveMsg('Failed to save.');
          toast.error('Failed to save spark. Please try again.');
        }
      } else {
        setSaveMsg('Failed to save.');
        toast.error('Failed to save spark. Please try again.');
      }
    } catch (err) {
      setSaveMsg('Error saving.');
      toast.error('Error saving spark.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2000);
    }
  };
  return (
    <Button variant="default" onClick={handleSave} disabled={saving} className='gap-2 cursor-pointer'>
      <Save className='w-4 h-4' />
      {saving ? 'Saving...' : 'Save'}
    </Button>
  );
}

function SparkRating({ sparkId, sparkUserId }: { sparkId: string, sparkUserId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const ratings = useSelector((state: RootState) => state.sparks.ratings[sparkId]);
  const user = useSelector((state: RootState) => state.auth.user);
  // Simplified userRating logic - prioritize userRating from Redux state
  const userRating = ratings?.userRating || 0;
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSparkRatings(sparkId));
  }, [dispatch, sparkId]);

  const handleRate = async (value: number) => {
    setSubmitting(true);
    try {
      await dispatch(rateSpark({ id: sparkId, value }));
      // Refresh ratings after successful rating to get updated average
      await dispatch(fetchSparkRatings(sparkId));
    } catch (error) {
      console.error('Failed to rate spark:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isOwner = user?._id === sparkUserId;
  const canRate = !!user && !isOwner;

  if (isOwner) return null;

  return (
    <div className="mt-4">
      <StarRating
        value={userRating}
        interactive={canRate}
        loading={submitting}
        disabled={!canRate}
        onRate={handleRate}
        showUserRating={canRate && userRating > 0}
        className="justify-start"
      />
    </div>
  );
}

export default function SandpackPlayground() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { sparks, currentSpark, loading, ratings, userSparksLoading } = useSelector((state: RootState) => state.sparks);
  const userId = useSelector((state: RootState) => state.auth.user?._id) || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);

  const { theme: siteTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  const [files, setFiles] = useState<Record<string, any>>(defaultFiles);
  const [activeFile, setActiveFile] = useState<string>('/App.js');
  const [sparkId, setSparkId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('Untitled Spark');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [newFileType, setNewFileType] = useState<'js' | 'ts' | 'css'>('js');
  const [newFileName, setNewFileName] = useState('file');
  const [addFileDialogOpen, setAddFileDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sparkNotFound, setSparkNotFound] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(currentSpark?.previewImage || null);
  const [previewImageUploading, setPreviewImageUploading] = useState(false);
  const previewImageInputRef = React.useRef<HTMLInputElement>(null);

  // Load spark by ID from URL
  useEffect(() => {
    const urlSparkId = getSparkIdFromUrl();
    if (urlSparkId) {
      setSparkId(urlSparkId);
      setPageLoading(true);
      dispatch(fetchSparkById(urlSparkId)).then((action: any) => {
        if (action.payload && action.payload.files) {
          setFiles(action.payload.files);
          setTitle(action.payload.title || 'Untitled Spark');
          dispatch(setCurrentSpark(action.payload));
          setSparkNotFound(false);
        } else {
          setSparkNotFound(true);
          toast.error('Spark not found or failed to load from the database.');
        }
        setPageLoading(false);
      }).catch((error: any) => {
        setSparkNotFound(true);
        toast.error('Error loading spark from the database.');
        setPageLoading(false);
      });
    } else {
      setPageLoading(false);
      setPreviewImage(null); // Ensure previewImage is null when entering the page with no spark
    }
  }, [dispatch]);

  // Function to reset to new spark state
  const resetToNewSpark = () => {
    setSparkId(null);
    setFiles(defaultFiles);
    setTitle('Untitled Spark');
    setPreviewImage(null); // <-- Reset preview image
    dispatch(setCurrentSpark(null));
    setSparkNotFound(false);
    setPageLoading(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('spark');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Fetch user's sparks when user is available
  useEffect(() => {
    if (userId && typeof userId === 'string') {
      dispatch(fetchSparksByUser({ userId, page: 1, limit: 10 }));
    }
  }, [dispatch, userId]);

  // Sync local state with Redux currentSpark when it changes
  useEffect(() => {
    if (currentSpark && currentSpark._id === sparkId) {
      setFiles(currentSpark.files);
      setTitle(currentSpark.title || 'Untitled Spark');
      setPreviewImage(currentSpark.previewImage || null);
    }
  }, [currentSpark, sparkId]);

  // Add new file
  const handleAddCustomFile = () => {
    const template = fileTemplates[newFileType];
    const base = newFileName.trim() || 'file';
    const ext = template.ext;
    const newFile = getUniqueFileName(files, base, ext);
    setFiles({
      ...files,
      [newFile]: { code: template.code },
    });
    setActiveFile(newFile);
  };

  // Ensure activeFile is always valid
  useEffect(() => {
    if (!files[activeFile]) {
      setActiveFile(Object.keys(files)[0] || '/App.js');
    }
  }, [files, activeFile]);

  // Add preview image upload logic
  const handlePreviewImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPreviewImageUploading(true);
      try {
        const url = await uploadToImageKit(file, '/sparks/previews');
        setPreviewImage(url);
      } catch (error) {
        alert('Failed to upload preview image.');
        console.error(error);
      } finally {
        setPreviewImageUploading(false);
      }
    }
  };
  const handleRemovePreviewImage = () => setPreviewImage(null);

  // Delete a spark with confirmation and redirect
  const handleDeleteSpark = async () => {
    if (!currentSpark) return;
    
    try {
      await dispatch(deleteSpark(currentSpark._id));
      setDeleteDialogOpen(false);
      // Do not redirect, just show toast
      toast.success('Spark deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete spark from the database.');
    }
  };

  // Filter out current spark from the list
  const otherSparks = sparks.filter(spark => !!spark._id && spark._id !== sparkId);

  // Compute owner protection
  const isNotOwner = Boolean(
    sparkId && currentSpark && currentSpark.owner && userId && currentSpark.owner._id !== userId
  );

  // Show skeleton while page is loading
  if (pageLoading) {
    return <PlaygroundSkeleton />;
  }

  // Show error message if spark not found
  if (sparkNotFound) {
    // Just show toast, do not redirect or show card
    return null;
  }

  return (
    isNotOwner ? (
      <Container>
        <Card className="w-full max-w-lg mx-auto mt-20">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center">You do not have permission to access or edit this spark.</p>
          </CardContent>
        </Card>
      </Container>
    ) : (
      <Container>
        <Card className="w-full mx-auto dark:border-transparent gap-0 py-0">
          <CardHeader className="border-b !p-6">
            <div className='flex justify-between items-center'>
                <div className='flex flex-col'>
                    <CardTitle>
                        <h2 className='text-2xl font-bold'>
                            { title }
                        </h2>
                        {currentSpark?.owner?.username && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            Created by 
                            <Link href={`/user/${currentSpark?.owner?.username}`} className='text-primary hover:underline'>
                                {currentSpark?.owner?.username}
                            </Link>
                        </div>
                        )}
                    </CardTitle>
                </div>
                {/* Rating display */}
                {sparkId && ratings && ratings[sparkId] && (
                    <StarRatingDisplay
                        averageRating={ratings[sparkId].average || 0}
                        ratingsCount={ratings[sparkId].ratings?.length || 0}
                    />
                )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {
              userId && (
                <>
                  <div className="flex flex-wrap gap-2 items-center">
                      <Dialog open={addFileDialogOpen} onOpenChange={setAddFileDialogOpen}>
                          <DialogTrigger asChild>
                          <Button variant="outline" className='cursor-pointer'>
                              <FilePlus />
                              Add File
                          </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xs w-full">
                          <DialogHeader>
                              <DialogTitle>Add New File</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-4 mt-2">
                              <Select value={newFileType} onValueChange={v => setNewFileType(v as 'js' | 'ts' | 'css')}>
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="js">JavaScript</SelectItem>
                                  <SelectItem value="ts">TypeScript</SelectItem>
                                  <SelectItem value="css">CSS</SelectItem>
                              </SelectContent>
                              </Select>
                              <Input
                              className="w-full"
                              value={newFileName}
                              onChange={e => setNewFileName(e.target.value)}
                              placeholder="File name"
                              type="text"
                              maxLength={24}
                              />
                              <Button size="sm" variant="default" onClick={() => { handleAddCustomFile(); setAddFileDialogOpen(false); }}>
                              Add File
                              </Button>
                          </div>
                          </DialogContent>
                      </Dialog>
                      <Input
                          className="w-48"
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          placeholder="Spark title"
                      />
                      {saveMsg && <span className="ml-2 text-xs text-primary font-semibold">{saveMsg}</span>}
                  </div>
                  <div className="flex flex-col gap-4 w-full max-w-xs">
                    <label className="text-sm font-medium text-muted-foreground">Preview Image</label>
                    <div className="relative group">
                      <input
                        ref={previewImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePreviewImageChange}
                      />
                      <div
                        className={
                          `border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 transition-colors cursor-pointer ${previewImage ? 'border-primary/60 bg-accent/40' : 'border-muted-foreground/25 bg-accent/10'} hover:border-primary/80`
                        }
                        onClick={() => !previewImageUploading && previewImageInputRef.current?.click()}
                        style={{ minHeight: 120 }}
                      >
                        {previewImageUploading ? (
                          <Skeleton className="h-24 w-24 rounded-lg" />
                        ) : previewImage ? (
                          <div className="relative w-full flex flex-col items-center">
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="h-32 w-full object-cover rounded-lg shadow-md border border-primary/30 group-hover:opacity-80 transition-opacity"
                              style={{ maxWidth: 240 }}
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={e => { e.stopPropagation(); handleRemovePreviewImage(); }}
                              className="absolute top-2 right-2 opacity-90 hover:opacity-100"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-muted-foreground text-xs mb-2">Click or drag to upload</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={e => { e.stopPropagation(); previewImageInputRef.current?.click(); }}
                            >
                              Upload Preview Image
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )
            }
            <div>
            {mounted && (
              <div className={`sandpack-theme-container ${(siteTheme ?? 'light') === 'dark' ? 'sandpack-dark' : 'sandpack-light'}`}>
                <SandpackProvider
                  template="react"
                  theme={(siteTheme ?? 'light') === 'dark' ? 'dark' : 'light'}
                  files={files}
                >
                  <SandpackEditorAndPreview siteTheme={siteTheme ?? 'light'} activeFile={activeFile} setActiveFile={setActiveFile} />
                  {sparkId && (
                    <SparkRating sparkId={sparkId} sparkUserId={currentSpark?.owner?._id || currentSpark?.userId || ''} />
                  )}
                  <div className="flex items-center gap-2 border-t -mx-6 mt-6 pt-6 px-6">
                    <SaveButton
                      sparkId={sparkId}
                      title={title}
                      dispatch={dispatch}
                      setSparkId={setSparkId}
                      setSaveMsg={setSaveMsg}
                      setSaving={setSaving}
                      saving={saving}
                      previewImage={previewImage}
                      setFiles={setFiles}
                    />
                    {sparkId && currentSpark && userId === (currentSpark as any)?.owner?._id && (
                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className='cursor-pointer'>
                              <Trash2 className='w-4 h-4' />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Spark</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteSpark}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                  </div>
                </SandpackProvider>
              </div>
            )}
            </div>
          </CardContent>
        </Card>
      </Container>
    )
  );
} 