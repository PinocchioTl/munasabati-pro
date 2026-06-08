import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/notifications", replace: true });
  },
  component: () => null,
});
