import { getAllClubs } from "./clubApi";

const MOCK_USERS = [
  {
    id: 1,
    fullName: "Nguyễn Văn An",
    email: "an@gmail.com",
    status: "ACTIVE",
    createdAt: "2026-01-08T09:00:00",
  },
  {
    id: 2,
    fullName: "Trần Minh Khoa",
    email: "khoa@gmail.com",
    status: "ACTIVE",
    createdAt: "2026-02-12T10:00:00",
  },
  {
    id: 3,
    fullName: "Lê Ngọc",
    email: "ngoc@gmail.com",
    status: "ACTIVE",
    createdAt: "2026-03-18T11:00:00",
  },
  {
    id: 4,
    fullName: "Phạm Minh Anh",
    email: "anh@gmail.com",
    status: "INACTIVE",
    createdAt: "2026-04-06T08:30:00",
  },
  {
    id: 5,
    fullName: "Hoàng Gia Bảo",
    email: "bao@gmail.com",
    status: "ACTIVE",
    createdAt: "2026-05-21T14:20:00",
  },
];

const MOCK_DASHBOARD = {
  totalUsers: 1286,
  activeUsers: 624,
  newUsersThisMonth: 84,
  suspendedUsers: 19,

  totalDocuments: 856,
  totalEvents: 234,
  totalTasks: 1487,
  totalForms: 165,
  totalSheets: 208,

  googleConnectedUsers: 492,
  trelloConnectedClubs: 38,

  userGrowth: [
    { month: "Jan", users: 120, clubs: 8 },
    { month: "Feb", users: 168, clubs: 12 },
    { month: "Mar", users: 230, clubs: 17 },
    { month: "Apr", users: 314, clubs: 22 },
    { month: "May", users: 420, clubs: 31 },
    { month: "Jun", users: 515, clubs: 39 },
    { month: "Jul", users: 624, clubs: 48 },
  ],

  monthlyUsage: [
    {
      month: "Jan",
      documents: 48,
      events: 21,
      forms: 14,
      sheets: 18,
    },
    {
      month: "Feb",
      documents: 62,
      events: 28,
      forms: 19,
      sheets: 24,
    },
    {
      month: "Mar",
      documents: 84,
      events: 34,
      forms: 22,
      sheets: 31,
    },
    {
      month: "Apr",
      documents: 101,
      events: 42,
      forms: 28,
      sheets: 37,
    },
    {
      month: "May",
      documents: 126,
      events: 51,
      forms: 35,
      sheets: 46,
    },
    {
      month: "Jun",
      documents: 148,
      events: 59,
      forms: 42,
      sheets: 53,
    },
    {
      month: "Jul",
      documents: 173,
      events: 68,
      forms: 49,
      sheets: 62,
    },
  ],

  featureUsage: [
    { name: "Documents", value: 32 },
    { name: "Calendar", value: 24 },
    { name: "Tasks", value: 20 },
    { name: "Sheets", value: 14 },
    { name: "Forms", value: 10 },
  ],

  recentActivities: [
    {
      id: 1,
      actor: "Khoa",
      action: "created a new club",
      target: "Dog Club",
      time: "10 minutes ago",
      type: "CLUB",
    },
    {
      id: 2,
      actor: "Ngọc",
      action: "created a Google Document",
      target: "Meeting Minutes",
      time: "25 minutes ago",
      type: "DOCUMENT",
    },
    {
      id: 3,
      actor: "Minh Anh",
      action: "created an event",
      target: "Welcome Workshop",
      time: "48 minutes ago",
      type: "EVENT",
    },
    {
      id: 4,
      actor: "Gia Bảo",
      action: "connected Trello",
      target: "Marketing Board",
      time: "1 hour ago",
      type: "TRELLO",
    },
    {
      id: 5,
      actor: "Trần Minh Khoa",
      action: "registered an account",
      target: "New User",
      time: "2 hours ago",
      type: "USER",
    },
  ],
};

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.clubs)) return data.clubs;

  return [];
}

export async function getAdminDashboard() {
  let clubs = [];
  let clubApiAvailable = false;

  try {
    const clubData = await getAllClubs();

    clubs = normalizeArray(clubData);
    clubApiAvailable = true;
  } catch (error) {
    console.warn(
      "ADMIN CLUB API ERROR - USING MOCK DATA:",
      error?.response?.data || error,
    );

    clubs = [
      {
        id: 1,
        name: "Technology Club",
        visibility: "PUBLIC",
        createdByName: "Nguyễn Văn An",
        createdAt: "2026-01-11T08:00:00",
      },
      {
        id: 2,
        name: "Marketing Club",
        visibility: "PRIVATE",
        createdByName: "Trần Minh Khoa",
        createdAt: "2026-02-18T09:00:00",
      },
      {
        id: 3,
        name: "English Club",
        visibility: "PUBLIC",
        createdByName: "Lê Ngọc",
        createdAt: "2026-03-22T10:00:00",
      },
    ];
  }

  return {
    ...MOCK_DASHBOARD,

    // Giá trị thật nếu API GET all clubs hoạt động.
    totalClubs: clubs.length,
    clubs,
    clubApiAvailable,

    // Tạm dùng mock vì backend chưa có GET toàn bộ users.
    users: MOCK_USERS,
  };
}
