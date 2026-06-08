import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/analytics", replace: true });
  },
  component: () => null,
});
