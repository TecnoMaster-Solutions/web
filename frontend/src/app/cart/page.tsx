import Nav from "@/features/landing/layout/Nav";
import CartModal from "@/features/landing/components/CartModal";

export default function CartPage() {
  return (
    <>
      <Nav />
      <CartModal mode="page" />
    </>
  );
}
