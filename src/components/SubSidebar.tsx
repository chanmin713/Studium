import React from "react";
import { File, Search } from "lucide-react";

interface SubSidebarProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

// 파일 인터페이스 정의
interface FileItem {
  id: string;
  title: string;
  modifiedDate: string;
  iconColor: string;
}

const SubSidebar: React.FC<SubSidebarProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
}) => {
  // 최근 파일 데이터 추가
  const recentFiles: FileItem[] = [
    {
      id: "1",
      title: "연구 리포트.pdf",
      modifiedDate: "2시간 전 수정됨",
      iconColor: "text-blue-500",
    },
    {
      id: "2",
      title: "발표자료.pptx",
      modifiedDate: "오늘 수정됨",
      iconColor: "text-green-500",
    },
    {
      id: "3",
      title: "논문자료.pdf",
      modifiedDate: "어제 수정됨",
      iconColor: "text-yellow-500",
    },
  ];

  // 자주 사용하는 파일 데이터 추가
  const frequentFiles: FileItem[] = [
    {
      id: "4",
      title: "학습 자료.hwp",
      modifiedDate: "3일 전 수정됨",
      iconColor: "text-purple-500",
    },
    {
      id: "5",
      title: "중요 문서.pdf",
      modifiedDate: "1주 전 수정됨",
      iconColor: "text-red-500",
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-12 md:left-24 bottom-0 w-80 bg-white border-r border-gray-200 shadow-lg z-sidebar overflow-y-auto"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">내 클라우드</h2>

        {/* 검색 */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="파일 검색..."
            className="w-full h-10 pl-12 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>

        {/* 파일 목록 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            최근 파일
          </h3>
          <div className="space-y-2">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/file-title", file.title);
                  e.dataTransfer.setData(
                    "application/file-date",
                    file.modifiedDate
                  );
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <File size={16} className={file.iconColor} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.title}</span>
                    <span className="text-xs text-gray-500">
                      {file.modifiedDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            자주 사용하는 파일
          </h3>
          <div className="space-y-2">
            {frequentFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/file-title", file.title);
                  e.dataTransfer.setData(
                    "application/file-date",
                    file.modifiedDate
                  );
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <File size={16} className={file.iconColor} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.title}</span>
                    <span className="text-xs text-gray-500">
                      {file.modifiedDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubSidebar;
