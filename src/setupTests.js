import '@testing-library/jest-dom';


class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Silence specific warnings
const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  const suppressedWarnings = [
    'DEP0040',
    'React Router Future Flag Warning'
  ];
  
  if (typeof args[0] === 'string' && 
      suppressedWarnings.some(warning => args[0].includes(warning))) {
    return;
  }
  originalWarn(...args);
};

// Mock MUI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  TablePagination: ({ count, page, rowsPerPage, onPageChange, onRowsPerPageChange }) => (
    <div data-testid="table-pagination">
      <select
        data-testid="rows-per-page"
        value={rowsPerPage}
        onChange={(e) => onRowsPerPageChange(e)}
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>
  )
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});