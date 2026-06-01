import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SideDrawer from "./SideDrawer";
import { useUI } from "../context/UIContext";

const DrawerContainer = () => {
  const { drawerOpen, closeDrawer } = useUI();
  const location = useLocation();

  // Close the drawer on every route change (covers nested routes and redirects)
  // Only run when the route changes — avoid running when `drawerOpen` flips
  useEffect(() => {
    if (drawerOpen) {
      closeDrawer();
    }
    // We intentionally only depend on `location.pathname` so opening the drawer
    // doesn't trigger this effect. `closeDrawer` is stable in the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return <SideDrawer isOpen={drawerOpen} onClose={closeDrawer} />;
};

export default DrawerContainer;
