// 검색 결과 아이템
export interface ResultItem {
  title: string;
  url: string;
  content: string;
  timestamp: string;
  commentCount?: number;
  relevanceScore?: number;
  source?: string;
}

// 채팅 API 응답 - 검색 결과 타입
export interface SearchResponse {
  type: "search";
  requestId: string;
  keywords: string[];
  orbiResults: ResultItem[];
  sumanwhiResults: ResultItem[];
}

// 채팅 API 응답 - 시험지 생성 진행 중 타입
export interface ExamProgressResponse {
  type: "exam_progress";
  requestId: string;
  message: string;
}

// 채팅 API 응답 - 시험지 생성 타입
export interface ExamResponse {
  type: "exam";
  downloadUrl: string;
}

// 시험지 생성 진행 상태 응답
export interface ProgressResponse {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100 사이의 진행률
  message: string;
  downloadUrl?: string; // 완료된 경우에만 존재
  error?: string; // 실패한 경우에만 존재
  estimatedSecondsLeft?: number; // 남은 예상 시간(초)
  elapsedTimeSeconds?: number; // 경과 시간(초)
  startTime?: number; // 작업 시작 시간 (timestamp)
}

// 통합 API 응답 타입
export type ChatResponse =
  | {
      type: "search";
      requestId: string;
      keywords: string[];
      orbiResults: ResultItem[];
      sumanwhiResults: ResultItem[];
    }
  | {
      type: "exam";
      downloadUrl: string;
    }
  | {
      type: "exam_progress";
      requestId: string;
      message: string;
    }
  | {
      type: "exam_download";
      examDownloadUrl: string;
    };

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: "text" | "file" | "progress" | "pdf";
  downloadUrl?: string;
  requestId?: string;
  progress?: number;
  fileName?: string;
}
