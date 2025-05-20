import React from "react";
import { AlertCircle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";

interface ErrorDisplayProps {
  error: string;
  userMessage?: string;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  userMessage,
  onRetry,
}) => {
  const navigate = useNavigate();

  const handleRetry = async () => {
    if (!userMessage) return;

    try {
      await chatService.sendMessage(userMessage);
      navigate(`/search/${encodeURIComponent(userMessage)}`);
    } catch (err) {
      console.error("[ErrorDisplay] 재시도 실패:", err);
    }
  };

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
              <AlertCircle className="h-8 w-8 text-red-500 mr-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    오류가 발생했습니다
                  </h3>
                  <div className="px-3 py-1.5 rounded-full text-xs font-medium text-red-500 border-red-200 bg-red-50">
                    오류
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
