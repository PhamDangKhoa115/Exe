export default function ConfirmToast({
  message,
  onConfirm,
  closeToast,
  loading = false,
}) {
  const handleConfirm = async () => {
    await onConfirm();
    closeToast?.();
  };

  return (
    <div className="confirm-toast">
      <p>{message}</p>

      <div className="confirm-toast-actions">
        <button
          type="button"
          className="cancel"
          onClick={closeToast}
          disabled={loading}
        >
          Hủy
        </button>

        <button
          type="button"
          className="delete"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Đang xóa..." : "Xóa"}
        </button>
      </div>
    </div>
  );
}
