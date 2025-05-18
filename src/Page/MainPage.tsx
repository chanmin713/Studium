import React from "react";
import { useNavigate } from "react-router-dom";
import ChatInput from "../components/ChatInput";

interface MainPageProps {
  onSendMessage: (text: string) => void;
}

const MainPage: React.FC<MainPageProps> = ({ onSendMessage }) => {
  const navigate = useNavigate();

  const handleSendMessage = (message: string) => {
    console.log("[MainPage] 메시지 전송:", message);

    // 부모 컴포넌트의 onSendMessage 호출
    onSendMessage(message);

    // SearchPageWrapper 컴포넌트로 라우팅하여 처리
    navigate(`/search/${encodeURIComponent(message)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-2xl px-4">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Studium AI Logo" className="h-16" />
        </div>
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">
          Studium AI
        </h1>
        <p className="text-center text-gray-600 mb-8">AI 기반 학습 도우미</p>
        <div className="text-center mb-8">
          <p className="text-lg text-gray-700 animate-pulse">
            무엇이든 물어보세요
          </p>
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default MainPage;
