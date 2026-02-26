import QuoteDetailPage from "@/features/dashboard/quotes/QuoteDetailPage";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  const quoteId = Number(id);
  return <QuoteDetailPage quoteId={quoteId} />;
}
