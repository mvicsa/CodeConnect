import { MeetingDetailsClient } from "@/components/meeting/MeetingDetailsClient";

export default async function MeetingPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  return <MeetingDetailsClient meetingId={id} />;
}
