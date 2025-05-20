import { errorService } from "./errorService";
import { fileService } from "./fileService";
import { ApiError, ChatResponse, ExamProgressResponse } from "../types/chat";

const API_BASE_URL = "http://52.79.40.102:3049";
const API_TIMEOUT = 30000; // 30초 타임아웃

// 마지막 로그 시간 추적 (중복 로깅 방지)
let lastChatLogTime = 0;
let lastProgressLogTime = 0;

async function handleApiError(response: Response): Promise<never> {
  try {
    const errorData = await response.json();
    const error: ApiError = {
      message: errorData?.message || `서버 응답 오류 (${response.status})`,
      code: errorData?.code,
      details: errorData?.details,
    };
    throw error;
  } catch (e) {
    // JSON 파싱 실패 시 기본 에러 메시지 사용
    const error: ApiError = {
      message: `서버 응답 오류 (${response.status})`,
      code: "UNKNOWN_ERROR",
      details: e instanceof Error ? e.message : String(e),
    };
    throw error;
  }
}

/**
 * 타임아웃이 있는 fetch 요청을 수행합니다.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "서버 연결 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
      );
    }
    throw error;
  }
}

/**
 * 채팅 API를 호출하여 검색 결과 또는 시험지 생성 결과를 가져옵니다.
 * @param query 사용자가 입력한 질문 또는 명령
 * @returns API 응답 (검색 결과 또는 시험지 다운로드 URL)
 */
export async function sendChatQuery(query: string): Promise<ChatResponse> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      },
      API_TIMEOUT
    );

    if (!response.ok) {
      await handleApiError(response);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/pdf")) {
      const requestId = response.headers.get("X-Request-ID");
      if (!requestId) {
        throw new Error("요청 ID가 없습니다");
      }
      return {
        type: "exam",
        requestId,
        downloadUrl: URL.createObjectURL(await response.blob()),
      };
    }

    const data = await response.json();
    return data as ChatResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("시간이 초과")) {
        throw new Error(
          "서버 연결 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
        );
      }
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요."
        );
      }
    }
    console.error("채팅 요청 실패:", error);
    throw error;
  }
}

/**
 * 시험지 생성 진행 상태를 조회합니다.
 * @param requestId 시험지 생성 요청 ID
 * @returns 진행 상태 정보
 */
export async function checkExamProgress(
  requestId: string
): Promise<ExamProgressResponse> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/exam/progress/${requestId}`,
      {},
      API_TIMEOUT
    );
    if (!response.ok) {
      await handleApiError(response);
    }
    const data = await response.json();
    return data as ExamProgressResponse;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("시간이 초과")) {
        throw new Error(
          "서버 연결 시간이 초과되었습니다. 잠시 후 다시 시도해주세요."
        );
      }
      if (error.message.includes("Failed to fetch")) {
        throw new Error(
          "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요."
        );
      }
    }
    console.error("시험 진행 상태 확인 실패:", error);
    throw error;
  }
}

/**
 * 시험지 파일을 다운로드합니다.
 * @param url 다운로드 URL
 */
export const downloadExamFile = async (url: string): Promise<void> => {
  try {
    console.log(`[API] 파일 다운로드 시작: ${url.substring(0, 30)}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();

    // Blob URL 생성
    const blobUrl = window.URL.createObjectURL(blob);

    // 다운로드 링크 생성 및 클릭
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "시험지.pdf"; // 다운로드될 파일 이름
    document.body.appendChild(link);
    link.click();

    // 정리
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    console.log(`[API] 파일 다운로드 완료`);
  } catch (error) {
    console.error("[API] 파일 다운로드 오류:", error);
    throw error;
  }
};

export async function downloadExam(requestId: string): Promise<Blob> {
  try {
    const response = await fetch(`${API_BASE_URL}/exam/download/${requestId}`);
    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.blob();
  } catch (error) {
    console.error("시험지 다운로드 실패:", error);
    throw error;
  }
}
