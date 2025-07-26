import ArchiveDetail from '@/components/ArchiveDetail';

export default async function ArchiveItemPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  return <ArchiveDetail id={id} />;
}