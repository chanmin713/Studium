import React from "react";
import { useNavigate } from "react-router-dom";
import ChatInput from "../components/ChatInput";
import mainPageTexts from "../data/mainPageTexts";

interface MainPageProps {
  onSendMessage: (text: string) => void;
}

const MainPage: React.FC<MainPageProps> = ({ onSendMessage }) => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [shuffled, setShuffled] = React.useState<string[]>([]);
  const [fade, setFade] = React.useState(true);

  React.useEffect(() => {
    // 랜덤 셔플
    const arr = [...mainPageTexts];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
    setCurrentIdx(0);
  }, []);

  React.useEffect(() => {
    if (shuffled.length === 0) return;
    const fadeOut = setTimeout(() => setFade(false), 3500); // 3.5초 후 fade out
    const next = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % shuffled.length);
      setFade(true);
    }, 4000); // 4초마다 전환
    return () => {
      clearTimeout(fadeOut);
      clearTimeout(next);
    };
  }, [currentIdx, shuffled]);

  const handleSendMessage = (message: string) => {
    console.log("[MainPage] 메시지 전송:", message);

    // 부모 컴포넌트의 onSendMessage 호출
    onSendMessage(message);

    // SearchPageWrapper 컴포넌트로 라우팅하여 처리
    navigate(`/search/${encodeURIComponent(message)}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-pink-50 to-blue-50">
      <div className="w-full max-w-2xl px-4 py-8 sm:py-12">
        <div className="flex justify-center mb-6">
          <img src="/studium_icon.png" alt="Studium Logo" className="h-28" />
        </div>

        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Studium{" "}
          <span className="font-normal text-xl text-gray-500">
            | 질문이 쌓이는 공간
          </span>
        </h1>

        <div className="text-center mb-10 min-h-[40px]">
          <p
            className={`text-2xl text-gray-700 transition-opacity duration-500 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          >
            {shuffled[currentIdx]}
          </p>
        </div>

        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default MainPage;
