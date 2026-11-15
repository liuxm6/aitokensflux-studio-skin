import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { AppLink } from "../primitives";

describe("Navigation location", () => {
  it("does not mark the parent overview current on a child page", async () => {
    const root = createRootRoute();
    const page = createRoute({
      getParentRoute: () => root,
      path: "/$",
      component: () => (
        <nav>
          <AppLink to="/console">Overview</AppLink>
          <AppLink to="/console/keys">Keys</AppLink>
        </nav>
      ),
    });
    const router = createRouter({
      routeTree: root.addChildren([page]),
      history: createMemoryHistory({ initialEntries: ["/console/keys"] }),
    });
    render(<RouterProvider router={router} />);
    expect(await screen.findByRole("link", { name: "Keys" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
