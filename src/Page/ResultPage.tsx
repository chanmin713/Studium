import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import { MessageCircle, AlertCircle } from "lucide-react";
import ExamDownload from "../components/ExamDownload";
import LoadingIndicator from "../components/LoadingIndicator";
import ErrorDisplay from "../components/ErrorDisplay";
import { chatService } from "../services/chatService";
import { ChatMessage, ExamProgressResponse } from "../types/chat";
import { ResultItem } from "../types/search";

interface SearchResults {
  orbiResults: ResultItem[];
  sumanwhiResults: ResultItem[];
}

interface ResultPageProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const ResultPage: React.FC<ResultPageProps> = ({ messages, onSendMessage }) => {
  const { query } = useParams<{ query: string }>();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<SearchResults | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examProgress, setExamProgress] = useState<ExamProgressResponse | null>(
    null
  );
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    if (!query) {
      navigate("/");
      return;
    }

    // 이미 같은 쿼리로 검색 중이면 중복 요청 방지
    if (currentQuery === query) {
      return;
    }

    const fetchResults = async () => {
      if (isLoading) return;
      try {
        setIsLoading(true);
        setError(null);
        setCurrentQuery(query);

        const response = await chatService.sendMessage(query);
        if (ignore) return;

        if (response.type === "search") {
          setSearchResults({
            orbiResults: response.orbiResults || [],
            sumanwhiResults: response.sumanwhiResults || [],
          });
          setExamProgress(null);
        } else if (response.type === "exam") {
          if ("status" in response) {
            setExamProgress(response as ExamProgressResponse);
          }
          setSearchResults(null);
        }
      } catch (err) {
        if (!ignore) {
          setError("검색 결과를 가져오는데 실패했습니다. 다시 시도해주세요.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      ignore = true;
    };
  }, [query]);

  const handleSendMessage = async (message: string) => {
    if (message === currentQuery) return;
    onSendMessage(message);
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <LoadingIndicator
          type="search"
          message="검색 중입니다..."
          progress={0}
          status="processing"
          onComplete={() => setIsLoading(false)}
          userMessage={query}
        />
      );
    }

    if (error) {
      return (
        <ErrorDisplay
          error={error}
          userMessage={query}
          onRetry={() => {
            setError(null);
            setIsLoading(true);
            setCurrentQuery(null);
          }}
        />
      );
    }

    if (examProgress) {
      if (examProgress.status === "completed" && examProgress.downloadUrl) {
        return (
          <div className="w-full">
            <div className="pt-16 mb-2"></div>
            <ExamDownload
              onDownload={() => window.open(examProgress.downloadUrl, "_blank")}
            />
          </div>
        );
      }

      return (
        <LoadingIndicator
          type="exam"
          message={examProgress.message || "시험지를 생성하고 있습니다..."}
          progress={examProgress.progress || 0}
          status={examProgress.status}
          onComplete={() => {
            if (examProgress.status === "completed") {
              setExamProgress(null);
            }
          }}
          userMessage={query}
        />
      );
    }

    if (!searchResults) {
      return null;
    }

    const mergedResults = [
      ...(searchResults.orbiResults || []),
      ...(searchResults.sumanwhiResults || []),
    ].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    if (mergedResults.length === 0) {
      return (
        <LoadingIndicator
          type="search"
          message="검색 결과가 없습니다. 다른 검색어로 시도해보세요."
          status="completed"
          userMessage={query}
        />
      );
    }

    return (
      <div className="w-full">
        <div className="pt-16 mb-2"></div>
        <div className="grid grid-cols-1 gap-4 md:gap-6 w-full max-w-4xl mx-auto px-3 md:px-4 pb-16">
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
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen w-full flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-start w-full h-full z-10 relative">
        <div className="w-full flex-1 overflow-y-auto scroll-smooth">
          <div className="w-full flex flex-col items-center justify-start">
            {renderResults()}
          </div>
        </div>
        <div className="w-full bg-white/95 backdrop-blur-sm py-2 md:py-3 fixed bottom-0 left-0 z-20 transition-all duration-300 border-t border-gray-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-2 md:px-4">
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
