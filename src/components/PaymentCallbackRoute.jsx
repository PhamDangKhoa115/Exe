import { Navigate, useLocation } from "react-router-dom";

export default function PaymentCallbackRoute() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const orderCode = params.get("orderCode");
  const status = params.get("status");
  const cancel = params.get("cancel");
  const valid = /^\d+$/.test(orderCode || "") &&
    Number.isSafeInteger(Number(orderCode)) && Number(orderCode) > 0;

  return (
    <Navigate
      to="/dashboard#subscription"
      replace
      state={{
        paymentCallback: {
          orderCode: valid ? orderCode : null,
          status,
          cancel,
          isCancel: pathname === "/payment/cancel" || cancel === "true",
        },
      }}
    />
  );
}

