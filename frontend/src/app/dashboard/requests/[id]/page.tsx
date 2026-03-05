import ServiceRequestDetail from "@/features/dashboard/requests/components/ServiceRequestDetail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const parsed = Number(id);
  return <ServiceRequestDetail requestId={Number.isFinite(parsed) ? parsed : NaN} />;
}
