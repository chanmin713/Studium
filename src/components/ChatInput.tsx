import React, { useState, useEffect, useRef } from "react";
import { PaperclipIcon, Search, ArrowUp, X, File } from "lucide-react";
import { fileService } from "../services/fileService";
import { errorService } from "../services/errorService";
import { chatService } from "../services/chatService";
import { useNavigate } from "react-router-dom";

interface ChatInputProps {
  onSendMessage?: (text: string) => void;
  disabled?: boolean;
}

// 파일 정보 인터페이스
interface DraggedFile {
  id: string;
  title: string;
  modifiedDate: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [draggedFiles, setDraggedFiles] = useState<DraggedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 화면 크기 감지하여 모바일 여부 설정
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // 부모 컴포넌트의 onSendMessage 호출 (있는 경우)
      onSendMessage?.(message);

      // chatService를 통해 메시지 전송
      await chatService.sendMessage(message);

      // 이미 SearchPageWrapper에서 처리하므로 여기서는 네비게이션하지 않음
    } catch (error) {
      console.error("[ChatInput] 메시지 전송 실패:", error);
      setError("메시지 전송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("파일 크기는 10MB를 초과할 수 없습니다.");
      return;
    }

    // 파일 형식 체크
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(
        "지원하지 않는 파일 형식입니다. PDF, TXT, DOC, DOCX 파일만 업로드 가능합니다."
      );
      return;
    }

    setError(null);
    // TODO: 파일 업로드 처리
  };

  // 드롭 이벤트 핸들러
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const fileTitle = e.dataTransfer.getData("application/file-title");
    const fileDate =
      e.dataTransfer.getData("application/file-date") || "날짜 정보 없음";

    if (fileTitle) {
      // 중복 파일 체크 (같은 제목의 파일이 이미 있는지)
      const isDuplicate = draggedFiles.some((file) => file.title === fileTitle);

      if (!isDuplicate) {
        // 새 파일 정보 추가
        const newFile: DraggedFile = {
          id: Date.now().toString(), // 유니크 ID
          title: fileTitle,
          modifiedDate: fileDate,
        };

        setDraggedFiles((prev) => [...prev, newFile]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  // 파일 제거
  const removeFile = (id: string) => {
    setDraggedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleFileUpload = async (file: File) => {
    try {
      // 파일 타입 및 크기 검증
      const allowedTypes = ["application/pdf", "text/plain"];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!fileService.validateFileType(file, allowedTypes)) {
        throw new Error("지원하지 않는 파일 형식입니다.");
      }

      if (!fileService.validateFileSize(file, maxSize)) {
        throw new Error("파일 크기가 너무 큽니다. (최대 10MB)");
      }

      const formData = await fileService.prepareFileUpload(file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("파일 업로드 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      onSendMessage?.(
        `파일이 업로드되었습니다: ${file.name} (${fileService.formatFileSize(
          file.size
        )})`
      );
    } catch (error) {
      errorService.handle(error);
    }
  };

  // 반응형 스타일 상수
  const buttonSize = isMobile ? 44 : 52; // 버튼 크기 (px)
  const iconSize = isMobile ? 20 : 22; // 아이콘 크기 (px)
  const containerPadding = isMobile ? 16 : 20; // 컨테이너 패딩 (px)
  const inputHeight = isMobile ? 48 : 56; // 입력창 높이 (px)

  return (
    <div className="relative w-full max-w-3xl mx-auto transition-transform duration-200 ease-in-out hover:scale-105">
      {/* 입력창 */}
      <div className="relative rounded-lg">
        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.txt,.doc,.docx"
            disabled={disabled || isLoading}
          />
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <span className="text-red-600 text-sm">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
                disabled={disabled || isLoading}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div
            className={`bg-white w-full flex flex-col border rounded-xl sm:rounded-2xl border-gray-200 shadow-sm ${
              disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{ padding: `${containerPadding}px` }}
          >
            {/* 드래그된 파일 카드 표시 영역 */}
            {draggedFiles.length > 0 && (
              <div className="p-2 bg-gray-50 rounded-t-lg border border-gray-200 border-b-0">
                <div className="flex flex-wrap gap-2">
                  {draggedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-1.5 pl-2.5 flex items-center">
                        <div className="mr-1.5">
                          <File size={15} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-xs font-medium leading-tight">
                            {file.title}
                          </div>
                          <div className="text-xs text-gray-500 leading-tight">
                            {file.modifiedDate}
                          </div>
                        </div>
                      </div>
                      <button
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-lg flex items-center"
                        onClick={() => removeFile(file.id)}
                        aria-label="파일 제거"
                        disabled={disabled || isLoading}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 입력 영역 */}
            <div className="relative flex-1">
              <div className="bg-gray-50 rounded-b-lg sm:rounded-b-xl border border-gray-200">
                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center w-full">
                  {/* 검색 아이콘 */}
                  <div className="flex items-center justify-center">
                    <div
                      className="text-gray-400 flex items-center justify-center"
                      style={{
                        width: `${buttonSize}px`,
                        height: `${buttonSize}px`,
                      }}
                    >
                      <Search
                        size={iconSize}
                        strokeWidth={1.8}
                        className="text-gray-400"
                      />
                    </div>
                  </div>

                  {/* 텍스트 입력 영역 */}
                  <div className="relative w-full">
                    <textarea
                      className="w-full outline-none resize-none bg-transparent text-gray-800 placeholder-gray-400 scrollbar-hide"
                      style={{
                        height: `${inputHeight}px`,
                        minHeight: `${inputHeight}px`,
                        maxHeight: `${inputHeight}px`,
                        paddingTop: `${containerPadding - 4}px`,
                        paddingBottom: `${containerPadding + 4}px`,
                        paddingLeft: `0px`,
                        paddingRight: `${
                          isMobile
                            ? containerPadding - 10
                            : containerPadding - 8
                        }px`,
                        fontSize: isMobile ? "16px" : "17px",
                        lineHeight: "1.5",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflowX: "auto",
                        overflowY: "hidden",
                        msOverflowStyle: "none" /* IE and Edge */,
                        scrollbarWidth: "none" /* Firefox */,
                      }}
                      placeholder="질문을 입력하세요..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={1}
                      maxLength={500}
                      onDragStart={(e) => e.preventDefault()}
                      draggable="false"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      disabled={disabled || isLoading}
                    />
                  </div>

                  {/* 첨부파일 버튼 - 모바일에서는 숨김 */}
                  <div className="hidden sm:flex items-center justify-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        width: `${buttonSize}px`,
                        height: `${buttonSize}px`,
                      }}
                      aria-label="첨부 파일"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || isLoading}
                    >
                      <PaperclipIcon size={iconSize} strokeWidth={1.8} />
                    </button>
                  </div>

                  {/* 전송 버튼 */}
                  <div className="flex items-center justify-center pr-1 sm:pr-2">
                    <button
                      type="submit"
                      className={`text-white rounded-lg flex items-center justify-center transition-all shadow-sm flex-shrink-0 ${
                        disabled || isLoading
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      style={{
                        background:
                          "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
                        width: `${buttonSize - (isMobile ? 8 : 10)}px`,
                        height: `${buttonSize - (isMobile ? 8 : 10)}px`,
                        minWidth: `${buttonSize - (isMobile ? 8 : 10)}px`,
                        minHeight: `${buttonSize - (isMobile ? 8 : 10)}px`,
                      }}
                      aria-label="전송"
                      disabled={disabled || isLoading}
                    >
                      <ArrowUp
                        size={isMobile ? iconSize - 2 : iconSize}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
