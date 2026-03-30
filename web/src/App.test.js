import { render, screen } from '@testing-library/react';

jest.mock('./components/chat/ChatInterface', () => ({
  ChatInterface: () => <div>Campus Companion Chat</div>,
}));

import App from './App';

test('renders campus companion header', () => {
  render(<App />);
  const headerElement = screen.getByText(/campus companion/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders chat container in app', () => {
  render(<App />);
  const chatElement = screen.getByText(/campus companion chat/i);
  expect(chatElement).toBeInTheDocument();
});
