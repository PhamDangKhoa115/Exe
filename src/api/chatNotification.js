import { getDepartmentMessages } from "./chatApi";

import { getDepartments, getDepartmentChatAccess } from "./departmentApi";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.departments)) return data.departments;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function extractMessages(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.messages)) return data.data.messages;

  return [];
}

export async function getChatNotifications() {
  const requesterUserId = Number(localStorage.getItem("userId"));

  const clubId = Number(localStorage.getItem("selectedClubId"));

  if (!requesterUserId || !clubId) {
    return [];
  }

  const departmentResponse = await getDepartments();
  const departments = normalizeArray(departmentResponse);

  const notifications = [];

  for (const department of departments) {
    const departmentId = department.departmentId ?? department.id;

    if (!departmentId) continue;

    try {
      // Kiểm tra user có quyền tham gia phòng hay không.
      const accessResponse = await getDepartmentChatAccess(departmentId);

      const allowed =
        accessResponse === true ||
        accessResponse?.allowed === true ||
        accessResponse?.hasAccess === true ||
        accessResponse?.canAccess === true;

      if (!allowed) {
        continue;
      }

      const response = await getDepartmentMessages({
        clubId,
        departmentId,
        requesterUserId,
        limit: 10,
      });

      const messages = extractMessages(response);

      for (const message of messages) {
        const senderId = Number(
          message.senderId ??
            message.userId ??
            message.senderUserId ??
            message.sender?.userId ??
            message.sender?.id,
        );

        // Không notification message của chính mình.
        if (senderId === requesterUserId) {
          continue;
        }

        notifications.push({
          id: message.messageId ?? message.id,

          departmentId,

          departmentName:
            department.name ?? department.departmentName ?? "Department",

          senderId,

          senderName:
            message.senderName ??
            message.senderFullName ??
            message.sender?.fullName ??
            message.sender?.name ??
            "Member",

          content: message.content ?? message.text ?? "New message",

          createdAt: message.createdAt ?? message.sentAt ?? message.timestamp,
        });
      }
    } catch (error) {
      // Không có quyền vào department thì bỏ qua.
      console.debug(
        `Skip department ${departmentId}:`,
        error?.response?.status,
      );
    }
  }

  return notifications;
}
