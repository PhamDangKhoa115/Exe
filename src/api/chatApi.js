import API from "./api";

// ======================================================
// DEPARTMENT CHAT
// ======================================================

export async function getDepartmentMessages({
  clubId,
  departmentId,
  requesterUserId,
  limit = 50,
  beforeMessageId,
}) {
  const params = {
    requesterUserId,
    limit,
  };

  if (beforeMessageId) {
    params.beforeMessageId = beforeMessageId;
  }

  const response = await API.get(
    `/api/chat/clubs/${clubId}/departments/${departmentId}/messages`,
    { params },
  );

  return response.data;
}

export async function sendDepartmentMessage({
  clubId,
  departmentId,
  requesterUserId,
  content,
  messageType = "TEXT",
  attachments = [],
  isPinned = false,
}) {
  const response = await API.post(
    `/api/chat/clubs/${clubId}/departments/${departmentId}/messages`,
    {
      content,
      messageType,
      attachments,
      isPinned,
    },
    {
      params: {
        requesterUserId,
      },
    },
  );

  return response.data;
}

// ======================================================
// CLUB CHAT
// ======================================================

export async function getClubMessages({
  clubId,
  requesterUserId,
  limit = 50,
  beforeMessageId,
}) {
  const params = {
    requesterUserId,
    limit,
  };

  if (beforeMessageId) {
    params.beforeMessageId = beforeMessageId;
  }

  const response = await API.get(`/api/chat/clubs/${clubId}/messages`, {
    params,
  });

  return response.data;
}

export async function sendClubMessage({
  clubId,
  requesterUserId,
  content,
  messageType = "TEXT",
  attachments = [],
  isPinned = false,
}) {
  const response = await API.post(
    `/api/chat/clubs/${clubId}/messages`,
    {
      content,
      messageType,
      attachments,
      isPinned,
    },
    {
      params: {
        requesterUserId,
      },
    },
  );

  return response.data;
}

// ======================================================
// MESSAGE ACTIONS
// ======================================================

export async function pinMessage(messageId, requesterUserId) {
  const response = await API.put(`/api/chat/messages/${messageId}/pin`, null, {
    params: {
      requesterUserId,
    },
  });

  return response.data;
}

export async function deleteMessage(messageId, requesterUserId) {
  const response = await API.delete(`/api/chat/messages/${messageId}`, {
    params: {
      requesterUserId,
    },
  });

  return response.data;
}

// ======================================================
// FILE
// ======================================================

export async function uploadChatFile(file) {
  const response = await API.post("/api/chat/upload", {
    file,
  });

  return response.data;
}

export function getChatFileUrl(fileName) {
  const baseUrl = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "";

  return `${baseUrl}/api/chat/files/${encodeURIComponent(fileName)}`;
}

export async function getChatEmojis() {
  return (await API.get('/api/chat/emojis')).data;
}
