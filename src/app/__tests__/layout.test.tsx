import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", className: "inter" }),
  Montserrat: () => ({ variable: "--font-montserrat", className: "montserrat" }),
  Manrope: () => ({ variable: "--font-manrope", className: "manrope" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", className: "geist-mono" }),
}));

const mockHeaders = jest.fn();
jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("../layout-client", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: RootLayout } = require("../layout");

describe("RootLayout", () => {
  it("renders CSP nonce meta when x-nonce is present", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "x-nonce": "test-nonce-123" })
    );

    const element = await RootLayout({ children: <div>content</div> });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('meta name="csp-nonce"');
    expect(html).toContain('content="test-nonce-123"');
  });
});
