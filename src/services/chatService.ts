import { errorService } from "./errorService";
import {
  ChatMessage,
  ChatResponse,
  ExamProgressResponse,
  ExamResponse,
  ExamStatus,
  ProgressUpdate,
} from "../types/chat";
import { ResultItem } from "../types/search";
import { sendChatQuery, checkExamProgress, downloadExam } from "./api";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace NodeJS {
    interface Timeout {}
  }
}

export interface ExamProgress {
  type: "exam";
  requestId: string;
  status: ExamStatus;
  progress: number;
  message?: string;
  downloadUrl?: string;
  error?: string;
}

export interface ChatServiceState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  searchResults: {
    orbiResults: ResultItem[] | null;
    sumanwhiResults: ResultItem[] | null;
  } | null;
  examProgress: Record<string, ExamProgress>;
}

/**
 * 채팅 메시지 상태를 관리하는 서비스
 */
export class ChatService {
  private state: ChatServiceState = {
    messages: [],
    isLoading: false,
    error: null,
    searchResults: null,
    examProgress: {},
  };

  private subscribers: ((state: ChatServiceState) => void)[] = [];
  private progressCheckIntervals: Record<string, number> = {};

  /**
   * 메시지 변경 알림을 받을 리스너 등록
   * @param callback 메시지 변경 시 호출될 콜백 함수
   * @returns 리스너 해제 함수
   */
  public subscribeToState(callback: (state: ChatServiceState) => void) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifyStateChange() {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  private setState(newState: Partial<ChatServiceState>) {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  /**
   * 사용자 메시지 추가 및 API 요청 처리
   * @param text 사용자가 입력한 메시지
   */
  public async sendMessage(text: string): Promise<ChatResponse> {
    try {
      this.setLoading(true);
      this.setError(null);

      // 사용자 메시지 추가
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text,
        isUser: true,
        timestamp: new Date(),
        type: "text",
      };
      this.addMessage(userMessage);

      // API 요청
      const response = await sendChatQuery(text);
      return response;
    } catch (error) {
      console.error("[ChatService] 메시지 전송 실패:", error);
      this.setError("메시지 전송에 실패했습니다. 다시 시도해주세요.");
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  private initializeExamProgress(requestId: string) {
    this.setState({
      examProgress: {
        ...this.state.examProgress,
        [requestId]: {
          type: "exam",
          requestId,
          status: "processing",
          progress: 0,
          message: "시험지를 생성하고 있습니다...",
        },
      },
    });
  }

  private handleProgressCompletion(
    requestId: string,
    response: ExamProgressResponse
  ) {
    this.setState({
      examProgress: {
        ...this.state.examProgress,
        [requestId]: {
          type: "exam",
          requestId,
          status: "completed",
          progress: 100,
          downloadUrl: response.downloadUrl,
          message: "시험지가 생성되었습니다.",
        },
      },
    });
    this.stopProgressCheck(requestId);
  }

  private handleProgressFailure(requestId: string) {
    this.setState({
      examProgress: {
        ...this.state.examProgress,
        [requestId]: {
          type: "exam",
          requestId,
          status: "failed",
          progress: 0,
          message: "시험지 생성에 실패했습니다.",
        },
      },
    });
    this.stopProgressCheck(requestId);
  }

  private handleProgressUpdate(
    requestId: string,
    response: ExamProgressResponse
  ) {
    this.setState({
      examProgress: {
        ...this.state.examProgress,
        [requestId]: {
          type: "exam",
          requestId,
          status: "processing",
          progress: response.progress || 0,
          message:
            response.message || `시험지 생성 중... (${response.progress}%)`,
        },
      },
    });
  }

  private handleProgressError(requestId: string, error: unknown) {
    console.error("진행 상태 확인 실패:", error);
    this.setState({
      examProgress: {
        ...this.state.examProgress,
        [requestId]: {
          type: "exam",
          requestId,
          status: "failed",
          progress: 0,
          message: "진행 상태 확인에 실패했습니다.",
          error:
            error instanceof Error
              ? error.message
              : "알 수 없는 오류가 발생했습니다",
        },
      },
    });
    this.stopProgressCheck(requestId);
  }

  private stopProgressCheck(requestId: string) {
    if (this.progressCheckIntervals[requestId]) {
      clearInterval(this.progressCheckIntervals[requestId]);
      delete this.progressCheckIntervals[requestId];
    }
  }

  private async startProgressCheck(requestId: string) {
    this.stopProgressCheck(requestId);

    const checkProgress = async () => {
      try {
        const response = await checkExamProgress(requestId);
        switch (response.status) {
          case "completed":
            this.handleProgressCompletion(requestId, response);
            break;
          case "failed":
            this.handleProgressFailure(requestId);
            break;
          case "processing":
            this.handleProgressUpdate(requestId, response);
            break;
        }
      } catch (error) {
        this.handleProgressError(requestId, error);
      }
    };

    await checkProgress();
    this.progressCheckIntervals[requestId] = window.setInterval(
      checkProgress,
      1000
    );
  }

  async downloadExam(requestId: string): Promise<Blob> {
    try {
      return await downloadExam(requestId);
    } catch (error) {
      console.error("시험지 다운로드 실패:", error);
      throw error;
    }
  }

  /**
   * 모든 메시지 가져오기
   */
  public getMessages(): ChatMessage[] {
    return [...this.state.messages];
  }

  public getSearchResults() {
    return this.state.searchResults;
  }

  public getExamProgress(requestId: string) {
    return this.state.examProgress[requestId];
  }

  public isLoading(): boolean {
    return this.state.isLoading;
  }

  public getError(): string | null {
    return this.state.error;
  }

  /**
   * 모든 메시지 초기화
   */
  public clearMessages(): void {
    Object.keys(this.progressCheckIntervals).forEach((id) => {
      clearInterval(this.progressCheckIntervals[id]);
    });
    this.setState({
      messages: [],
      error: null,
      searchResults: null,
    });
  }

  /**
   * 서비스 정리 (컴포넌트 언마운트 등에서 호출)
   */
  public cleanup(): void {
    Object.keys(this.progressCheckIntervals).forEach((id) => {
      clearInterval(this.progressCheckIntervals[id]);
    });
    this.subscribers = [];
  }

  private createUserMessage(text: string): ChatMessage {
    return {
      id: uuidv4(),
      text,
      isUser: true,
      timestamp: new Date(),
      type: "text",
    };
  }

  private createSystemMessage(text: string): ChatMessage {
    return {
      id: uuidv4(),
      text,
      isUser: false,
      timestamp: new Date(),
      type: "text",
    };
  }

  public getState(): ChatServiceState {
    return { ...this.state };
  }

  public getProgressStatus(requestId: string): ExamProgress | undefined {
    return this.state.examProgress[requestId];
  }

  public isProgressComplete(requestId: string): boolean {
    const progress = this.getProgressStatus(requestId);
    return progress?.status === "completed";
  }

  public isProgressFailed(requestId: string): boolean {
    const progress = this.getProgressStatus(requestId);
    return progress?.status === "failed";
  }

  private setLoading(isLoading: boolean) {
    this.setState({ isLoading });
  }

  private setError(error: string | null) {
    this.setState({ error });
  }

  private addMessage(message: ChatMessage) {
    this.setState({
      messages: [...this.state.messages, message],
    });
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const chatService = new ChatService();
