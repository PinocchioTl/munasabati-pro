import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/decorations")({
  beforeLoad: () => {
    throw redirect({ href: "/munasabti-manager/decorations", replace: true });
  },
  component: () => null,
});
