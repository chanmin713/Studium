import React, { useState } from "react";
import { Menu, X, Home, Folder, User } from "lucide-react";
import SettingsModal from "./SettingsModal";
import SubSidebar from "./SubSidebar";

interface SidebarProps {
  onSettingsClick: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  id: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { icon: <Home size={26} />, label: "홈", id: "home" },
    { icon: <Folder size={26} />, label: "저장소", id: "storage" },
  ];

  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);

  const handleStorageHover = () => {
    setIsSubSidebarOpen(true);
  };

  const handleSubSidebarLeave = () => {
    setIsSubSidebarOpen(false);
  };

  const handleMenuItemClick = (itemId: string) => {
    if (itemId !== "storage") {
      setIsSubSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="fixed top-4 left-4 z-sidebar md:hidden p-2 rounded-lg bg-white border border-gray-200 shadow transition"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-overlay md:hidden transition"
          onClick={toggleSidebar}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={toggleSettings} />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-12 md:w-24 bg-white border-r border-gray-200 z-sidebar transition-transform duration-200 transform
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:shadow-xl overflow-y-auto overflow-x-hidden flex flex-col items-center
        `}
      >
        {/* 로고 이미지 */}
        <a
          href="/"
          className="mt-4 mb-4 flex items-center justify-center w-full"
          aria-label="홈으로 이동"
        >
          <img
            src="/studium_icon_sidebar.png"
            alt="Studium 로고"
            width={42}
            height={42}
            className="object-contain drop-shadow"
          />
        </a>
        <nav className="flex flex-col gap-2 w-full items-center">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className="flex flex-col items-center w-full py-1.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => handleMenuItemClick(item.id)}
              onMouseEnter={
                item.id === "storage" ? handleStorageHover : undefined
              }
            >
              {item.icon}
            </button>
          ))}
        </nav>
        {/* 프로필 섹션 - 사이드바 하단에 고정 */}
        <div className="mt-auto mb-4 w-full">
          <button
            onClick={toggleSettings}
            className="flex flex-col items-center w-full py-1.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100"
          >
            <div className="w-[38px] h-[38px] rounded-full bg-gray-100 flex items-center justify-center">
              <User size={30} className="text-gray-500" />
            </div>
          </button>
        </div>
      </aside>

      {/* Sub Sidebar */}
      <SubSidebar
        isOpen={isSubSidebarOpen}
        onMouseEnter={handleStorageHover}
        onMouseLeave={handleSubSidebarLeave}
      />
    </>
  );
};

export default Sidebar;
