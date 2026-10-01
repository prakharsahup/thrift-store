import type { Metadata } from "next";
import { TransitionDemo } from "./_components/TransitionDemo";

export const metadata: Metadata = { title: "Transition demo" };

export default function TransitionPageOne() {
  return (
    <TransitionDemo
      title="Page one"
      next={{ href: "/dev/transition/two", label: "Go to page two" }}
    />
  );
}
