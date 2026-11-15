import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { routeSearchSchema } from "@/lib/route-search";
import { AppShell } from "@/components/app-shell";
import { PageContent } from "@/features/page-content";

const rootRoute = createRootRoute({ component: Root });
function Root() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PageContent,
});
const pageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  validateSearch: routeSearchSchema,
  component: PageContent,
});
export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, pageRoute]),
  history: createHashHistory(),
  defaultPreload: "intent",
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
