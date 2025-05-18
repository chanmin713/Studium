import React, { useState, useEffect, useRef } from "react";
import ChatInput from "../components/ChatInput";
import {
  MessageCircle,
  Download,
  FileText,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ExamDownload from "../components/ExamDownload";
import {
  ResultItem,
  ChatResponse,
  SearchResponse,
  ExamResponse,
  ExamProgressResponse,
  ChatMessage,
  ProgressResponse,
} from "../types";
import {
  sendChatQuery,
  downloadExamFile,
  checkExamProgress,
} from "../services/api";
import LoadingIndicator from "../components/LoadingIndicator";

interface ChatPageProps {
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }>;
  onSendMessage: (text: string) => void;
}

interface ExamDownloadResponse {
  type: "exam_download";
  examDownloadUrl: string;
  requestId?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ messages, onSendMessage }) => {
  const [orbiResults, setOrbiResults] = useState<ResultItem[] | null>(null);
  const [sumanwhiResults, setSumanwhiResults] = useState<ResultItem[] | null>(
    null
  );
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [examDownloadUrl, setExamDownloadUrl] = useState<string | null>(null);
  const [examProgress, setExamProgress] = useState<
    | (ProgressResponse & {
        requestId: string;
        status: "pending" | "processing" | "completed" | "failed";
      })
    | null
  >(null);
  const navigate = useNavigate();
  const pollingIntervalRef = useRef<number | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  const handleSendMessage = async (text: string) => {
    // 중복 요청 방지를 위한 체크
    if (loading) {
      console.log("[ChatPage] 이미 로딩 중이므로 요청을 무시합니다");
      return;
    }

    // 로컬 메시지에 이미 같은 텍스트가 있는지 체크
    if (localMessages.some((msg) => msg.text === text && msg.isUser)) {
      console.log("[ChatPage] 이미 처리된 메시지입니다:", text);
      return;
    }

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
      type: "text",
    };

    // 메시지 목록에 사용자 메시지 추가
    setLocalMessages((prev) => [...prev, userMessage]);

    // 사용자 메시지만 상위 컴포넌트로 전달하여 URL에 반영되도록 함
    onSendMessage(userMessage.text);

    // 검색 시작 시 시스템 메시지 추가 - URL에 추가하지 않음
    const searchMessage = "검색 중입니다...";
    addSystemMessage(searchMessage, "text");
    setLoadingMessage(searchMessage); // 명시적으로 검색 메시지 설정
    setExamProgress(null); // 시험지 생성 진행 상태 초기화

    // API 호출
    await fetchResults(text);

    // URL 업데이트는 성공적인 API 호출 후에만 수행
    navigate(`/search/${encodeURIComponent(text)}`);
  };

  // 시스템 메시지 추가 함수 - 내부 상태로만 관리하고 URL에는 반영하지 않음
  const addSystemMessage = (
    text: string,
    type: ChatMessage["type"] = "text",
    additionalProps: Partial<ChatMessage> = {}
  ) => {
    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: new Date(),
      type,
      ...additionalProps,
    };
    // 시스템 메시지는 URL에 반영하지 않도록 onSendMessage 호출 제거
    setLocalMessages((prev) => [...prev, systemMessage]);
  };

  const fetchResults = async (text: string) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (loading) {
      console.log("[ChatPage] 이미 로딩 중이므로 새 요청을 무시합니다.");
      return;
    }

    setLoading(true);
    setLoadingStartTime(Date.now());
    setError(null);
    setOrbiResults(null);
    setSumanwhiResults(null);
    setKeywords([]);
    setExamDownloadUrl(null);
    setExamProgress(null);

    // 기본 검색 로딩 메시지 설정 (타입 명확하게 구분)
    setLoadingMessage("검색 중입니다...");

    try {
      const data = await sendChatQuery(text);

      // API 응답 유형에 따라 다른 처리
      if (data.type === "search") {
        // 검색 결과 처리
        handleSearchResponse(data as SearchResponse);
      } else if (data.type === "exam") {
        // 시험지 생성 완료 처리
        handleExamComplete(data as ExamResponse);
      } else if (data.type === "exam_progress") {
        // 시험지 생성 시작 처리
        handleExamProgress(data as ExamProgressResponse);
      } else if (data.type === "exam_download") {
        // 시험지 다운로드 처리
        handleExamDownload(data as ExamDownloadResponse);
        return; // 다운로드 처리 후 명시적으로 종료
      }
    } catch (e: unknown) {
      // 오류 처리
      console.error("Error:", e);
      const errorMessage = e instanceof Error ? e.message : "알 수 없는 오류";
      setError(errorMessage);
      addSystemMessage(`오류가 발생했습니다: ${errorMessage}`);
      setLoading(false);
    }
  };

  // API 응답별 처리 함수 분리
  const handleSearchResponse = (searchData: SearchResponse) => {
    const orbiItems = searchData.orbiResults || [];
    const sumanwhiItems = searchData.sumanwhiResults || [];

    if (orbiItems.length > 0 || sumanwhiItems.length > 0) {
      if (orbiItems.length > 0) setOrbiResults(orbiItems);
      if (sumanwhiItems.length > 0) setSumanwhiResults(sumanwhiItems);
    } else {
      addSystemMessage("검색 결과가 없습니다.");
    }
    setLoading(false);
  };

  const handleExamComplete = (examData: ExamResponse) => {
    setExamDownloadUrl(examData.downloadUrl);
    addSystemMessage("시험지가 생성되었습니다.", "file", {
      downloadUrl: examData.downloadUrl,
      fileName: "시험지.pdf",
    });
    setLoading(false);
  };

  const handleExamProgress = (progressData: ExamProgressResponse) => {
    // exam_progress 타입일 때 로딩 메시지 업데이트
    const examMessage = progressData.message || "시험지 생성을 시작합니다...";
    setLoadingMessage(examMessage);

    // API 응답값을 활용하여 examProgress 상태 설정
    const now = Date.now();
    setExamProgress({
      requestId: progressData.requestId,
      progress: 0,
      message: examMessage,
      status: "processing",
      estimatedSecondsLeft: 60, // 초기 예상 시간
      elapsedTimeSeconds: 0,
      startTime: now,
    });

    addSystemMessage(examMessage, "progress", {
      requestId: progressData.requestId,
      progress: 0,
    });

    // 진행 상태 폴링 시작
    startProgressPolling(progressData.requestId);
  };

  const handleExamDownload = (examData: ExamDownloadResponse) => {
    console.log("[ChatPage] PDF 다운로드 URL 처리:", examData.examDownloadUrl);

    setLocalMessages((prev: ChatMessage[]) =>
      prev.map((msg: ChatMessage) => {
        if (msg.type === "progress" && msg.requestId === examData.requestId) {
          return {
            ...msg,
            type: "pdf",
            text: "PDF 파일이 준비되었습니다.",
            downloadUrl: examData.examDownloadUrl,
            fileName: "시험지.pdf",
          };
        }
        return msg;
      })
    );

    // 메시지가 없으면 추가
    if (!localMessages.some((msg) => msg.type === "pdf")) {
      addSystemMessage("PDF 파일이 준비되었습니다.", "pdf", {
        downloadUrl: examData.examDownloadUrl,
        fileName: "시험지.pdf",
      });
    }

    setExamDownloadUrl(examData.examDownloadUrl);
    setLoading(false);
  };

  // 시험지 생성 진행 상태 폴링
  const startProgressPolling = (requestId: string) => {
    // 기존 인터벌 정리
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // 마지막 API 호출 시간을 추적하여 중복 호출 방지
    let lastApiCallTime = 0;

    const checkProgress = async () => {
      // 호출 간격 제한 (최소 1.5초)
      const now = Date.now();
      if (now - lastApiCallTime < 1500) {
        return; // 1.5초 이내 재호출 방지
      }

      lastApiCallTime = now;

      try {
        // API 서비스 함수 사용
        const data = await checkExamProgress(requestId);

        // API 응답 로깅
        console.log("[ChatPage] 진행 상태 응답:", {
          progress: data.progress,
          message: data.message,
          status: data.status,
          estimatedSecondsLeft: data.estimatedSecondsLeft,
          elapsedTimeSeconds: data.elapsedTimeSeconds,
        });

        // 로딩 메시지 업데이트 - API에서 제공한 메시지 그대로 사용
        if (data.message) {
          setLoadingMessage(data.message);
        }

        // 진행 상태 업데이트 - API에서 제공하는 값을 그대로 사용
        setExamProgress((prev) => {
          if (!prev) return null;

          return {
            ...prev,
            // API에서 제공하는 값 그대로 사용
            progress:
              data.progress !== undefined ? data.progress : prev.progress,
            message: data.message || prev.message,
            status: data.status || prev.status,
            estimatedSecondsLeft: data.estimatedSecondsLeft,
            elapsedTimeSeconds: data.elapsedTimeSeconds,
            startTime: data.startTime || prev.startTime,
          };
        });

        // 메시지 업데이트
        setLocalMessages((prev) =>
          prev.map((msg) => {
            if (msg.type === "progress" && msg.requestId === requestId) {
              return {
                ...msg,
                // API에서 제공하는 값 그대로 사용
                progress:
                  data.progress !== undefined ? data.progress : msg.progress,
                text: data.message || msg.text,
              };
            }
            return msg;
          })
        );

        // 완료된 경우
        if (data.status === "completed" && data.downloadUrl) {
          if (pollingIntervalRef.current !== null) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setExamDownloadUrl(data.downloadUrl);
          setExamProgress(null);
          setLoading(false);
        }

        // 실패한 경우
        if (data.status === "failed") {
          if (pollingIntervalRef.current !== null) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setError(data.error || "시험지 생성에 실패했습니다.");
          setExamProgress(null);
          setLoading(false);
        }
      } catch (error: any) {
        console.error(
          "진행 상태 폴링 오류:",
          error.message || "알 수 없는 오류"
        );
        // 오류 메시지 설정
        setError(error.message || "진행 상태 조회 실패");
        // 폴링 중단
        if (pollingIntervalRef.current !== null) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setLoading(false);
      }
    };

    // 2초마다 진행 상태 확인
    pollingIntervalRef.current = window.setInterval(checkProgress, 2000);

    // 초기 상태 바로 확인
    checkProgress();
  };

  const handleDownloadExam = () => {
    if (examDownloadUrl) {
      downloadExamFile(examDownloadUrl);
    }
  };

  // 컴포넌트 마운트 시 로직 개선
  React.useEffect(() => {
    // 최초 로드 시에만 실행되는 로직
    const processInitialMessage = () => {
      // 이미 로딩 중이거나 결과가 있으면 무시
      if (loading || hasResults) {
        return;
      }

      // 이미 처리된 URL이 있는지 확인
      if (localMessages.length > 0) {
        console.log("[ChatPage] 이미 메시지가 있어 초기 요청을 무시합니다");
        return;
      }

      // URL에서 가져온 메시지가 있으면 처리
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.isUser) {
          console.log(
            "[ChatPage] 최초 로드 시 URL에서 가져온 메시지 처리:",
            lastMessage.text
          );

          // 메시지 목록에 사용자 메시지 추가
          const userMessage: ChatMessage = {
            id: Date.now().toString(),
            text: lastMessage.text,
            isUser: true,
            timestamp: new Date(),
            type: "text",
          };
          setLocalMessages([userMessage]);

          // 검색 시작
          const searchMessage = "검색 중입니다...";
          addSystemMessage(searchMessage, "text");
          setLoadingMessage(searchMessage);
          setExamProgress(null);
          fetchResults(lastMessage.text);
        }
      }
    };

    // 컴포넌트 마운트 후 한 번만 실행
    processInitialMessage();

    // useEffect 의존성 배열에 의존성을 추가하지 않음 (최초 1회만 실행)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 컴포넌트 언마운트 시 폴링 정리 및 타임아웃 함수 생성
  useEffect(() => {
    // 타임아웃 - 2분 이상 로딩되면 자동 중단
    let loadingTimeout: number | null = null;

    if (loading && examProgress) {
      loadingTimeout = window.setTimeout(() => {
        if (loading && examProgress) {
          console.log("[ChatPage] 로딩 타임아웃 - 2분 경과");
          // 폴링 중단
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          // 오류 메시지 설정
          setError("시험지 생성 시간이 너무 오래 걸립니다. 다시 시도해주세요.");
          setLoading(false);
        }
      }, 120000); // 2분 타임아웃
    }

    return () => {
      // 폴링 인터벌 정리
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // 타임아웃 정리
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loading, examProgress]);

  // 결과 카드 렌더링 함수
  const renderResults = () => {
    // 헤더 영역 공통 렌더링 함수 - URL에 저장된 사용자 쿼리 표시
    const renderHeader = () => {
      // URL에서 가져온 사용자 메시지 (첫 번째 메시지)
      const userQuery = messages.length > 0 ? messages[0].text : "";

      return (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 w-full px-3 md:px-4 pt-3 pb-3 transition-all duration-200">
          <div className="max-w-4xl mx-auto">
            <span className="text-xl md:text-2xl font-medium text-gray-900 block text-left flex items-center gap-2 md:gap-3 font-sans">
              <MessageCircle
                size={22}
                className="text-gray-700 flex-shrink-0 hidden sm:block"
              />
              <MessageCircle
                size={18}
                className="text-gray-700 flex-shrink-0 sm:hidden"
              />
              <span className="line-clamp-2 md:line-clamp-1">{userQuery}</span>
            </span>
          </div>
        </div>
      );
    };

    if (error) {
      return (
        <div className="w-full">
          {renderHeader()}
          <div className="pt-4 mb-2"></div>
          <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-6">
            <div className="border border-gray-200 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center text-red-500">
                <AlertCircle className="w-8 h-8 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    오류가 발생했습니다
                  </h3>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (examProgress) {
      return (
        <div className="w-full">
          {renderHeader()}
          <div className="pt-4 mb-2"></div>
          <LoadingIndicator
            type="exam"
            message={
              examProgress.message ||
              loadingMessage ||
              "시험지를 생성하고 있습니다..."
            }
            progress={examProgress.progress || 0}
            status={examProgress.status}
            estimatedSecondsLeft={examProgress.estimatedSecondsLeft}
            elapsedTimeSeconds={examProgress.elapsedTimeSeconds}
            startTime={examProgress.startTime}
            error={error || undefined}
          />
        </div>
      );
    }

    if (examDownloadUrl) {
      return (
        <div className="w-full">
          {renderHeader()}
          <div className="pt-4 mb-2"></div>
          <ExamDownload onDownload={() => downloadExamFile(examDownloadUrl)} />
        </div>
      );
    }

    if (!(orbiResults || sumanwhiResults)) {
      return null;
    }

    const mergedResults = [
      ...(orbiResults || []),
      ...(sumanwhiResults || []),
    ].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    if (mergedResults.length === 0) {
      return (
        <div className="w-full">
          {renderHeader()}
          <div className="pt-4 mb-2"></div>
          <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-6">
            <div className="border border-gray-200 bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center text-gray-500">
                <AlertCircle className="w-8 h-8 mr-4" />
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    검색 결과가 없습니다
                  </h3>
                  <p>다른 검색어로 시도해보세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        {renderHeader()}
        <div className="pt-4 mb-2"></div>
        <div className="grid grid-cols-1 gap-4 md:gap-6 w-full max-w-4xl mx-auto px-3 md:px-4">
          {mergedResults.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gray-200 bg-white rounded-lg p-4 md:p-5 hover:shadow-md transition-all group h-full w-full mx-auto font-sans"
            >
              <div className="flex flex-col mb-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    {item.source === "orbi" ? (
                      <img
                        src="/orbi.png"
                        alt="Orbi"
                        className="h-4 w-auto mr-2"
                      />
                    ) : (
                      <img
                        src="/sumanwhi.png"
                        alt="Sumanwhi"
                        className="h-5 w-auto mr-2"
                      />
                    )}
                    <span className="font-semibold text-base text-gray-900 group-hover:text-blue-500 transition font-sans">
                      <span className="line-clamp-1">{item.title}</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{item.timestamp}</div>
                </div>
              </div>
              <div className="text-sm text-gray-700 mb-3 line-clamp-2 font-sans">
                {item.content}
              </div>
              <div className="flex gap-4 text-xs text-gray-500 font-sans">
                <span>댓글 {item.commentCount || 0}</span>
                <span>관련도 {item.relevanceScore || 0}</span>
              </div>
            </a>
          ))}
        </div>
        <div className="h-24"></div>
      </div>
    );
  };

  // 결과가 있는지 여부
  const hasResults = Boolean(
    (orbiResults && orbiResults.length > 0) ||
      (sumanwhiResults && sumanwhiResults.length > 0) ||
      examDownloadUrl ||
      examProgress
  );

  // 로딩 컴포넌트에 전달할 props 계산 함수 수정
  const getLoadingIndicatorProps = () => {
    // API 응답 타입에 따라 다른 타입의 로딩 표시
    const loadingType = examProgress ? "exam" : "search";

    // 검색인 경우와 시험지 생성인 경우 구분
    if (loadingType === "exam") {
      return {
        type: "exam" as const,
        message: examProgress?.message || "시험지를 생성하고 있습니다...",
        progress: examProgress?.progress || 0,
        status: examProgress?.status || "processing",
        estimatedSecondsLeft: examProgress?.estimatedSecondsLeft,
        elapsedTimeSeconds: examProgress?.elapsedTimeSeconds,
        startTime: examProgress?.startTime,
        error: error || undefined,
      };
    } else {
      return {
        type: "search" as const,
        message: loadingMessage || "검색 중입니다...",
        progress: 0, // 검색에서는 진행률 표시 안함
        status: "processing" as const, // 명시적으로 타입 지정
        estimatedSecondsLeft: undefined,
        elapsedTimeSeconds: loadingStartTime
          ? Math.floor((Date.now() - loadingStartTime) / 1000)
          : 0,
        startTime: loadingStartTime || undefined,
        error: error || undefined,
      };
    }
  };

  return (
    <div className="bg-white min-h-screen w-full flex flex-col">
      {loading ? (
        <div className="w-full">
          {messages.length > 0 && (
            <>
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 w-full px-3 md:px-4 pt-3 pb-3 transition-all duration-200">
                <div className="max-w-4xl mx-auto">
                  <span className="text-xl md:text-2xl font-medium text-gray-900 block text-left flex items-center gap-2 md:gap-3 font-sans">
                    <MessageCircle
                      size={22}
                      className="text-gray-700 flex-shrink-0 hidden sm:block"
                    />
                    <MessageCircle
                      size={18}
                      className="text-gray-700 flex-shrink-0 sm:hidden"
                    />
                    <span className="line-clamp-2 md:line-clamp-1">
                      {messages[0]?.text || ""}
                    </span>
                  </span>
                </div>
              </div>
              <div className="pt-4 mb-2"></div>
            </>
          )}

          <LoadingIndicator {...getLoadingIndicatorProps()} />
        </div>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-start w-full h-full z-10 relative">
          <div className="w-full flex-1 overflow-y-auto scroll-smooth">
            <div className="w-full flex flex-col items-center justify-start">
              {renderResults()}
            </div>
          </div>
          <div className="w-full bg-gray-50/95 backdrop-blur-sm py-2 md:py-3 sticky bottom-0 z-10 transition-all duration-300 border-t border-gray-100">
            <div className="max-w-4xl mx-auto px-2 md:px-4">
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default ChatPage;
