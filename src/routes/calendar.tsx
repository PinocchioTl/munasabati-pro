import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/calendar", replace: true });
  },
  component: () => null,
});
