import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/settings", replace: true });
  },
  component: () => null,
});
