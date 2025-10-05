import React from "react";

export type GratitudeTab = "today" | "calendar" | "history" | "share";

interface GratitudeFooterProps {
  activeTab: GratitudeTab;
  setActiveTab: (tab: GratitudeTab) => void;
}

export const GratitudeFooter: React.FC<GratitudeFooterProps> = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-0 left-0 right-0 mx-4 mb-4 bg-gray-100 dark:bg-gray-800 border-[3px] border-double border-purple-500 px-2 py-2 rounded-lg z-50">
    <div className="flex justify-around items-center h-14">
      <button
        onClick={() => setActiveTab('today')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          activeTab === 'today' ? 'text-purple-500' : 'text-gray-500'
        }`}
      >
        <span className="text-xl">✍️</span>
        <span className="text-xs mt-1">Today</span>
      </button>
      <button
        onClick={() => setActiveTab('calendar')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          activeTab === 'calendar' ? 'text-purple-500' : 'text-gray-500'
        }`}
      >
        <span className="text-xl">📅</span>
        <span className="text-xs mt-1">Calendar</span>
      </button>
      <button
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          activeTab === 'history' ? 'text-purple-500' : 'text-gray-500'
        }`}
      >
        <span className="text-xl">📝</span>
        <span className="text-xs mt-1">History</span>
      </button>
      <button
        onClick={() => setActiveTab('share')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          activeTab === 'share' ? 'text-purple-500' : 'text-gray-500'
        }`}
      >
        <span className="text-xl">🌟</span>
        <span className="text-xs mt-1">Share</span>
      </button>
    </div>
  </div>
);
