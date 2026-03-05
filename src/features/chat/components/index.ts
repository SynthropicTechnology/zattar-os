import { lazy } from 'react';

export * from "./chat-header";
export * from "./chat-content";
export * from "./chat-footer";
export * from "./chat-sidebar";
export * from "./chat-list-item";
export * from "./chat-list-item-dropdown";
export * from "./action-dropdown";
export * from "./chat-bubbles";
export * from "./media-list-item";
export * from "./message-status-icon";
export * from "./user-detail-sheet";
export * from "./incoming-call-dialog";

// Main components
export { ChatLayout } from "./chat-layout";
// ChatWindow is lazy-loaded in chat-layout.tsx to defer Dyte SDK loading
// Export as regular export for direct usage, but prefer lazy loading in parent components
export { ChatWindow } from "./chat-window";
export { ChatSidebarWrapper } from "./chat-sidebar-wrapper";
export { ChatSidebar } from "./chat-sidebar";
export { CallHistoryList } from "./call-history-list";

// Lazy load heavy call components
export const CallDialog = lazy(() => 
  import('./call-dialog').then(m => ({ default: m.CallDialog }))
);

export const VideoCallDialog = lazy(() =>
  import('./video-call-dialog').then(m => ({ default: m.VideoCallDialog }))
);

export { CallWindowContent } from './call-window-content';
export { MeetingSkeleton } from './meeting-skeleton';
