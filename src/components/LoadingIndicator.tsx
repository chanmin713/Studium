import React, { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

// 로딩 인디케이터 컴포넌트 속성 정의
interface LoadingIndicatorProps {
  type: "search" | "exam";
  message: string;
  error?: string;
  progress?: number;
  status?: "pending" | "processing" | "completed" | "failed";
  onComplete?: () => void;
  userMessage?: string;
  estimatedSecondsLeft?: number;
  elapsedTimeSeconds?: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type,
  message,
  error,
  progress = 0,
  status = "processing",
  onComplete,
  userMessage,
  estimatedSecondsLeft,
  elapsedTimeSeconds,
}) => {
  // 내부 상태
  const [searchProgress, setSearchProgress] = useState(10);

  // 검색 진행 상태를 시각적으로 표시하기 위한 효과
  useEffect(() => {
    if (type !== "search" || error) return;

    const timer = setInterval(() => {
      setSearchProgress((prev) => {
        const increment = Math.max(0.5, 5 / Math.sqrt(prev + 1));
        return prev < 90 ? Math.min(90, prev + increment) : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, error]);

  // 완료 상태 처리
  useEffect(() => {
    if (status === "completed" && onComplete) {
      onComplete();
    }
  }, [status, onComplete]);

  // 현재 표시할 진행률
  const displayProgress = type === "exam" ? progress : searchProgress;

  // 상태에 따른 색상
  const getStatusColor = () => {
    if (error) return "text-red-500 border-red-200 bg-red-50";
    if (status === "completed")
      return "text-green-500 border-green-200 bg-green-50";
    if (status === "failed") return "text-red-500 border-red-200 bg-red-50";
    if (status === "pending")
      return "text-yellow-500 border-yellow-200 bg-yellow-50";
    return "text-blue-500 border-blue-200 bg-blue-50";
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    if (error) return <AlertCircle className="h-8 w-8 text-red-500" />;
    if (type === "search") {
      if (status === "completed")
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      return <Search className="h-8 w-8 text-blue-500 animate-pulse" />;
    }
    if (type === "exam") {
      if (status === "completed")
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      return <FileText className="h-8 w-8 text-blue-500 animate-pulse" />;
    }
    return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
  };

  // 상태 텍스트
  const getStatusText = () => {
    if (error) return "오류 발생";
    switch (status) {
      case "pending":
        return "요청 대기 중";
      case "processing":
        return type === "search" ? "검색 처리 중" : "시험지 생성 중";
      case "completed":
        return type === "search" ? "검색 완료" : "생성 완료";
      case "failed":
        return "처리 실패";
      default:
        return type === "search" ? "검색 처리 중" : "시험지 생성 중";
    }
  };

  // 제목
  const getTitle = () => {
    if (error) return "오류가 발생했습니다";
    if (type === "search") {
      if (status === "completed") return "검색이 완료되었습니다";
      return "검색을 진행하고 있습니다";
    }
    if (type === "exam") {
      if (status === "completed") return "시험지가 생성되었습니다";
      return "시험지를 생성하고 있습니다";
    }
    return "요청을 처리하고 있습니다";
  };

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };

  // 진행 상태 메시지
  const getProgressMessage = () => {
    if (type === "search") {
      if (status === "completed")
        return "검색이 완료되었습니다. 결과를 확인해주세요.";
      let message = "검색 결과를 수집하고 있습니다.";
      if (elapsedTimeSeconds !== undefined) {
        message += ` (경과 시간: ${formatTime(elapsedTimeSeconds)})`;
      }
      return message;
    }
    if (type === "exam") {
      if (status === "completed")
        return "시험지가 생성되었습니다. 다운로드 버튼을 클릭하여 시험지를 받아보세요.";
      let message = "시험지를 생성하고 있습니다.";
      if (estimatedSecondsLeft !== undefined) {
        message += ` 예상 남은 시간: ${formatTime(estimatedSecondsLeft)}`;
      }
      if (elapsedTimeSeconds !== undefined) {
        message += ` (경과 시간: ${formatTime(elapsedTimeSeconds)})`;
      }
      return message;
    }
    return "요청을 처리하고 있습니다. 잠시만 기다려주세요.";
  };

  // 진행률 표시 텍스트
  const getProgressText = () => {
    if (type === "search") {
      let text = status === "completed" ? "검색 완료" : "검색 진행률";
      if (elapsedTimeSeconds !== undefined && status !== "completed") {
        text += ` (${formatTime(elapsedTimeSeconds)} 경과)`;
      }
      return text;
    }
    let text = status === "completed" ? "생성 완료" : "시험지 생성 진행률";
    if (estimatedSecondsLeft !== undefined && status !== "completed") {
      text += ` (예상 ${formatTime(estimatedSecondsLeft)} 남음)`;
    }
    return text;
  };

  // 헤더 렌더링
  const renderHeader = () => (
    <div className="fixed top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 w-full px-3 md:px-4 py-3 transition-all duration-200 shadow-sm">
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
          <span className="line-clamp-2 md:line-clamp-1">{userMessage}</span>
        </span>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {renderHeader()}
      <div className="pt-16 mb-2"></div>
      <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-6">
        <div className="border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-5 md:p-6">
            <div className="flex items-start">
              <div className="mr-4">{renderIcon()}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getTitle()}
                  </h3>
                  <div
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor()}`}
                  >
                    {getStatusText()}
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{getProgressMessage()}</p>
                {/* 진행률 표시 */}
                {status !== "completed" && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-600 font-medium">
                        {getProgressText()}
                      </span>
                      <span className="text-blue-600 font-medium">
                        {Math.round(displayProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          type === "search" ? "bg-blue-400" : "bg-blue-500"
                        }`}
                        style={{ width: `${displayProgress}%` }}
                      />
                    </div>
                    {elapsedTimeSeconds !== undefined && (
                      <p className="text-xs text-gray-500 mt-2">
                        경과 시간: {formatTime(elapsedTimeSeconds)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
