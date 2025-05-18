import { ChatMessage, ExamProgressResponse } from "../types";
import { sendChatQuery, checkExamProgress } from "./api";
import { v4 as uuidv4 } from "uuid";

/**
 * 채팅 메시지 상태를 관리하는 서비스
 */
export class ChatService {
  private messages: ChatMessage[] = [];
  private listeners: Array<(messages: ChatMessage[]) => void> = [];
  private progressIntervals: Record<string, number> = {}; // 진행률 폴링 인터벌 ID 저장

  /**
   * 메시지 변경 알림을 받을 리스너 등록
   * @param listener 메시지 변경 시 호출될 콜백 함수
   * @returns 리스너 해제 함수
   */
  subscribe(listener: (messages: ChatMessage[]) => void) {
    this.listeners.push(listener);
    listener([...this.messages]); // 초기 상태 전달

    // 리스너 해제 함수 반환
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 리스너들에게 메시지 변경 사항 알림
   */
  private notifyListeners() {
    const messagesCopy = [...this.messages];
    this.listeners.forEach((listener) => listener(messagesCopy));
  }

  /**
   * 사용자 메시지 추가 및 API 요청 처리
   * @param text 사용자가 입력한 메시지
   */
  async sendMessage(text: string) {
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: uuidv4(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    this.messages.push(userMessage);
    this.notifyListeners();

    try {
      // API 응답 처리
      const response = await sendChatQuery(text);

      let responseMessage: ChatMessage;

      if (response.type === "search") {
        // 검색 결과인 경우
        responseMessage = {
          id: uuidv4(),
          text: "검색 결과를 찾았습니다.",
          isUser: false,
          timestamp: new Date(),
          type: "text",
        };

        this.messages.push(responseMessage);
        this.notifyListeners();
      } else if (response.type === "exam") {
        // 시험지 생성 완료인 경우
        responseMessage = {
          id: uuidv4(),
          text: "시험지가 생성되었습니다.",
          isUser: false,
          timestamp: new Date(),
          type: "file",
          downloadUrl: response.downloadUrl,
        };

        this.messages.push(responseMessage);
        this.notifyListeners();
      } else if (response.type === "exam_progress") {
        // 시험지 생성 진행 중인 경우
        const progressMessageId = uuidv4();

        // 진행 상태 메시지 추가
        responseMessage = {
          id: progressMessageId,
          text: response.message || "시험지를 생성 중입니다...",
          isUser: false,
          timestamp: new Date(),
          type: "progress",
          requestId: response.requestId,
          progress: 0, // 초기 진행률 0%
        };

        this.messages.push(responseMessage);
        this.notifyListeners();

        // 진행 상태 폴링 시작
        this.startProgressPolling(progressMessageId, response.requestId);
      } else if (response.type === "exam_download") {
        // PDF 파일 다운로드 응답인 경우
        responseMessage = {
          id: uuidv4(),
          text: "PDF 파일이 준비되었습니다.",
          isUser: false,
          timestamp: new Date(),
          type: "pdf",
          downloadUrl: response.examDownloadUrl,
          fileName: "시험지.pdf",
        };

        this.messages.push(responseMessage);
        this.notifyListeners();
      }

      return response;
    } catch (error: any) {
      // 오류 메시지 추가
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        text: `오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`,
        isUser: false,
        timestamp: new Date(),
      };

      this.messages.push(errorMessage);
      this.notifyListeners();

      throw error;
    }
  }

  /**
   * 시험지 생성 진행 상태 폴링 시작
   * @param messageId 진행률 표시할 메시지 ID
   * @param requestId 시험지 생성 요청 ID
   */
  private startProgressPolling(messageId: string, requestId: string) {
    // 이미 실행 중인 폴링이 있으면 중지
    if (this.progressIntervals[messageId]) {
      clearInterval(this.progressIntervals[messageId]);
    }

    // 1초마다 진행 상태 확인
    this.progressIntervals[messageId] = window.setInterval(async () => {
      try {
        const progressData = await checkExamProgress(requestId);

        // 메시지 찾기
        const messageIndex = this.messages.findIndex(
          (msg) => msg.id === messageId
        );
        if (messageIndex === -1) {
          // 메시지가 없으면 폴링 중지
          this.stopProgressPolling(messageId);
          return;
        }

        // 메시지 업데이트
        this.messages[messageIndex] = {
          ...this.messages[messageIndex],
          progress: progressData.progress,
          text: progressData.message || this.messages[messageIndex].text,
        };

        // 완료된 경우
        if (progressData.status === "completed" && progressData.downloadUrl) {
          // 폴링 중지
          this.stopProgressPolling(messageId);

          // 진행 메시지를 완료 메시지로 변경
          this.messages[messageIndex] = {
            ...this.messages[messageIndex],
            type: "file",
            text: "시험지가 생성되었습니다.",
            progress: 100,
            downloadUrl: progressData.downloadUrl,
          };
        }

        // 실패한 경우
        if (progressData.status === "failed") {
          // 폴링 중지
          this.stopProgressPolling(messageId);

          // 진행 메시지를 오류 메시지로 변경
          this.messages[messageIndex] = {
            ...this.messages[messageIndex],
            type: "text",
            text: `시험지 생성에 실패했습니다: ${
              progressData.error || "알 수 없는 오류"
            }`,
          };
        }

        this.notifyListeners();
      } catch (error) {
        console.error("진행 상태 조회 오류:", error);
      }
    }, 1000); // 1초 간격으로 폴링
  }

  /**
   * 진행 상태 폴링 중지
   * @param messageId 메시지 ID
   */
  private stopProgressPolling(messageId: string) {
    if (this.progressIntervals[messageId]) {
      clearInterval(this.progressIntervals[messageId]);
      delete this.progressIntervals[messageId];
    }
  }

  /**
   * 모든 메시지 가져오기
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * 모든 메시지 초기화
   */
  clearMessages() {
    // 모든 폴링 중지
    Object.keys(this.progressIntervals).forEach((id) => {
      clearInterval(this.progressIntervals[id]);
    });
    this.progressIntervals = {};

    this.messages = [];
    this.notifyListeners();
  }

  /**
   * 서비스 정리 (컴포넌트 언마운트 등에서 호출)
   */
  dispose() {
    // 모든 폴링 중지
    Object.keys(this.progressIntervals).forEach((id) => {
      clearInterval(this.progressIntervals[id]);
    });
    this.progressIntervals = {};

    // 리스너 제거
    this.listeners = [];
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const chatService = new ChatService();
