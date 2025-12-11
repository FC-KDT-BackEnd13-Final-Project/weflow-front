export type ActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "UPLOAD"
  | "DOWNLOAD"
  | "REMOVE"
  | "SUBMIT";

export type TargetTable =
  | "POST"
  | "POST_ANSWER"
  | "COMMENT"
  | "PROJECT"
  | "PROJECT_MEMBER"
  | "USER"
  | "COMPANY"
  | "CHECKLIST"
  | "CHECKLIST_QUESTION"
  | "CHECKLIST_OPTION"
  | "ATTACHMENT"
  | "STEP"
  | "STEP_REQUEST"
  | "STEP_RESPONSE"
  | "TEMPLATE";

export const actionTypeLabels: Record<string, string> = {
  CREATE: "생성",
  UPDATE: "수정",
  DELETE: "삭제",
  LOGIN: "로그인",
  LOGOUT: "로그아웃",
  APPROVE: "승인",
  REJECT: "반려",
  UPLOAD: "업로드",
  DOWNLOAD: "다운로드",
  REMOVE: "제거",
  SUBMIT: "제출",
};

export const targetTableLabels: Record<string, string> = {
  POST: "게시글",
  POST_ANSWER: "게시글 답변",
  COMMENT: "댓글",
  PROJECT: "프로젝트",
  PROJECT_MEMBER: "프로젝트 멤버",
  USER: "회원",
  COMPANY: "회사",
  CHECKLIST: "체크리스트",
  CHECKLIST_QUESTION: "체크리스트 질문",
  CHECKLIST_OPTION: "체크리스트 옵션",
  ATTACHMENT: "첨부파일",
  STEP: "단계",
  STEP_REQUEST: "단계 요청",
  STEP_RESPONSE: "단계 응답",
  TEMPLATE: "템플릿",
};
