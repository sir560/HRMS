import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

let currentSession = null;
let refreshPromise = null;
let authHooks = {
  onSessionUpdate: () => {},
  onSessionClear: () => {},
};

class ApiClientError extends Error {
  constructor({ message, status, meta, validationErrors, cause }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status ?? null;
    this.meta = meta ?? {};
    this.validationErrors = validationErrors ?? {};
    this.cause = cause;
  }
}

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const privateApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export function registerAuthHooks(hooks) {
  authHooks = {
    ...authHooks,
    ...hooks,
  };
}

export function setApiSession(session) {
  currentSession = session;
}

export function clearApiSession() {
  currentSession = null;
}

function normalizeApiError(error) {
  if (error instanceof ApiClientError) {
    return error;
  }

  const response = error.response?.data;
  const validationErrors = response?.meta?.errors || {};
  const message = response?.message || error.message || "Unexpected API error.";

  return new ApiClientError({
    message,
    status: error.response?.status,
    meta: response?.meta || {},
    validationErrors,
    cause: error,
  });
}

function unwrapEnvelope(response) {
  return {
    data: response.data?.data ?? null,
    message: response.data?.message ?? "",
    meta: response.data?.meta ?? {},
    success: response.data?.success ?? true,
  };
}

async function request(client, config) {
  try {
    const response = await client.request(config);
    return unwrapEnvelope(response);
  } catch (error) {
    throw normalizeApiError(error);
  }
}

privateApi.interceptors.request.use((config) => {
  if (currentSession?.accessToken) {
    config.headers.Authorization = `Bearer ${currentSession.accessToken}`;
  }
  return config;
});

privateApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      !currentSession?.refreshToken ||
      originalRequest?.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(normalizeApiError(error));
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = publicApi
          .post("/auth/refresh", { refreshToken: currentSession.refreshToken })
          .then((response) => response.data.data)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshedAuth = await refreshPromise;
      const updatedSession = {
        ...currentSession,
        ...refreshedAuth,
      };
      setApiSession(updatedSession);
      authHooks.onSessionUpdate(updatedSession);
      originalRequest.headers.Authorization = `Bearer ${updatedSession.accessToken}`;
      return privateApi(originalRequest);
    } catch (refreshError) {
      clearApiSession();
      authHooks.onSessionClear();
      return Promise.reject(normalizeApiError(refreshError));
    }
  }
);

publicApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export function readApiErrorMessage(error, fallbackMessage) {
  const normalizedError = normalizeApiError(error);
  const firstValidationError = Object.values(normalizedError.validationErrors || {})[0];
  return firstValidationError || normalizedError.message || fallbackMessage;
}

export function buildApiUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const authApi = {
  login(credentials) {
    return request(publicApi, { method: "post", url: "/auth/login", data: credentials });
  },
  registerCompany(payload) {
    return request(publicApi, { method: "post", url: "/auth/register-company", data: payload });
  },
  forgotPassword(payload) {
    return request(publicApi, { method: "post", url: "/auth/forgot-password", data: payload });
  },
  resetPassword(payload) {
    return request(publicApi, { method: "post", url: "/auth/reset-password", data: payload });
  },
  me() {
    return request(privateApi, { method: "get", url: "/auth/me" });
  },
  logout(refreshToken) {
    return request(privateApi, {
      method: "post",
      url: "/auth/logout",
      data: refreshToken ? { refreshToken } : {},
    });
  },
};

