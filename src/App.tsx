import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatPage from "./Page/ChatPage";
import MainPage from "./Page/MainPage";
import SettingsModal from "./components/SettingsModal";
import "./index.css";

// URL로 접근했을 때 사용할 wrapper 컴포넌트
function SearchPageWrapper() {
  const { query } = useParams<{ query: string }>();
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: Date;
    }>
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query) {
      console.log("[SearchPageWrapper] URL 쿼리 파라미터 처리:", query);
      // URL에서 디코딩된 검색어로 메시지 생성
      const decodedQuery = decodeURIComponent(query);
      const userMessage = {
        id: Date.now().toString(),
        text: decodedQuery,
        isUser: true,
        timestamp: new Date(),
      };

      // 메시지 설정
      setMessages([userMessage]);
    }
  }, [query]);

  const handleSendMessage = (text: string) => {
    console.log("[SearchPageWrapper] 새 메시지 전송:", text);
    const userMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages([userMessage]);
    // 검색어를 URL에 인코딩하여 포함 (URL 변경으로 위의 useEffect 트리거)
    navigate(`/search/${encodeURIComponent(text)}`);
  };

  // messages 배열에 메시지가 있는 경우에만 ChatPage 컴포넌트 렌더링
  return (
    <>
      {messages.length > 0 && (
        <ChatPage messages={messages} onSendMessage={handleSendMessage} />
      )}
    </>
  );
}

function AppContent() {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      isUser: boolean;
      timestamp: Date;
    }>
  >([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSendMessage = (text: string) => {
    console.log("[App] 메시지 전송:", text);
    const userMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages([userMessage]);

    // 메인 페이지에서 보낸 메시지가 제대로 처리되도록 SearchPageWrapper로 리다이렉트
    navigate(`/search/${encodeURIComponent(text)}`);
  };

  return (
    <div className="min-h-screen flex flex-row bg-white app-container font-sans text-gray-900 overflow-hidden">
      <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      <main className="flex-1 min-w-0 flex flex-col ml-12 md:ml-24 max-w-full">
        <Routes>
          <Route
            path="/"
            element={<MainPage onSendMessage={handleSendMessage} />}
          />
          <Route path="/search/:query" element={<SearchPageWrapper />} />
          <Route
            path="/search"
            element={
              <ChatPage messages={messages} onSendMessage={handleSendMessage} />
            }
          />
        </Routes>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
