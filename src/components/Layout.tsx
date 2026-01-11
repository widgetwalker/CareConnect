import { PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export const Layout = ({ children }: PropsWithChildren) => {
    const location = useLocation();
    const hideNavbarRoutes = ["/signin", "/signup"];
    const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

    return (
        <>
            {shouldShowNavbar && <Navbar />}
            {children}
        </>
    );
};
