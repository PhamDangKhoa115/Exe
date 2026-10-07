import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AnalyticsTracker from "./components/AnalyticsTracker";
import "./styles.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClickSpark from "./components/reactbits/ClickSpark";
import "./modern-theme.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AnalyticsTracker />
    <ClickSpark className="sclub-ui">
      <App />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        pauseOnHover
        theme="colored"
      />
    </ClickSpark>
  </BrowserRouter>,
);
