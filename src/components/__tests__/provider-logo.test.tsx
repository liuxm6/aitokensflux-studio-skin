import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderLogo } from "../provider-logo";

describe("ProviderLogo", () => {
  it("retains a monogram only for an unconfigured provider", () => {
    const { container } = render(<ProviderLogo provider="Unlisted provider" fallback="U" />);
    expect(container.querySelector("svg text")).toHaveTextContent("U");
    expect(container.querySelector("svg path")).not.toBeInTheDocument();
  });
  it("renders bundled marks without external image sources", () => {
    const { container } = render(
      <div>
        {["OpenAI", "Anthropic", "Google", "DeepSeek", "Mistral", "Meta", "Qwen"].map(
          (provider) => (
            <ProviderLogo key={provider} provider={provider} fallback={provider[0]} />
          ),
        )}
      </div>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(7);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(7);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("svg path")).toHaveLength(7);
    expect(container.querySelectorAll("svg text")).toHaveLength(0);
  });
});
