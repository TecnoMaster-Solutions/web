import OrderServiceDetail from "@/features/dashboard/OrdersServices/components/OrderServiceDetail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const parsedId = Number(id);
  return <OrderServiceDetail orderId={parsedId} />;
}
