import { useEffect, useState } from "react";

export type AppRoute = "home" | "calendar" | "pomodoro" | "settings";

const routes = new Set<AppRoute>(["home", "calendar", "pomodoro", "settings"]);

function readRoute(): AppRoute {
  const value = window.location.hash.replace(/^#\/?/, "") as AppRoute;
  return routes.has(value) ? value : "home";
}

export function useHashRoute(): AppRoute {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

