import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/booking/$")({
  beforeLoad: ({ params }) => {
    const splat = (params as { _splat?: string })._splat ?? "";
    throw redirect({ href: `/munasabti-booking/${splat}`, replace: true });
  },
  component: () => null,
});
