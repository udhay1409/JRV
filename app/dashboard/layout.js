import React from "react";
import "./style.css";
import { SidebarDemo } from "../../Components/sidebar/SideBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DashboardFooter from "../../Components/dashboardFooter/DashboardFooter";

const Layout = ({ children }) => {
  return (
    <div className="adminLayout" role="region" aria-label="Admin Dashboard">
      <ToastContainer 
        role="alert" 
        aria-live="polite" 
        aria-atomic="true"
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <aside>
        <nav 
          aria-label="Main navigation"
          role="navigation"
        >
          <SidebarDemo />
        </nav>
      </aside>

      <main 
        className="mainContent"
        role="main"
        aria-label="Main content area"
      >
        <div className="mainContentWrapper">
          {children}
        </div>
        <DashboardFooter />
      </main>
    </div>
  );
};

export default Layout;
