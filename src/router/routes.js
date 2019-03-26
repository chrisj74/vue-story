// import AuthGuard from "./auth-guard";
// import AdminGuard from "./admin-guard";

const routes = [
  {
    path: "/login",
    component: () => import("pages/auth/login"),
    meta: { requiresAuth: false }
  },
  {
    path: "/register",
    component: () => import("pages/auth/register"),
    meta: { requiresAuth: false }
  },
  {
    path: "/admin",
    name: "Admin",
    component: () => import("layouts/default"),
    meta: { requiresAuth: true }
  },
  {
    path: "/",
    component: () => import("layouts/default"),
    meta: { requiresAuth: false },
    children: [
      {
        path: "",
        component: () => import("pages/index"),
        meta: { requiresAuth: true } },
      {
        path: "/stories",
        name: "Stories",
        component: () => import("pages/stories/index"),
        meta: { requiresAuth: true }
      },
    ]
  },
  {
    path: "/story/:id",
    name: "Story",
    component: () => import("layouts/canvas"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "/",
        name: "Story",
        component: () => import("pages/stories/story"),
        meta: { requiresAuth: true }
      },
      {
        path: ":pageId",
        name: "Page",
        component: () => import("pages/stories/story"),
        meta: { requiresAuth: true }
      }

    ]
  },
  {
    // Always leave this as last one
    path: "*",
    component: () => import("pages/404")
  }
];
export default routes;
