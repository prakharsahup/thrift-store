import type { Metadata } from "next";
import { TransitionDemo } from "../_components/TransitionDemo";

export const metadata: Metadata = { title: "Transition demo · two" };

export default function TransitionPageTwo() {
  return (
    <TransitionDemo
      title="Page two"
      next={{ href: "/dev/transition", label: "Back to page one" }}
    />
  );
}
