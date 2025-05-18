import React from "react";
import { X, User, ChevronRight } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [selectedSetting, setSelectedSetting] = React.useState("profile");

  // ESC 키로 모달 닫기
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const settingsMenu = [
    { id: "profile", label: "프로필" },
    { id: "account", label: "계정" },
    { id: "notification", label: "알림" },
    { id: "privacy", label: "개인정보" },
    { id: "help", label: "도움말" },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-[100] transition backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden pointer-events-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* X 버튼을 모달창 내 오른쪽 위에 고정 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[102] p-2 bg-white rounded-full shadow hover:bg-gray-100 transition"
            aria-label="닫기"
          >
            <X size={24} />
          </button>
          {/* Settings Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">설정</h2>
            </div>
            <nav className="space-y-1">
              {settingsMenu.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSetting(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    selectedSetting === item.id
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${
                      selectedSetting === item.id ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedSetting === "profile" && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">프로필 설정</h3>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={40} className="text-gray-500" />
                    </div>
                    <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      프로필 사진 변경
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름
                      </label>
                      <input
                        type="text"
                        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        소개
                      </label>
                      <textarea
                        className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="자신을 소개해주세요"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* 다른 설정 페이지들도 비슷한 형식으로 추가할 수 있습니다 */}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;
