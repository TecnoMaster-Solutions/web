import ServiceRequestDetail from "@/features/dashboard/requests/components/ServiceRequestDetail";

interface PageProps {
  params: {
    id: string;
  };
}

export default function RequestDetailPage({ params }: PageProps) {
  const parsed = Number(params.id);
  return <ServiceRequestDetail requestId={Number.isFinite(parsed) ? parsed : NaN} />;
}
