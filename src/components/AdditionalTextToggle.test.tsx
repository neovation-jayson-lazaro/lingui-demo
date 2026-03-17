import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdditionalTextToggle } from "./AdditionalTextToggle";
import { renderWithI18n } from "../test/render-with-i18n";

describe("AdditionalTextToggle", () => {
  it("renders the label in English", async () => {
    await renderWithI18n(<AdditionalTextToggle />);
    expect(screen.getByText("Additional text:")).toBeInTheDocument();
  });

  it("renders the label in French", async () => {
    await renderWithI18n(<AdditionalTextToggle />, { locale: "fr" });
    expect(screen.getByText("Texte supplémentaire :")).toBeInTheDocument();
  });

  it("does not show additional text by default", async () => {
    await renderWithI18n(<AdditionalTextToggle />);
    expect(screen.queryByText("This is additional text.")).not.toBeInTheDocument();
  });

  it("shows additional text after toggling the switch", async () => {
    const user = userEvent.setup();
    await renderWithI18n(<AdditionalTextToggle />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("This is additional text.")).toBeInTheDocument();
  });

  it("shows translated additional text in French after toggle", async () => {
    const user = userEvent.setup();
    await renderWithI18n(<AdditionalTextToggle />, { locale: "fr" });

    await user.click(screen.getByRole("switch"));
    expect(
      screen.getByText("Ceci est du texte supplémentaire.")
    ).toBeInTheDocument();
  });

  it("hides additional text when toggled off again", async () => {
    const user = userEvent.setup();
    await renderWithI18n(<AdditionalTextToggle />);
    const toggle = screen.getByRole("switch");

    await user.click(toggle);
    expect(screen.getByText("This is additional text.")).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText("This is additional text.")).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("renders the label in Japanese", async () => {
    await renderWithI18n(<AdditionalTextToggle />, { locale: "ja" });
    expect(screen.getByText("追加テキスト：")).toBeInTheDocument();
  });

  it("renders the label in Spanish", async () => {
    await renderWithI18n(<AdditionalTextToggle />, { locale: "es" });
    expect(screen.getByText("Texto adicional:")).toBeInTheDocument();
  });
});
