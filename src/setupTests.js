// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock react-chartjs-2 Line and Bar components for tests
jest.mock('react-chartjs-2', () => ({
    Line: (props) => <div data-testid="mock-line-chart" data-label={props?.data?.datasets?.[0]?.label} />,
    Bar: (props) => <div data-testid="mock-bar-chart" data-label={props?.data?.datasets?.[0]?.label} />,
}));


