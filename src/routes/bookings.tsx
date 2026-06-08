import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bookings")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/bookings", replace: true });
  },
  component: () => null,
});
