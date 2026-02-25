import OrderServiceDetail from "@/features/dashboard/OrdersServices/components/OrderServiceDetail";

interface PageProps {
  params: {
    id: string;
  };
}

export default function OrderDetailPage({ params }: PageProps) {
  const parsedId = Number(params.id);
  return <OrderServiceDetail orderId={parsedId} />;
}
