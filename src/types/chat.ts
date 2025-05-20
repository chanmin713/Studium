import { ResultItem } from "./search";

export type ExamStatus = "processing" | "completed" | "failed";

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ProgressUpdate {
  requestId: string;
  status: ExamStatus;
  progress: number;
  message?: string;
  downloadUrl?: string;
}

/**
 * 채팅 메시지 타입
 */
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type: "text" | "progress" | "file" | "pdf";
  progress?: number;
  requestId?: string;
  downloadUrl?: string;
  fileName?: string;
}

/**
 * 채팅 응답 타입
 */
export type ChatResponse =
  | SearchResponse
  | ExamResponse
  | ExamProgressResponse
  | ExamDownloadResponse;

/**
 * 검색 응답 타입
 */
export interface SearchResponse {
  type: "search";
  requestId: string;
  keywords: string[];
  orbiResults: ResultItem[];
  sumanwhiResults: ResultItem[];
}

/**
 * 시험지 생성 응답 타입
 */
export interface ExamResponse {
  type: "exam";
  requestId: string;
  downloadUrl: string;
}

/**
 * 시험지 생성 진행 상태 응답 타입
 */
export interface ExamProgressResponse {
  type: "exam";
  requestId: string;
  status: ExamStatus;
  progress: number;
  message?: string;
  downloadUrl?: string;
}

/**
 * 시험지 다운로드 응답 타입
 */
export interface ExamDownloadResponse {
  type: "exam_download";
  examDownloadUrl: string;
  requestId?: string;
}
