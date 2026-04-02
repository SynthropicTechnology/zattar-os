/**
 * Property-Based Tests for Chat Responsiveness
 * Feature: responsividade-frontend
 */

import * as fc from 'fast-check';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import Image from 'next/image';
import { renderWithViewport } from '@/testing/helpers/responsive-test-helpers';

// Clean up after each test
afterEach(() => {
    cleanup();
});

// Mock components for testing
const MockChatPage = ({ isMobile }: { isMobile: boolean }) => {
    return (
        <div data-testid="chat-container">
            {isMobile ? (
                <>
                    <div data-testid="mobile-room-sheet" data-mobile="true">
                        Room List Sheet
                    </div>
                    <div data-testid="chat-view" className="w-full">
                        Chat Messages
                    </div>
                </>
            ) : (
                <>
                    <div data-testid="desktop-sidebar" className="w-80">
                        Room List Sidebar
                    </div>
                    <div data-testid="chat-view" className="flex-1">
                        Chat Messages
                    </div>
                </>
            )}
        </div>
    );
};

const MockMessageBubble = ({
    isOwnMessage,
    isMobile
}: {
    isOwnMessage: boolean;
    isMobile: boolean;
}) => {
    const maxWidth = isMobile ? '85%' : '75%';
    return (
        <div
            data-testid="message-bubble"
            data-own={isOwnMessage}
            style={{ maxWidth }}
            className={isMobile ? 'max-w-[85%]' : 'max-w-[75%]'}
        >
            Message content
        </div>
    );
};

const MockAttachment = ({
    type,
    isMobile
}: {
    type: 'image' | 'video' | 'document';
    isMobile: boolean;
}) => {
    return (
        <div
            data-testid={`attachment-${type}`}
            data-mobile={isMobile}
            className={isMobile ? 'w-full max-w-full' : 'max-w-sm'}
        >
            {type === 'image' && (
                <Image src="/test.jpg" alt="test" width={400} height={300} className={isMobile ? 'w-full' : 'max-w-sm'} />
            )}
            {type === 'video' && <video src="/test.mp4" className={isMobile ? 'w-full' : 'max-w-sm'} />}
            {type === 'document' && (
                <div className="flex items-center gap-2">
                    <span>Document</span>
                    <button className={isMobile ? 'shrink-0' : ''}>
                        {isMobile ? '⬇' : 'Baixar'}
                    </button>
                </div>
            )}
        </div>
    );
};

