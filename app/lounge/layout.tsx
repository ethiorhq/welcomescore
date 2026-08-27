import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Dev Lounge: Practical First-Contributor Conversation | WelcomeScore",
  description:
    "Join a temporary, anonymous space for practical first-contributor questions, score-card discussion, and respectful open-source encouragement.",
  path: "/lounge",
  imagePath: "/opengraph-image",
  imageAlt: "WelcomeScore Dev Lounge community guidelines and contributor discussion",
});

export default function LoungeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
