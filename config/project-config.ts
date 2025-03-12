import { api } from "@/config/axios.config";
export const getProjects = async () => {
  const response = await api.get("/projects");
  return response.data;
};

// board
export const getBoards = async () => {
  const response = await api.get("/boards");
  return response.data;
};
export const swapBoard = async (data: any) => {
  const response = await api.patch("/boards", data);
  return response.data;
};
// tasks
export const getTasks = async () => {
  const response = await api.get("/tasks");
  return response.data;
};
// sub task
export const getSubtasks = async () => {
  const response = await api.get(`/tasks/subtasks`);
  return response.data;
};

// comments
export const getComments = async () => {
  const response = await api.get(`/comments`);
  return response.data;
};
