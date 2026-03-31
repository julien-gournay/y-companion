import { render, screen } from "@testing-library/react";

jest.mock("@assistant-ui/react", () => ({
  AssistantRuntimeProvider: ({ children }) => children,
  useLocalRuntime: () => ({}),
}));

jest.mock("@/components/assistant-ui/thread", () => ({
  Thread: () => <div>Campus Thread Component</div>,
}));

import App from "./App";

test("renders thread component", () => {
  render(<App />);
  const threadElement = screen.getByText(/campus thread component/i);
  expect(threadElement).toBeInTheDocument();
});
