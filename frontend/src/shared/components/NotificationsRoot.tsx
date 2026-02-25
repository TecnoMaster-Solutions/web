"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { APP_TOAST_ID } from "@/shared/utils/notifications";

export default function NotificationsRoot() {
  return (
    <ToastContainer
      containerId={APP_TOAST_ID}
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      draggable
      newestOnTop
      limit={3}
      style={{ zIndex: 999999 }}
    />
  );
}
