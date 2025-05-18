import React from "react";
import { FileText, Download } from "lucide-react";

interface ExamDownloadProps {
  onDownload: () => void;
}

/**
 * 시험지 다운로드 버튼을 표시하는 컴포넌트
 */
const ExamDownload: React.FC<ExamDownloadProps> = ({ onDownload }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-4 py-6">
      <div className="border border-gray-200 bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="mr-4">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              시험지가 준비되었습니다
            </h3>
            <p className="text-gray-600">
              수학 문제와 답지가 포함된 PDF 파일이 생성되었습니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={onDownload}
            className="inline-flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            PDF 다운로드
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500 flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          <p>파일은 24시간 동안 서버에 유지됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default ExamDownload;
