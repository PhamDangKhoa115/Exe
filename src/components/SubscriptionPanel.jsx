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
  "Chỉ Chủ nhiệm câu lạc bộ mới có quyền gia hạn/thanh toán gói dịch vụ";
const money = (value) =>
  Number(value).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
function date(value) {
  const parsed = new Date(value);
  return value && !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Không rõ";
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
  const identity =
    localStorage.getItem("selectedClubId") +
    ":" +
    localStorage.getItem("userId");
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
          getApiError(error, "Không thể tải gói dịch vụ hiện tại."),
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
          getApiError(error, "Không thể kiểm tra quyền thanh toán."),
        );
    } finally {
      if (isCurrent()) setPermissionLoading(false);
    }
  }, [isCurrent]);

  useEffect(() => {
    mounted.current = true;
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
      if (order.status === "PAID") {
        setPaymentModalOpen(false);
        setPackagesOpen(false);
        toast.success("Thanh toán thành công! Gói dịch vụ đã được cập nhật.");
        loadSubscription();
      } else if (order.status === "CANCELLED") {
        setPaymentModalOpen(false);
        toast.info("Thanh toán đã được hủy");
      } else if (order.status === "EXPIRED") {
        toast.warning(
          "Đơn thanh toán đã hết hạn. Bạn có thể chọn gói để thanh toán lại.",
        );
      }
    },
    [loadSubscription],
  );

  const callbackOrderCode = paymentCallback?.orderCode;
  const callbackIsCancel = paymentCallback?.isCancel;
  const hasCallback = Boolean(paymentCallback);
  useEffect(() => {
    if (!hasCallback) return;
    let active = true;
    if (!callbackOrderCode) {
      toast.error("Mã đơn thanh toán không hợp lệ.");
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
              "Đơn thanh toán không thuộc người dùng hoặc câu lạc bộ hiện tại.",
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
          setPaymentModalOpen(true);
          if (callbackIsCancel)
            toast.warning("Đơn vẫn đang chờ thanh toán. Vui lòng thử hủy lại.");
        } else {
          trackPaymentEvent("complete_payment", order);
          finishOrder(order);
        }
        navigate("/dashboard#subscription", { replace: true, state: null });
      })
      .catch((error) => {
        if (!active || !isCurrent()) return;
        toast.error(
          getApiError(error, error.message || "Không thể xác minh thanh toán."),
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
  ]);

  const orderCode = paymentOrder?.orderCode;
  const orderStatus = paymentOrder?.status;
  useEffect(() => {
    if (
      !paymentModalOpen ||
      !orderCode ||
      orderStatus !== "PENDING" ||
      cancelLoading
    )
      return;
    let active = true;
    let timer;
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
        if (["PAID", "CANCELLED", "EXPIRED"].includes(order.status)) {
          stop();
          trackPaymentEvent("complete_payment", order);
          finishOrder(order);
          return;
        }
        setPaymentOrder(order);
      } catch (error) {
        if (!active || !isCurrent()) return;
        setPollError(
          getApiError(error, "Không thể kiểm tra thanh toán. Đang thử lại…"),
        );
      }
      if (active && isCurrent()) timer = setTimeout(poll, 2000);
    }
    timer = setTimeout(poll, 2000);
    return stop;
  }, [
    paymentModalOpen,
    orderCode,
    orderStatus,
    cancelLoading,
    finishOrder,
    isCurrent,
  ]);

  async function openPackages() {
    if (!canPay || permissionLoading || packagesLoading) return;
    setPackagesOpen(true);
    setPackagesLoading(true);
    setPackagesError("");
    try {
      const data = await getPackages();
      if (isCurrent()) {
        if (!Array.isArray(data))
          throw new Error("Dữ liệu gói dịch vụ không hợp lệ.");
        setPackages(data);
      }
    } catch (error) {
      if (isCurrent())
        setPackagesError(
          getApiError(error, "Không thể tải danh sách gói dịch vụ."),
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
      trackPaymentEvent("initiate_transaction", order);
      setPaymentModalOpen(true);
      if (order.status !== "PENDING") finishOrder(order);
    } catch (error) {
      if (isCurrent()) {
        if ([400, 403].includes(error.response?.status)) loadPermission();
        toast.error(getApiError(error, "Không thể tạo đơn thanh toán."));
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
        toast.warning("Đơn vẫn đang chờ thanh toán. Vui lòng thử hủy lại.");
      }
    } catch (error) {
      if (isCurrent())
        toast.error(
          getApiError(
            error,
            "Không thể hủy thanh toán. Đang tiếp tục kiểm tra trạng thái.",
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
        <h2>Gói dịch vụ câu lạc bộ</h2>
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
          {permissionLoading ? "Đang kiểm tra quyền…" : "Nâng cấp / Gia hạn"}
        </button>
      </div>
      {subscriptionLoading ? (
        <p>Đang tải gói dịch vụ…</p>
      ) : subscriptionError ? (
        <p role="alert">
          {subscriptionError}{" "}
          <button type="button" onClick={loadSubscription}>
            Thử lại
          </button>
        </p>
      ) : subscription ? (
        <dl className="subscription-details">
          <div>
            <dt>Gói hiện tại</dt>
            <dd>{subscription.packageName}</dd>
          </div>
          <div>
            <dt>Trạng thái</dt>
            <dd>{subscription.status}</dd>
          </div>
          <div>
            <dt>Từ ngày</dt>
            <dd>{date(subscription.startDate)}</dd>
          </div>
          <div>
            <dt>Đến ngày</dt>
            <dd>{date(subscription.endDate)}</dd>
          </div>
        </dl>
      ) : (
        <p>CLB hiện chưa có gói dịch vụ đang hoạt động.</p>
      )}
      {permissionError ? (
        <p role="alert">
          {permissionError}{" "}
          <button
            type="button"
            onClick={loadPermission}
            disabled={permissionLoading}
          >
            Thử lại
          </button>
        </p>
      ) : (
        !permissionLoading && !canPay && <p>{PERMISSION_MESSAGE}</p>
      )}
      {packagesOpen && (
        <div className="package-section">
          <div className="subscription-heading">
            <h3>Chọn gói dịch vụ</h3>
            <button
              type="button"
              disabled={paymentLoading || paymentModalOpen}
              onClick={() => setPackagesOpen(false)}
            >
              Đóng danh sách
            </button>
          </div>
          {packagesLoading ? (
            <p>Đang tải danh sách gói…</p>
          ) : packagesError ? (
            <p role="alert">
              {packagesError}{" "}
              <button type="button" onClick={openPackages}>
                Thử lại
              </button>
            </p>
          ) : packages.length === 0 ? (
            <p>Chưa có gói dịch vụ khả dụng.</p>
          ) : (
            <div className="package-grid">
              {packages.map((item) => (
                <article className="package-card" key={item.id}>
                  <h3>{item.name}</h3>
                  <strong>{money(item.price)}</strong>
                  <p>Thời hạn: {item.durationDays} ngày</p>
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
                      ? "Đang tạo đơn…"
                      : "Thanh toán"}
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
            <h2 id="payment-title">Thanh toán gói dịch vụ</h2>
            <h3>{paymentOrder.packageName}</h3>
            <strong>{money(paymentOrder.amount)}</strong>
            <p>Phương thức: {paymentOrder.paymentMethod}</p>
            <p>Mã đơn: {paymentOrder.orderCode}</p>
            <p id="payment-status" aria-live="polite">
              Trạng thái: {paymentOrder.status}
            </p>
            {paymentOrder.status === "PENDING" && (
              <>
                {qrUrl ? (
                  <img
                    className="payment-qr"
                    src={qrUrl}
                    alt="Mã QR thanh toán do hệ thống cung cấp"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                      setPollError(
                        "Không tải được mã QR. Vui lòng sử dụng liên kết PayOS nếu có.",
                      );
                    }}
                  />
                ) : (
                  <p>
                    Không có mã QR khả dụng. Vui lòng sử dụng liên kết PayOS nếu
                    có.
                  </p>
                )}
                {checkoutUrl && (
                  <a
                    className="subscription-button"
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Thanh toán qua PayOS
                  </a>
                )}
              </>
            )}
            {paymentOrder.status === "EXPIRED" && (
              <p>Đơn đã hết hạn. Đóng để chọn gói và tạo đơn mới.</p>
            )}
            {pollError && (
              <p className="payment-error" role="alert">
                {pollError}
              </p>
            )}
            <div className="payment-actions">
              {paymentOrder.status === "PENDING" ? (
                <button
                  type="button"
                  autoFocus
                  onClick={cancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Đang hủy…" : "Hủy thanh toán"}
                </button>
              ) : (
                <button
                  type="button"
                  autoFocus
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Đóng
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
