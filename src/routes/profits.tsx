import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/profits")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/profits", replace: true });
  },
  component: () => null,
});
