import { getTranslations } from "next-intl/server";
import { MeetingClient } from "@/components/meeting/MeetingClient";

export default async function MeetingPage() {
  const t = await getTranslations("meeting");

  return <MeetingClient />;
}
