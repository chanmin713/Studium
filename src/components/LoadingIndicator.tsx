import React, { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  FileText,
  Clock,
  Timer,
  Info,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// 로딩 인디케이터 컴포넌트 속성 정의
interface LoadingIndicatorProps {
  // 공통 속성
  type: "search" | "exam";
  message: string;
  error?: string;

  // 시험지 생성 관련 속성
  progress?: number;
  status?: "pending" | "processing" | "completed" | "failed";
  startTime?: number;
  estimatedSecondsLeft?: number;
  elapsedTimeSeconds?: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  type,
  message,
  error,
  progress = 0,
  status = "processing",
  startTime,
  estimatedSecondsLeft,
  elapsedTimeSeconds: initialElapsedTime,
}) => {
  // 내부 상태
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime || 0);
  const [searchProgress, setSearchProgress] = useState(10); // 검색 진행률 시각화용

  // 컴포넌트 마운트 시간 계산
  const [mountTime] = useState<number>(startTime || Date.now());

  // 경과 시간 자동 업데이트
  useEffect(() => {
    if (error) return;

    // 초기값 설정
    if (initialElapsedTime !== undefined) {
      setElapsedTime(initialElapsedTime);
    } else if (startTime) {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    } else {
      setElapsedTime(Math.floor((Date.now() - mountTime) / 1000));
    }

    // 1초마다 업데이트
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [initialElapsedTime, startTime, mountTime, error]);

  // 검색 진행 상태를 시각적으로 표시하기 위한 효과
  useEffect(() => {
    if (type !== "search" || error) return;

    const timer = setInterval(() => {
      setSearchProgress((prev) => {
        // 시간이 길어지면 진행률 증가 속도 감소
        const increment = Math.max(0.5, 5 / Math.sqrt(prev + 1));
        return prev < 90 ? Math.min(90, prev + increment) : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [type, error]);

  // 시간 형식 변환 함수
  const formatTime = (seconds?: number): string => {
    if (seconds === undefined || seconds < 0) return "계산 중...";

    const minutes = Math.floor(seconds / 60);
    const remainSecs = seconds % 60;

    if (minutes === 0) {
      return `${remainSecs}초`;
    }
    return `${minutes}분 ${remainSecs}초`;
  };

  // 예상 남은 시간 계산
  const remainingTime =
    estimatedSecondsLeft !== undefined
      ? estimatedSecondsLeft
      : Math.max(type === "exam" ? 60 - elapsedTime : 30 - elapsedTime, 5);

  // 현재 표시할 진행률
  const displayProgress = type === "exam" ? progress : searchProgress;

  // 상태에 따른 색상
  const getStatusColor = () => {
    if (error) return "text-red-500 border-red-200 bg-red-50";
    if (status === "completed")
      return "text-green-500 border-green-200 bg-green-50";
    if (status === "failed") return "text-red-500 border-red-200 bg-red-50";
    return "text-blue-500 border-blue-200 bg-blue-50";
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    if (error) {
      return <AlertCircle className="h-8 w-8 text-red-500" />;
    }

    if (type === "search") {
      return <Search className="h-8 w-8 text-blue-500 animate-pulse" />;
    }

    if (type === "exam") {
      if (status === "completed") {
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      }
      return <FileText className="h-8 w-8 text-blue-500 animate-pulse" />;
    }

    return <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />;
  };

  // 상태 텍스트
  const getStatusText = () => {
    if (error) return "오류";

    switch (status) {
      case "pending":
        return "대기 중";
      case "processing":
        return "처리 중";
      case "completed":
        return "완료됨";
      case "failed":
        return "실패";
      default:
        return "처리 중";
    }
  };

  // 제목
  const getTitle = () => {
    if (error) return "오류가 발생했습니다";

    if (type === "search") {
      return "검색 중";
    }

    if (type === "exam") {
      if (status === "completed") return "시험지 생성 완료";
      return "시험지 생성 중";
    }

    return "요청 처리 중";
  };

  // 안내 메시지
  const getInfoMessage = () => {
    if (type === "search") {
      return "검색이 완료되면 결과가 표시됩니다.";
    }

    if (type === "exam") {
      return "시험지 생성이 완료되면 자동으로 다운로드 링크가 생성됩니다.";
    }

    return "요청을 처리하고 있습니다.";
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-6">
      <div className="border border-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
        {/* 헤더 */}
        <div className="p-5 md:p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="mr-4">{renderIcon()}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {getTitle()}
              </h3>
              <p className="text-gray-600 mt-1">{message}</p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor()}`}
            >
              {getStatusText()}
            </div>
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="px-5 md:px-6 py-4 bg-red-50">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-600 font-medium">{error}</p>
                <p className="text-red-500 text-sm mt-1">
                  다시 시도하거나 다른 질문을 입력해주세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 진행 상태 */}
        {!error && (
          <div className="px-5 md:px-6 py-4">
            {/* 진행률 표시 */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 font-medium">
                  {type === "search" ? "검색 진행도" : "시험지 생성 진행도"}
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
            </div>

            {/* 시간 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                <span className="mr-1">경과 시간:</span>
                <span className="font-medium">{formatTime(elapsedTime)}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Timer className="h-4 w-4 mr-2 text-gray-400" />
                <span className="mr-1">예상 남은 시간:</span>
                <span className="font-medium">{formatTime(remainingTime)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;
