import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/customers")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/customers", replace: true });
  },
  component: () => null,
});
