import type { AxiosRequestConfig } from "axios";
import api from "./api";

export interface ChecklistListItemResponse {
  checklistId: number;
  title: string;
  stepName: string;
  locked: boolean;
  questionCount: number;
  stepId: number;
}

export interface ChecklistDetailResponse {
  checklistId: number;
  title: string;
  description?: string;
  locked: boolean;
  stepName?: string;
  stepId?: number;
  questionCount?: number;
  createdById?: number;
  questions: any[];
}

export const checklistsApi = {
  getList(projectId: string | number, config?: AxiosRequestConfig) {
    return api.get("/api/checklists", {
      params: { projectId },
      ...(config ?? {}),
    });
  },
  getDetail(checklistId: string | number, config?: AxiosRequestConfig) {
    return api.get(`/api/checklists/${checklistId}`, config);
  },
  submitAnswers(payload: { checklistId: number; answers: Array<{ questionId: number; optionId: number | null; answerText: string | null }> }) {
    return api.post(`/api/checklists/answers`, payload);
  },
  deleteChecklist(checklistId: number) {
    return api.delete(`/api/checklists/${checklistId}`);
  },
  createChecklist(payload: unknown) {
    return api.post("/api/checklists", payload);
  },
  updateChecklist(checklistId: number, payload: unknown) {
    return api.patch(`/api/checklists/${checklistId}`, payload);
  },
  fetchProjectSteps(projectId: string | number, config?: AxiosRequestConfig) {
    return api.get(`/api/projects/${projectId}/steps`, config);
  },
  deleteQuestion(questionId: number) {
    return api.delete(`/api/questions/${questionId}`);
  },
  reorderQuestions(payload: { checklistId: number; orderedIds: number[] }) {
    return api.patch("/api/questions/reorder", payload);
  },
  createQuestion(payload: { checklistId: number; questionId?: number; questionText: string; questionType: "SINGLE" | "MULTI" | "TEXT"; orderIndex?: number }) {
    return api.post("/api/questions", payload);
  },
  updateQuestion(questionId: number, payload: { checklistId: number; questionText: string; questionType: "SINGLE" | "MULTI" | "TEXT" }) {
    return api.put(`/api/questions/${questionId}`, payload);
  },
  createOption(payload: { questionId: number; optionText: string; hasInput?: boolean; orderIndex?: number }) {
    return api.post("/api/options", payload);
  },
  updateOption(optionId: number, payload: { questionId: number; optionText: string; hasInput?: boolean; orderIndex?: number }) {
    return api.put(`/api/options/${optionId}`, payload);
  },
  deleteOption(optionId: number) {
    return api.delete(`/api/options/${optionId}`);
  },
  reorderOptions(payload: { questionId: number; orderedIds: number[] }) {
    return api.patch("/api/options/reorder", payload);
  },
};
