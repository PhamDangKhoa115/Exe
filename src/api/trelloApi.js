import API from "./api";

function getRequiredContext() {
  const userId = localStorage.getItem("userId");
  const clubId = localStorage.getItem("selectedClubId");

  if (!userId) {
    throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
  }

  if (!clubId) {
    throw new Error("Vui lòng chọn câu lạc bộ trước.");
  }

  return {
    userId: Number(userId),
    clubId: Number(clubId),
  };
}

function extractData(response) {
  return response?.data;
}

// ==================== TRELLO CONNECTION ====================

export async function getTrelloConnectUrl() {
  const { clubId } = getRequiredContext();

  const response = await API.get("/api/trello/connect", {
    params: { clubId },
  });

  return extractData(response);
}

export async function connectTrello() {
  const data = await getTrelloConnectUrl();

  const url =
    data?.url ||
    data?.authorizationUrl ||
    data?.connectUrl ||
    Object.values(data || {}).find(
      (value) =>
        typeof value === "string" && value.startsWith("https://trello.com"),
    );

  if (!url) {
    throw new Error("Backend không trả về URL kết nối Trello.");
  }

  window.location.href = url;
}

export async function saveTrelloToken(token) {
  const { clubId } = getRequiredContext();

  const response = await API.post("/api/trello/save-token", null, {
    params: {
      clubId,
      token,
    },
  });

  return extractData(response);
}

export async function getTrelloBoards() {
  const { clubId } = getRequiredContext();

  const response = await API.get("/api/trello/boards", {
    params: { clubId },
  });

  return extractData(response);
}

export async function linkTrelloBoard(boardId) {
  const { clubId } = getRequiredContext();

  const response = await API.post("/api/trello/link-board", null, {
    params: {
      clubId,
      boardId,
    },
  });

  return extractData(response);
}

// ==================== TASKS ====================

export async function getTasks(filters = {}) {
  const { clubId, userId } = getRequiredContext();

  const params = {
    clubId,
    userId,
  };

  if (filters.filterType && filters.filterType !== "ALL") {
    params.filterType = filters.filterType;
  }

  if (filters.eventId) {
    params.eventId = Number(filters.eventId);
  }

  if (filters.department) {
    params.department = filters.department;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  const response = await API.get("/api/tasks", {
    params,
  });

  return extractData(response);
}

export async function createTask(taskData) {
  const { clubId, userId } = getRequiredContext();

  const response = await API.post("/api/tasks", taskData, {
    params: {
      clubId,
      userId,
    },
  });

  return extractData(response);
}

export async function updateTask(taskId, taskData) {
  const { userId } = getRequiredContext();

  const response = await API.put(`/api/tasks/${taskId}`, taskData, {
    params: { userId },
  });

  return extractData(response);
}

export async function deleteTask(taskId) {
  const { userId } = getRequiredContext();

  const response = await API.delete(`/api/tasks/${taskId}`, {
    params: { userId },
  });

  return extractData(response);
}

// ==================== STATISTICS ====================

export async function getTaskDashboard() {
  const { clubId, userId } = getRequiredContext();

  const response = await API.get("/api/tasks/dashboard", {
    params: {
      clubId,
      userId,
    },
  });

  return extractData(response);
}

export async function getTaskReminders() {
  const { clubId, userId } = getRequiredContext();

  const response = await API.get("/api/tasks/reminders", {
    params: {
      clubId,
      userId,
    },
  });

  return extractData(response);
}

export async function getMemberPerformance() {
  const { clubId, userId } = getRequiredContext();

  const response = await API.get("/api/tasks/performance", {
    params: {
      clubId,
      userId,
    },
  });

  return extractData(response);
}