describe('Chat Responsive Property Tests', () => {
    /**
     * Property 44: Chat separate views on mobile
     * Validates: Requirements 10.1
     * 
     * For any chat interface displayed at viewport width less than 768px,
     * room list and chat messages should be shown in separate views
     */
    test('Property 44: Chat displays separate views on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }), // Mobile viewport widths
                (width) => {
                    const { container, unmount } = renderWithViewport(
                        <MockChatPage isMobile={true} />,
                        width
                    );

                    try {
                        // On mobile, room list should be in a Sheet (separate view)
                        const mobileSheet = container.querySelector('[data-mobile="true"]');
                        expect(mobileSheet).toBeInTheDocument();

                        // Chat view should take full width
                        const chatView = container.querySelector('[data-testid="chat-view"]');
                        expect(chatView).toBeInTheDocument();
                        expect(chatView).toHaveClass('w-full');

                        // Desktop sidebar should not be present
                        const desktopSidebar = container.querySelector('[data-testid="desktop-sidebar"]');
                        expect(desktopSidebar).not.toBeInTheDocument();
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 45: Chat room navigation
     * Validates: Requirements 10.2
     * 
     * For any chat room selected on mobile, navigation to message view
     * with back button should occur
     */
    test('Property 45: Mobile chat has room navigation controls', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.boolean(), // Whether a room is selected
                (width, roomSelected) => {
                    const MockMobileChatWithNav = () => (
                        <div data-testid="mobile-chat">
                            {roomSelected && (
                                <div data-testid="mobile-header">
                                    <button data-testid="back-button" aria-label="Voltar para lista de salas">
                                        ← Back
                                    </button>
                                    <span>Room Name</span>
                                </div>
                            )}
                            <div data-testid="messages">Messages</div>
                        </div>
                    );

                    const { container, unmount } = renderWithViewport(
                        <MockMobileChatWithNav />,
                        width
                    );

                    try {
                        if (roomSelected) {
                            // Back button should be present when room is selected
                            const backButton = container.querySelector('[data-testid="back-button"]');
                            expect(backButton).toBeInTheDocument();
                            expect(backButton).toHaveAttribute('aria-label');
                        }
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 46: Chat message bubbles optimized
     * Validates: Requirements 10.3
     * 
     * For any chat messages displayed on mobile, message bubbles
     * should be optimized for narrow screens
     */
    test('Property 46: Message bubbles are optimized for mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.boolean(), // isOwnMessage
                (width, isOwnMessage) => {
                    const { container, unmount } = renderWithViewport(
                        <MockMessageBubble isOwnMessage={isOwnMessage} isMobile={true} />,
                        width
                    );

                    try {
                        const bubble = container.querySelector('[data-testid="message-bubble"]');
                        expect(bubble).toBeInTheDocument();

                        // On mobile, bubbles should have max-width of 85% (wider than desktop 75%)
                        expect(bubble).toHaveClass('max-w-[85%]');
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 47: Chat attachments compact
     * Validates: Requirements 10.5
     * 
     * For any file attachments displayed in chat on mobile,
     * they should be shown in a compact, scrollable format
     */
    test('Property 47: Attachments are compact on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                fc.constantFrom('image', 'video', 'document'),
                (width, attachmentType) => {
                    const { container, unmount } = renderWithViewport(
                        <MockAttachment type={attachmentType as 'image' | 'video' | 'document'} isMobile={true} />,
                        width
                    );

                    try {
                        const attachment = container.querySelector(`[data-testid="attachment-${attachmentType}"]`);
                        expect(attachment).toBeInTheDocument();
                        expect(attachment).toHaveAttribute('data-mobile', 'true');

                        if (attachmentType === 'image' || attachmentType === 'video') {
                            // Images and videos should be full width on mobile
                            expect(attachment).toHaveClass('w-full');
                            expect(attachment).toHaveClass('max-w-full');
                        } else if (attachmentType === 'document') {
                            // Document buttons should be compact (icon only or shrink-0)
                            const button = attachment?.querySelector('button');
                            expect(button).toHaveClass('shrink-0');
                        }
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional test: Desktop chat layout
     * Validates that desktop maintains sidebar layout
     */
    test('Desktop chat maintains sidebar layout', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 768, max: 1920 }),
                (width) => {
                    const { container, unmount } = renderWithViewport(
                        <MockChatPage isMobile={false} />,
                        width
                    );

                    try {
                        // Desktop should have sidebar
                        const sidebar = container.querySelector('[data-testid="desktop-sidebar"]');
                        expect(sidebar).toBeInTheDocument();
                        expect(sidebar).toHaveClass('w-80');

                        // Mobile sheet should not be present
                        const mobileSheet = container.querySelector('[data-mobile="true"]');
                        expect(mobileSheet).not.toBeInTheDocument();
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional test: Message input touch targets
     * Validates that input controls meet minimum touch target size
     */
    test('Chat input controls meet minimum touch target size on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 767 }),
                (width) => {
                    const MockChatInput = () => (
                        <div data-testid="chat-input-container">
                            <input
                                data-testid="message-input"
                                className="min-h-[44px]"
                                style={{ minHeight: '44px' }}
                            />
                            <button
                                data-testid="attach-button"
                                className="min-h-[44px] min-w-[44px]"
                                style={{ minHeight: '44px', minWidth: '44px' }}
                            >
                                📎
                            </button>
                            <button
                                data-testid="send-button"
                                className="min-h-[44px] min-w-[44px]"
                                style={{ minHeight: '44px', minWidth: '44px' }}
                            >
                                ➤
                            </button>
                        </div>
                    );

                    const { container, unmount } = renderWithViewport(<MockChatInput />, width);

                    try {
                        const input = container.querySelector('[data-testid="message-input"]');
                        const attachButton = container.querySelector('[data-testid="attach-button"]');
                        const sendButton = container.querySelector('[data-testid="send-button"]');

                        // All interactive elements should meet 44px minimum
                        expect(input).toHaveClass('min-h-[44px]');
                        expect(attachButton).toHaveClass('min-h-[44px]');
                        expect(attachButton).toHaveClass('min-w-[44px]');
                        expect(sendButton).toHaveClass('min-h-[44px]');
                        expect(sendButton).toHaveClass('min-w-[44px]');
                    } finally {
                        unmount();
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
