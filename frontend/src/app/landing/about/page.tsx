import About from "@/features/landing/about/about";
import { headers } from "next/headers";

export default async function AboutPage() {
    const nonce = (await headers()).get("x-nonce") ?? undefined;
    return <About nonce={nonce} />;
}
