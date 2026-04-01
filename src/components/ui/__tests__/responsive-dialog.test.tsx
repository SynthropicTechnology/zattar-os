/**
 * Property-Based Tests para ResponsiveDialog
 * 
 * Testa as propriedades de responsividade dos dialogs:
 * - Property 19: Dialog full-screen on mobile
 * - Property 20: Dialog form no horizontal scroll
 * - Property 21: Dialog buttons at bottom
 * - Property 22: Dialog vertical scroll
 * - Property 23: Dialog prevents background scroll
 */

import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import {
    ResponsiveDialog,
    ResponsiveDialogContent,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
    ResponsiveDialogTitle,
    ResponsiveDialogBody,
} from '@/components/ui/responsive-dialog';
import {
    setViewport,
    hasHorizontalScroll,
    mockMatchMedia,
} from '@/testing/helpers/responsive-test-helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Mock do hook useBreakpointBelow
const mockUseBreakpointBelow = jest.fn<boolean, [string]>();

jest.mock('@/hooks/use-breakpoint', () => ({
    useBreakpointBelow: (breakpoint: string) => mockUseBreakpointBelow(breakpoint),
}));

describe('ResponsiveDialog Property-Based Tests', () => {
    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Feature: responsividade-frontend, Property 19: Dialog full-screen on mobile
     * Validates: Requirements 5.1
     * 
     * For any dialog opened at viewport width less than 640px,
     * it should display as full-screen or near full-screen
     */
    test('Property 19: Dialog renders full-screen on mobile viewports', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
                fc.string({ minLength: 5, maxLength: 50 }), // Dialog title
                fc.string({ minLength: 10, maxLength: 100 }), // Dialog content
                (width, title, content) => {
                    // Setup
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockUseBreakpointBelow.mockReturnValue(true); // Mobile

                    // Render
                    render(
                        <ResponsiveDialog open={true}>
                            <ResponsiveDialogContent>
                                <ResponsiveDialogHeader>
                                    <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
                                </ResponsiveDialogHeader>
                                <ResponsiveDialogBody>
                                    <p>{content}</p>
                                </ResponsiveDialogBody>
                            </ResponsiveDialogContent>
                        </ResponsiveDialog>
                    );

                    // Verify: Should use Sheet (bottom sheet) which takes up most of screen
                    const sheetContent = document.querySelector('[data-slot="sheet-content"]');
                    expect(sheetContent).toBeInTheDocument();

                    // Verify: Should have full-screen height class
                    expect(sheetContent).toHaveClass('h-[95vh]');
                }
            ),
            { numRuns: 15 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 20: Dialog form no horizontal scroll
     * Validates: Requirements 5.2
     * 
     * For any dialog containing a form on mobile,
     * all fields should be accessible without horizontal scroll
     */
    test('Property 20: Dialog forms have no horizontal scroll on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
                fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 2, maxLength: 5 }), // Field labels
                (width, fieldLabels) => {
                    // Setup
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockUseBreakpointBelow.mockReturnValue(true); // Mobile

                    // Render dialog with form
                    render(
                        <ResponsiveDialog open={true}>
                            <ResponsiveDialogContent>
                                <ResponsiveDialogHeader>
                                    <ResponsiveDialogTitle>Form Dialog</ResponsiveDialogTitle>
                                </ResponsiveDialogHeader>
                                <ResponsiveDialogBody>
                                    <form className="space-y-4">
                                        {fieldLabels.map((label, index) => (
                                            <div key={index} className="space-y-2">
                                                <Label htmlFor={`field-${index}`}>{label}</Label>
                                                <Input id={`field-${index}`} />
                                            </div>
                                        ))}
                                    </form>
                                </ResponsiveDialogBody>
                                <ResponsiveDialogFooter>
                                    <Button>Submit</Button>
                                </ResponsiveDialogFooter>
                            </ResponsiveDialogContent>
                        </ResponsiveDialog>
                    );

                    // Verify: Dialog content should not have horizontal scroll
                    const dialogBody = document.querySelector('[data-slot="sheet-content"]');
                    expect(dialogBody).toBeInTheDocument();

                    // Check for overflow-x-hidden class
                    expect(dialogBody).toHaveClass('overflow-x-hidden');

                    // Verify no horizontal scroll
                    if (dialogBody) {
                        expect(hasHorizontalScroll(dialogBody as HTMLElement)).toBe(false);
                    }
                }
            ),
            { numRuns: 15 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 21: Dialog buttons at bottom
     * Validates: Requirements 5.3
     * 
     * For any dialog with action buttons on mobile,
     * buttons should be positioned at the bottom with adequate spacing
     */
    test('Property 21: Dialog buttons are positioned at bottom on mobile', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
                fc.array(fc.string({ minLength: 3, maxLength: 15 }), { minLength: 1, maxLength: 3 }), // Button labels
                (width, buttonLabels) => {
                    // Setup
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockUseBreakpointBelow.mockReturnValue(true); // Mobile

                    // Render
                    render(
                        <ResponsiveDialog open={true}>
                            <ResponsiveDialogContent>
                                <ResponsiveDialogHeader>
                                    <ResponsiveDialogTitle>Dialog with Actions</ResponsiveDialogTitle>
                                </ResponsiveDialogHeader>
                                <ResponsiveDialogBody>
                                    <p>Some content</p>
                                </ResponsiveDialogBody>
                                <ResponsiveDialogFooter>
                                    {buttonLabels.map((label, index) => (
                                        <Button key={index}>{label}</Button>
                                    ))}
                                </ResponsiveDialogFooter>
                            </ResponsiveDialogContent>
                        </ResponsiveDialog>
                    );

                    // Verify: Footer should use SheetFooter on mobile
                    const footer = document.querySelector('[data-slot="sheet-footer"]');
                    expect(footer).toBeInTheDocument();

                    // Verify: Should have sticky bottom positioning
                    expect(footer).toHaveClass('sticky');
                    expect(footer).toHaveClass('bottom-0');

                    // Verify: Should have border-t for visual separation
                    expect(footer).toHaveClass('border-t');
                }
            ),
            { numRuns: 15 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 22: Dialog vertical scroll
     * Validates: Requirements 5.4
     * 
     * For any dialog with content exceeding viewport height on mobile,
     * vertical scrolling should be enabled within the dialog
     */
    test('Property 22: Dialog enables vertical scroll for long content', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
                fc.integer({ min: 10, max: 50 }), // Number of content items
                (width, itemCount) => {
                    // Setup
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockUseBreakpointBelow.mockReturnValue(true); // Mobile

                    // Render dialog with long content
                    render(
                        <ResponsiveDialog open={true}>
                            <ResponsiveDialogContent>
                                <ResponsiveDialogHeader>
                                    <ResponsiveDialogTitle>Long Content Dialog</ResponsiveDialogTitle>
                                </ResponsiveDialogHeader>
                                <ResponsiveDialogBody>
                                    <div className="space-y-4">
                                        {Array.from({ length: itemCount }, (_, i) => (
                                            <div key={i} className="p-4 border rounded">
                                                Item {i + 1}
                                            </div>
                                        ))}
                                    </div>
                                </ResponsiveDialogBody>
                                <ResponsiveDialogFooter>
                                    <Button>Close</Button>
                                </ResponsiveDialogFooter>
                            </ResponsiveDialogContent>
                        </ResponsiveDialog>
                    );

                    // Verify: Sheet content should allow vertical scroll
                    const sheetContent = document.querySelector('[data-slot="sheet-content"]');
                    expect(sheetContent).toBeInTheDocument();
                    expect(sheetContent).toHaveClass('overflow-y-auto');

                    // Verify: Body should be scrollable
                    const body = document.querySelector('.overflow-y-auto.overflow-x-hidden');
                    expect(body).toBeInTheDocument();
                }
            ),
            { numRuns: 15 }
        );
    });

    /**
     * Feature: responsividade-frontend, Property 23: Dialog prevents background scroll
     * Validates: Requirements 5.5
     * 
     * For any open dialog on mobile,
     * background scrolling should be prevented
     */
    test('Property 23: Dialog prevents background scroll when open', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
                fc.boolean(), // Dialog open state
                (width, isOpen) => {
                    // Cleanup previous renders
                    cleanup();

                    // Setup
                    setViewport({ width, height: 667 });
                    mockMatchMedia(width);
                    mockUseBreakpointBelow.mockReturnValue(true); // Mobile

                    // Render
                    render(
                        <ResponsiveDialog open={isOpen}>
                            <ResponsiveDialogContent>
                                <ResponsiveDialogHeader>
                                    <ResponsiveDialogTitle>Test Dialog</ResponsiveDialogTitle>
                                </ResponsiveDialogHeader>
                                <ResponsiveDialogBody>
                                    <p>Content</p>
                                </ResponsiveDialogBody>
                            </ResponsiveDialogContent>
                        </ResponsiveDialog>
                    );

                    if (isOpen) {
                        // Verify: When open, Sheet should render with overlay
                        const overlay = document.querySelector('[data-slot="sheet-overlay"]');
                        expect(overlay).toBeInTheDocument();

                        // Radix Dialog/Sheet automatically prevents background scroll
                        // by adding data-scroll-locked to body
                        // We verify the overlay exists which is part of the scroll prevention mechanism
                        expect(overlay).toHaveClass('fixed');
                        expect(overlay).toHaveClass('inset-0');
                    } else {
                        // Verify: When closed, no overlay should be present
                        const overlay = document.querySelector('[data-slot="sheet-overlay"]');
                        expect(overlay).not.toBeInTheDocument();
                    }
                }
            ),
            { numRuns: 15 }
        );
    });

    /**
     * Additional test: Desktop behavior
     * Verify that on desktop, Dialog is used instead of Sheet
     */
    test('Desktop: Dialog uses standard Dialog component on desktop viewports', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 640, max: 1920 }), // Desktop viewport widths
                fc.string({ minLength: 5, maxLength: 50 }), // Dialog title
                (width, title) => {
                    // Setup
                    setViewport({ width, height: 1080 });
                    mockMatchMedia(width);
                    mockUseBreakpointBelow.mockReturnValue(false); // Desktop

                    // Render
                    render(
                        <ResponsiveDialog open={true}>
                            <ResponsiveDialogContent>
                                <ResponsiveDialogHeader>
                                    <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
                                </ResponsiveDialogHeader>
                                <ResponsiveDialogBody>
                                    <p>Content</p>
                                </ResponsiveDialogBody>
                            </ResponsiveDialogContent>
                        </ResponsiveDialog>
                    );

                    // Verify: Should use Dialog (not Sheet) on desktop
                    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
                    expect(dialogContent).toBeInTheDocument();

                    // Verify: Should NOT use Sheet
                    const sheetContent = document.querySelector('[data-slot="sheet-content"]');
                    expect(sheetContent).not.toBeInTheDocument();
                }
            ),
            { numRuns: 15 }
        );
    });
});
