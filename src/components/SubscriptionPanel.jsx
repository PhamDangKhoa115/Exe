import { trackCheckoutStart, trackPricingView } from "../utils/backendAnalytics";
import { trackPaymentEvent } from "../utils/analytics";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getPackages,
  checkPaymentPermission,
  createCheckout,
  getPaymentOrder,
  cancelPaymentOrder,
  getClubSubscription,
} from "../api/paymentApi";
import { getApiError } from "../utils/getApiError";
import "./SubscriptionPanel.css";

const PERMISSION_MESSAGE =
  "Only the club president can purchase or renew a subscription.";
const money = (value) =>
  Number(value).toLocaleString("en-US", { style: "currency", currency: "VND" });
function date(value) {
  const parsed = new Date(value);
  return value && !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Unknown";
}
function secureUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
export default function SubscriptionPanel() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const paymentCallback = state?.paymentCallback;
  const callbackRequest = useRef(null);
  const restoreRequest = useRef(null);
  const [pollRevision, setPollRevision] = useState(0);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState("");
  const [packagesOpen, setPackagesOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [canPay, setCanPay] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [pollError, setPollError] = useState("");
  const mounted = useRef(false);
  const busy = useRef(false);
  const cancelBusy = useRef(false);
  const pollStop = useRef(() => {});
  const [identity, setIdentity] = useState(() =>
    localStorage.getItem("selectedClubId") +
    ":" +
    localStorage.getItem("userId"));
  const pendingKey = `sclub-pending-order:${identity}`;
  useEffect(() => {
    const sync = () => setIdentity(localStorage.getItem('selectedClubId') + ':' + localStorage.getItem('userId'));
    const timer = setInterval(sync, 500);
    window.addEventListener('storage', sync);
    return () => { clearInterval(timer); window.removeEventListener('storage', sync); };
  }, []);
  const isCurrent = useCallback(
    () =>
      mounted.current &&
      identity ===
        localStorage.getItem("selectedClubId") +
          ":" +
          localStorage.getItem("userId"),
    [identity],
  );

  const loadSubscription = useCallback(async () => {
    if (!isCurrent()) return;
    setSubscriptionLoading(true);
    setSubscriptionError("");
    try {
      const data = await getClubSubscription();
      if (isCurrent()) setSubscription(data);
    } catch (error) {
      if (!isCurrent()) return;
      if (error.response?.status === 404) setSubscription(null);
      else
        setSubscriptionError(
          getApiError(error, "Unable to load the current subscription."),
        );
    } finally {
      if (isCurrent()) setSubscriptionLoading(false);
    }
  }, [isCurrent]);

  const loadPermission = useCallback(async () => {
    setPermissionLoading(true);
    setCanPay(false);
    setPermissionError("");
    try {
      const data = await checkPaymentPermission();
      if (isCurrent()) setCanPay(data?.canPay === true);
    } catch (error) {
      if (isCurrent())
        setPermissionError(
          getApiError(error, "Unable to check payment permission."),
        );
    } finally {
      if (isCurrent()) setPermissionLoading(false);
    }
  }, [isCurrent]);

  useEffect(() => {
    mounted.current = true;
    setPaymentOrder(null); setPaymentModalOpen(false); setPackagesOpen(false); setPollError('');
    loadSubscription();
    loadPermission();
    return () => {
      mounted.current = false;
      pollStop.current();
    };
  }, [loadSubscription, loadPermission]);

  const finishOrder = useCallback(
    (order) => {
      setPaymentOrder(order);
      if (['PAID', 'CANCELLED', 'EXPIRED'].includes(order.status)) {
        try { sessionStorage.removeItem(pendingKey); } catch { /* Payment status still comes from backend. */ }
      }
      if (order.status === "PAID") {
        setPaymentModalOpen(false);
        setPackagesOpen(false);
        toast.success("Payment successful! Your subscription has been updated.");
        loadSubscription();
      } else if (order.status === "CANCELLED") {
        setPaymentModalOpen(false);
        toast.info("Payment cancelled.");
      } else if (order.status === "EXPIRED") {
        toast.warning(
          "This payment order has expired. Select a plan to try again.",
        );
      }
    },
    [loadSubscription, pendingKey],
  );

  useEffect(() => {
    if (paymentCallback || paymentOrder?.orderCode) return;
    let active = true;
    let code;
    try { code = sessionStorage.getItem(pendingKey); } catch { return; }
    if (!code || !/^\d+$/.test(code)) return;
    const key = `${identity}:${code}`;
    if (restoreRequest.current?.key !== key) restoreRequest.current = { key, promise: getPaymentOrder(code) };
    restoreRequest.current.promise.then(order => {
      if (!active || !isCurrent()) return;
      const [clubId, userId] = identity.split(':');
      if (String(order.clubId) !== clubId || String(order.userId) !== userId) throw new Error('This order does not belong to the current user or club.');
      if (order.status === 'PENDING') { setPaymentOrder(order); setPaymentModalOpen(true); }
      else finishOrder(order);
    }).catch(error => { if (active && isCurrent()) setPollError(getApiError(error, error.message || 'Unable to restore the payment order.')); });
    return () => { active = false; };
  }, [identity, pendingKey, paymentCallback, isCurrent, finishOrder, pollRevision, paymentOrder?.orderCode]);

  const callbackOrderCode = paymentCallback?.orderCode;
  const callbackIsCancel = paymentCallback?.isCancel;
  const hasCallback = Boolean(paymentCallback);
  useEffect(() => {
    if (!hasCallback) return;
    let active = true;
    if (!callbackOrderCode) {
      toast.error("Invalid payment order code.");
      navigate("/dashboard#subscription", { replace: true, state: null });
      return;
    }
    const key = identity + ":" + callbackOrderCode + ":" + callbackIsCancel;
    // Keep the same request through StrictMode's setup/cleanup/setup cycle.
    if (callbackRequest.current?.key !== key) {
      callbackRequest.current = {
        key,
        promise: (async () => {
          let order = await getPaymentOrder(callbackOrderCode);
          if (
            String(order.clubId) !== localStorage.getItem("selectedClubId") ||
            String(order.userId) !== localStorage.getItem("userId")
          ) {
            throw new Error(
              "This payment order does not belong to the current user or club.",
            );
          }
          if (callbackIsCancel && order.status === "PENDING") {
            await cancelPaymentOrder(callbackOrderCode);
            order = await getPaymentOrder(callbackOrderCode);
          }
          return order;
        })(),
      };
    }
    callbackRequest.current.promise
      .then((order) => {
        if (!active || !isCurrent()) return;
        setPollError("");
        setPaymentOrder(order);
        if (order.status === "PENDING") {
          try { sessionStorage.setItem(pendingKey, String(order.orderCode)); } catch { /* Optional reconnect storage. */ }
          setPaymentModalOpen(true);
          if (callbackIsCancel)
            toast.warning("This order is still pending payment. Please try cancelling again.");
        } else {
          trackPaymentEvent("complete_payment", order);
          finishOrder(order);
        }
        navigate("/dashboard#subscription", { replace: true, state: null });
      })
      .catch((error) => {
        if (!active || !isCurrent()) return;
        toast.error(
          getApiError(error, error.message || "Unable to verify payment."),
        );
        navigate("/dashboard#subscription", { replace: true, state: null });
      });
    return () => {
      active = false;
    };
  }, [
    hasCallback,
    callbackOrderCode,
    callbackIsCancel,
    identity,
    isCurrent,
    finishOrder,
    navigate,
    pendingKey,
  ]);

  const orderCode = paymentOrder?.orderCode;
  const orderStatus = paymentOrder?.status;
  useEffect(() => {
    if (
      !orderCode ||
      orderStatus !== "PENDING" ||
      cancelLoading
    )
      return;
    let active = true;
    let timer;
    let failures = 0;
    const controller = new AbortController();
    const stop = () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
    pollStop.current = stop;
    async function poll() {
      try {
        const order = await getPaymentOrder(orderCode, controller.signal);
        if (!active || !isCurrent()) return;
        setPollError("");
        failures = 0;
        if (["PAID", "CANCELLED", "EXPIRED"].includes(order.status)) {
          stop();
          trackPaymentEvent("complete_payment", order);
          finishOrder(order);
          return;
        }
        setPaymentOrder(order);
      } catch (error) {
        if (!active || !isCurrent()) return;
        failures += 1;
        setPollError(
          getApiError(error, failures >= 6 ? "Payment checks have been paused. Please retry." : "Unable to check payment status. Retrying…"),
        );
        if ([401, 403, 404].includes(error.response?.status) || failures >= 6) return;
      }
      if (active && isCurrent()) timer = setTimeout(poll, Math.min(30000, 2000 * 2 ** failures));
    }
    timer = setTimeout(poll, 2000);
    return stop;
  }, [
    orderCode,
    orderStatus,
    cancelLoading,
    finishOrder,
    isCurrent,
    pollRevision,
  ]);

  async function openPackages() {
    if (!canPay || permissionLoading || packagesLoading) return;
    if (!packagesOpen) trackPricingView();
    setPackagesOpen(true);
    setPackagesLoading(true);
    setPackagesError("");
    try {
      const data = await getPackages();
      if (isCurrent()) {
        if (!Array.isArray(data))
          throw new Error("Invalid subscription plan data.");
        setPackages(data);
      }
    } catch (error) {
      if (isCurrent())
        setPackagesError(
          getApiError(error, "Unable to load subscription plans."),
        );
    } finally {
      if (isCurrent()) setPackagesLoading(false);
    }
  }
  async function buy(item) {
    if (
      !canPay ||
      permissionLoading ||
      busy.current ||
      paymentOrder?.status === "PENDING"
    )
      return;
    busy.current = true;
    setPaymentLoading(true);
    setSelectedPackage(item);
    try {
      const permission = await checkPaymentPermission();
      if (!isCurrent()) return;
      setCanPay(permission?.canPay === true);
      if (permission?.canPay !== true) {
        toast.warning(PERMISSION_MESSAGE);
        return;
      }
      const order = await createCheckout(item.id);
      if (!isCurrent()) return;
      setPollError("");
      setPaymentOrder(order);
      if (order.status === 'PENDING') {
        try { sessionStorage.setItem(pendingKey, String(order.orderCode)); } catch { /* Optional reconnect storage. */ }
      }
      trackPaymentEvent("initiate_transaction", order);
      trackCheckoutStart(order.orderCode);
      setPaymentModalOpen(true);
      if (order.status !== "PENDING") finishOrder(order);
    } catch (error) {
      if (isCurrent()) {
        if ([400, 403].includes(error.response?.status)) loadPermission();
        toast.error(getApiError(error, "Unable to create a payment order."));
      }
    } finally {
      busy.current = false;
      if (isCurrent()) setPaymentLoading(false);
    }
  }
  async function cancel() {
    if (cancelBusy.current || paymentOrder?.status !== "PENDING") return;
    cancelBusy.current = true;
    pollStop.current();
    setCancelLoading(true);
    try {
      await cancelPaymentOrder(orderCode);
      if (!isCurrent()) return;
      const order = await getPaymentOrder(orderCode);
      if (!isCurrent()) return;
      if (["PAID", "CANCELLED", "EXPIRED"].includes(order.status)) {
        trackPaymentEvent("complete_payment", order);
        finishOrder(order);
      } else {
        setPaymentOrder(order);
        toast.warning("This order is still pending payment. Please try cancelling again.");
      }
    } catch (error) {
      if (isCurrent())
        toast.error(
          getApiError(
            error,
            "Unable to cancel payment. Continuing to check its status.",
          ),
        );
    } finally {
      cancelBusy.current = false;
      if (isCurrent()) setCancelLoading(false);
    }
  }
  const qrUrl = secureUrl(paymentOrder?.qrCodeUrl);
  const checkoutUrl = secureUrl(paymentOrder?.checkoutUrl);
  return (
    <article className="subscription-panel dashboard-panel" id="subscription">
      <div className="subscription-heading">
        <h2>Club Subscription</h2>
        <button
          type="button"
          className="subscription-button"
          disabled={
            !canPay ||
            permissionLoading ||
            paymentLoading ||
            paymentOrder?.status === "PENDING"
          }
          onClick={openPackages}
          title={!canPay ? PERMISSION_MESSAGE : undefined}
        >
          {permissionLoading ? "Checking permission…" : "Upgrade / Renew"}
        </button>
      </div>
      {subscriptionLoading ? (
        <p>Loading subscription…</p>
      ) : subscriptionError ? (
        <p role="alert">
          {subscriptionError}{" "}
          <button type="button" onClick={loadSubscription}>
            Retry
          </button>
        </p>
      ) : subscription ? (
        <dl className="subscription-details">
          <div>
            <dt>Current Plan</dt>
            <dd>{subscription.packageName}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{subscription.status}</dd>
          </div>
          <div>
            <dt>Start Date</dt>
            <dd>{date(subscription.startDate)}</dd>
          </div>
          <div>
            <dt>End Date</dt>
            <dd>{date(subscription.endDate)}</dd>
          </div>
        </dl>
      ) : (
        <p>This club does not have an active subscription.</p>
      )}
      {permissionError ? (
        <p role="alert">
          {permissionError}{" "}
          <button
            type="button"
            onClick={loadPermission}
            disabled={permissionLoading}
          >
            Retry
          </button>
        </p>
      ) : (
        !permissionLoading && !canPay && <p>{PERMISSION_MESSAGE}</p>
      )}
      {!paymentModalOpen && paymentOrder?.status === 'PENDING' && <button type="button" onClick={() => setPaymentModalOpen(true)}>Reopen Pending Order</button>}
      {pollError && !paymentModalOpen && <p role="alert">{pollError} <button type="button" onClick={() => { restoreRequest.current = null; setPollRevision(value => value + 1); }}>Retry</button></p>}
      {packagesOpen && (
        <div className="package-section">
          <div className="subscription-heading">
            <h3>Choose a Plan</h3>
            <button
              type="button"
              disabled={paymentLoading || paymentModalOpen}
              onClick={() => setPackagesOpen(false)}
            >
              Close Plans
            </button>
          </div>
          {packagesLoading ? (
            <p>Loading plans…</p>
          ) : packagesError ? (
            <p role="alert">
              {packagesError}{" "}
              <button type="button" onClick={openPackages}>
                Retry
              </button>
            </p>
          ) : packages.length === 0 ? (
            <p>No subscription plans are available.</p>
          ) : (
            <div className="package-grid">
              {packages.map((item) => (
                <article className="package-card" key={item.id}>
                  <h3>{item.name}</h3>
                  <strong>{money(item.price)}</strong>
                  <p>Duration: {item.durationDays} days</p>
                  <p>{item.description}</p>
                  <p>
                    {Array.isArray(item.features)
                      ? item.features.join(", ")
                      : item.features}
                  </p>
                  <button
                    type="button"
                    className="subscription-button"
                    onClick={() => buy(item)}
                    disabled={
                      !canPay ||
                      permissionLoading ||
                      paymentLoading ||
                      paymentOrder?.status === "PENDING"
                    }
                  >
                    {paymentLoading && selectedPackage?.id === item.id
                      ? "Creating order…"
                      : "Pay Now"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      {paymentModalOpen && paymentOrder && (
        <div className="payment-overlay">
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            aria-describedby="payment-status"
          >
            <h2 id="payment-title">Subscription Payment</h2>
            <h3>{paymentOrder.packageName}</h3>
            <strong>{money(paymentOrder.amount)}</strong>
            <p>Method: {paymentOrder.paymentMethod}</p>
            <p>Order Code: {paymentOrder.orderCode}</p>
            <p id="payment-status" aria-live="polite">
              Status: {paymentOrder.status}
            </p>
            {paymentOrder.status === "PENDING" && (
              <>
                {qrUrl ? (
                  <img
                    className="payment-qr"
                    src={qrUrl}
                    alt="Payment QR code provided by the system"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                      setPollError(
                        "Unable to load the QR code. Use the PayOS link if available.",
                      );
                    }}
                  />
                ) : (
                  <p>
                    No QR code is available. Use the PayOS link if available.
                  </p>
                )}
                {checkoutUrl && (
                  <a
                    className="subscription-button"
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pay with PayOS
                  </a>
                )}
              </>
            )}
            {paymentOrder.status === "EXPIRED" && (
              <p>This order has expired. Close this dialog to choose a plan and create a new order.</p>
            )}
            {pollError && (
              <p className="payment-error" role="alert">
                {pollError}
                <button type="button" onClick={() => setPollRevision(value => value + 1)}>Retry</button>
              </p>
            )}
            <div className="payment-actions">
              <button type="button" disabled={cancelLoading} onClick={() => setPaymentModalOpen(false)}>Close</button>
              {paymentOrder.status === "PENDING" ? (
                <button
                  type="button"
                  autoFocus
                  onClick={cancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Cancelling…" : "Cancel Payment"}
                </button>
              ) : (
                null
              )}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
