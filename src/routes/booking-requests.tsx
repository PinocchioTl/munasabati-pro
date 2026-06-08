import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/booking-requests")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/booking-requests", replace: true });
  },
  component: () => null,
});
