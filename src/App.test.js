import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders anagram helper heading and controls", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /anagram ring helper/i })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /letters/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /randomise letters/i })).toBeDisabled();
});