export const employeeApi = {
  getDepartments() {
    return request(privateApi, { method: "get", url: "/departments" });
  },
  createDepartment(payload) {
    return request(privateApi, { method: "post", url: "/departments", data: payload });
  },
  getDesignations() {
    return request(privateApi, { method: "get", url: "/designations" });
  },
  createDesignation(payload) {
    return request(privateApi, { method: "post", url: "/designations", data: payload });
  },
  getEmployees(params) {
    return request(privateApi, { method: "get", url: "/employees", params });
  },
  getEmployeeById(employeeId) {
    return request(privateApi, { method: "get", url: `/employees/${employeeId}` });
  },
  createEmployee(payload) {
    return request(privateApi, { method: "post", url: "/employees", data: payload });
  },
  updateEmployee(employeeId, payload) {
    return request(privateApi, { method: "put", url: `/employees/${employeeId}`, data: payload });
  },
  deleteEmployee(employeeId) {
    return request(privateApi, { method: "delete", url: `/employees/${employeeId}` });
  },
  getEmployeeDocuments(employeeId) {
    return request(privateApi, { method: "get", url: `/employees/${employeeId}/documents` });
  },
  uploadEmployeeDocument(employeeId, { file, documentType }) {
    const formData = new FormData();
    formData.append("file", file);
    if (documentType) {
      formData.append("documentType", documentType);
    }

    return request(privateApi, {
      method: "post",
      url: `/employees/${employeeId}/documents`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  deleteEmployeeDocument(employeeId, employeeDocumentId) {
    return request(privateApi, {
      method: "delete",
      url: `/employees/${employeeId}/documents/${employeeDocumentId}`,
    });
  },
  async downloadEmployeeDocument(employeeId, employeeDocumentId) {
    const response = await privateApi.request({
      method: "get",
      url: `/employees/${employeeId}/documents/${employeeDocumentId}/download`,
      responseType: "blob",
    });

    return {
      blob: response.data,
      fileName: parseDownloadFileName(response.headers["content-disposition"]),
      contentType: response.headers["content-type"] || "application/octet-stream",
    };
  },
};

export const attendanceApi = {
  clockIn(payload) {
    return request(privateApi, { method: "post", url: "/attendance/clock-in", data: payload });
  },
  clockOut(payload) {
    return request(privateApi, { method: "post", url: "/attendance/clock-out", data: payload });
  },
  getAttendance(params) {
    return request(privateApi, { method: "get", url: "/attendance", params });
  },
  getTodayAttendance(params) {
    return request(privateApi, { method: "get", url: "/attendance/today", params });
  },
  getReport(params) {
    return request(privateApi, { method: "get", url: "/attendance/report", params });
  },
};

export const projectApi = {
  getProjects() {
    return request(privateApi, { method: "get", url: "/projects" });
  },
  getProjectById(projectId) {
    return request(privateApi, { method: "get", url: `/projects/${projectId}` });
  },
  createProject(payload) {
    return request(privateApi, { method: "post", url: "/projects", data: payload });
  },
  createTask(projectId, payload) {
    return request(privateApi, { method: "post", url: `/projects/${projectId}/tasks`, data: payload });
  },
  updateTaskStatus(taskId, payload) {
    return request(privateApi, { method: "put", url: `/tasks/${taskId}/status`, data: payload });
  },
  getTaskComments(taskId) {
    return request(privateApi, { method: "get", url: `/tasks/${taskId}/comments` });
  },
  addTaskComment(taskId, payload) {
    return request(privateApi, { method: "post", url: `/tasks/${taskId}/comments`, data: payload });
  },
  getTaskAttachments(taskId) {
    return request(privateApi, { method: "get", url: `/tasks/${taskId}/attachments` });
  },
  uploadTaskAttachment(taskId, file) {
    const formData = new FormData();
    formData.append("file", file);
    return request(privateApi, {
      method: "post",
      url: `/tasks/${taskId}/attachments`,
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  async downloadTaskAttachment(taskId, taskAttachmentId) {
    const response = await privateApi.request({
      method: "get",
      url: `/tasks/${taskId}/attachments/${taskAttachmentId}/download`,
      responseType: "blob",
    });
    return {
      blob: response.data,
      fileName: parseDownloadFileName(response.headers["content-disposition"]),
      contentType: response.headers["content-type"] || "application/octet-stream",
    };
  },
};
export const payrollApi = {
  runPayroll(payload) {
    return request(privateApi, { method: "post", url: "/payroll/run", data: payload });
  },
  getPayroll(month, year) {
    return request(privateApi, { method: "get", url: `/payroll/${month}/${year}` });
  },
  getSalarySlip(employeeId, params) {
    return request(privateApi, { method: "get", url: `/payroll/slip/${employeeId}`, params });
  },
};
export const leaveApi = {
  getLeaveTypes() {
    return request(privateApi, { method: "get", url: "/leave-types" });
  },
  applyLeave(payload) {
    return request(privateApi, { method: "post", url: "/leave/apply", data: payload });
  },
  getMyRequests() {
    return request(privateApi, { method: "get", url: "/leave/my-requests" });
  },
  getApprovals() {
    return request(privateApi, { method: "get", url: "/leave/approvals" });
  },
  approveLeave(leaveRequestId, payload) {
    return request(privateApi, {
      method: "post",
      url: `/leave/${leaveRequestId}/approve`,
      data: payload || {},
    });
  },
  rejectLeave(leaveRequestId, payload) {
    return request(privateApi, {
      method: "post",
      url: `/leave/${leaveRequestId}/reject`,
      data: payload || {},
    });
  },
};

function parseDownloadFileName(contentDisposition) {
  if (!contentDisposition) {
    return "employee-document";
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || "employee-document";
}

export { ApiClientError, privateApi, publicApi };


