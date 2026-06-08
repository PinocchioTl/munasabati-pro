import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/supplies")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/supplies", replace: true });
  },
  component: () => null,
});
