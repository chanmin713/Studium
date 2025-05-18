import { ChatResponse, ProgressResponse } from "../types";

const API_BASE_URL = "http://52.79.40.102:3049";

// 마지막 로그 시간 추적 (중복 로깅 방지)
let lastChatLogTime = 0;
let lastProgressLogTime = 0;

/**
 * 채팅 API를 호출하여 검색 결과 또는 시험지 생성 결과를 가져옵니다.
 * @param query 사용자가 입력한 질문 또는 명령
 * @returns API 응답 (검색 결과 또는 시험지 다운로드 URL)
 */
export const sendChatQuery = async (query: string): Promise<ChatResponse> => {
  // 중복 로깅 방지 (최소 3초 간격으로 로깅)
  const now = Date.now();
  const shouldLog = now - lastChatLogTime > 3000;

  if (shouldLog) {
    console.log(
      `[API] Chat 요청: ${query.substring(0, 50)}${
        query.length > 50 ? "..." : ""
      }`
    );
    lastChatLogTime = now;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (shouldLog) {
      console.log(`[API] Chat 응답 상태: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Content-Type 헤더 확인
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/pdf")) {
      // PDF 파일인 경우 blob으로 반환
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (shouldLog) {
        console.log(`[API] PDF 응답 처리 완료`);
      }

      return {
        type: "exam_download",
        examDownloadUrl: blobUrl,
      };
    }

    // JSON 응답인 경우 파싱
    const data = await response.json();

    if (shouldLog) {
      console.log(`[API] Chat 응답 타입: ${data.type}`);
    }

    return data;
  } catch (error) {
    console.error("[API] Chat 요청 오류:", error);
    throw error;
  }
};

/**
 * 시험지 생성 진행 상태를 조회합니다.
 * @param requestId 시험지 생성 요청 ID
 * @returns 진행 상태 정보
 */
export const checkExamProgress = async (
  requestId: string
): Promise<ProgressResponse> => {
  // 중복 로깅 방지 (최소 3초 간격으로 로깅)
  const now = Date.now();
  const shouldLog = now - lastProgressLogTime > 3000;

  if (shouldLog) {
    console.log(`[API] 진행 상태 조회: ${requestId}`);
    lastProgressLogTime = now;
  }

  const response = await fetch(`${API_BASE_URL}/progress/${requestId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`[API] 진행 상태 조회 실패:`, errorData);
    throw new Error(
      errorData.message || `진행 상태 조회 실패 (${response.status})`
    );
  }

  const data = await response.json();

  if (shouldLog) {
    console.log(
      `[API] 진행 상태: ${data.status || "없음"}, 진행률: ${
        data.progress || 0
      }%`
    );
  }

  return data as ProgressResponse;
};

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
