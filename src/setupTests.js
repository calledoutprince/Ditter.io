// Extend Vitest's expect with jest-dom matchers
// This gives us powerful DOM assertions like:
//   expect(element).toBeInTheDocument()
//   expect(element).toHaveTextContent('hello')
//   expect(element).toBeVisible()
import '@testing-library/jest-dom';
