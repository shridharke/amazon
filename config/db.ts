import { api } from "@/config/axios.config";
import {  Organization } from "@prisma/client";

export const createOrganization = async (data: any) => {
  const response = await api.post("/organization", data);
  return response;
};

export const getOrganizations = async () => {
  const response = await api.get("/organization");
  return response;
};

export const createDocument = async (data: any) => {
  const response = await api.post("/documents", data);
  return response;
};

export const getDocuments = async (orgId: number) => {
  const response = await api.get(`/organization/${orgId}/documents`);
  return response;
};

export const deleteDocument = async (fileId: number) => {
  const response = await api.delete(`/documents/${fileId}`);
  return response;
};

export const getJobs = async (orgId: number) => {
  const response = await api.get(`/organization/${orgId}/jobs`);
  return response;
};

export const deleteJob = async (jobId: number) => {
  const response = await api.delete(`/jobs/${jobId}`);
  return response;
};

export const getJobDocuments = async (jobId: number) => {
  const response = await api.get(`/jobs/${jobId}/documents`);
  return response;
};

export const removeJobDocument = async (jobId: number, fileId: number) => {
  const response = await api.delete(`/jobs/${jobId}/documents/${fileId}`);
  return response;
};

export const addJobDocuments = async (jobId: number, data: number[]) => {
  const response = await api.post(`/jobs/${jobId}/documents`, data);
  return response;
};

export const createComment = async (data: any) => {
  const response = await api.post("/comments", data);
  return response;
};

export const deleteComment = async (commentId: number) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response;
};

export const getJobComments = async (jobId: number) => {
  const response = await api.get(`/jobs/${jobId}/comments`);
  return response;
};