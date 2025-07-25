import ArchiveDetail from '@/components/ArchiveDetail';

interface ArchiveItemPageProps {
  params: {
    id: string;
  };
}

export default function ArchiveItemPage({ params }: ArchiveItemPageProps) {
  const { id } = params;
  return <ArchiveDetail id={id} />;
}