import { PropsWithChildren } from "react";
import Navbar from "./Navbar";

export const Layout = ({ children }: PropsWithChildren) => (
    <>
        <Navbar />
        {children}
    </>
);
