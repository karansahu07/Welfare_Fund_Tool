"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import AuthStore from "../store/authStore";
import { usePathname, useRouter } from "next/navigation";

export const AuthContext = createContext<AuthStore | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authStore = useMemo(() => new AuthStore(), []);
  const pathname = usePathname();
  const router = useRouter();
  const unProtectedRoutes = useMemo(() => ["/", "/sign-in/employee", "/sign-in/admin"], []);

useEffect(() => {
  const initAuth = async () => {
    if (!authStore.auth.isInitialized) {
      await authStore.initialize();
    }

    if (unProtectedRoutes.includes(pathname)) {
      authStore.setAuthError(null);
    }

    if(!unProtectedRoutes.includes(pathname) && !authStore.auth.isAuthenticated){
      router.replace("/")
    }

    // const isProtected = !unProtectedRoutes.includes(pathname);
    // const isGuest = authStore.getRole === "guest";
    const isAuthenticated = authStore.auth.isAuthenticated;

    // ⚠️ Only redirect to "/" if on a protected route AND not authenticated AND not already being redirected somewhere else
    // if (isProtected && (!isAuthenticated || isGuest)) {
    //   if (pathname !== "/sign-in/employee" && pathname !== "/sign-in/admin") {
    //     router.replace("/");
    //   }
    // }

//     if (isProtected && (!isAuthenticated || isGuest) && !authStore.logoutRedirecting) {
//   const role = authStore.lastRole;
//   if (role === "admin") {
//     router.replace("/admin/login");
//   } else if (role === "employee") {
//     router.replace("/employee/login");
//   } else {
//     router.replace("/");
//   }
// }
  };

  initAuth();
}, [
  pathname,
  authStore.auth.isInitialized,
  authStore.auth.isAuthenticated,
  authStore.auth.isSubmitting,
  router,
  authStore,
  unProtectedRoutes,
]);


  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
};
