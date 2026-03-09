import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function createDesktopApiMock(overrides = {}) {
  return {
    selectFiles: vi.fn().mockResolvedValue([]),
    selectFolder: vi.fn().mockResolvedValue({ folderPath: '', files: [] }),
    selectOutputFolder: vi.fn().mockResolvedValue(''),
    mergePdfs: vi.fn().mockResolvedValue({
      fileCount: 2,
      outputPath: '/tmp/merged_document.pdf',
    }),
    ...overrides,
  };
}

function setDesktopApiMock(mock) {
  Object.defineProperty(window, 'pdfMerger', {
    configurable: true,
    writable: true,
    value: mock,
  });
}

const selectedFiles = [
  {
    name: 'alpha.pdf',
    path: '/tmp/alpha.pdf',
    directory: '/tmp',
  },
  {
    name: 'beta.pdf',
    path: '/tmp/beta.pdf',
    directory: '/tmp',
  },
];

describe('App', () => {
  beforeEach(() => {
    setDesktopApiMock(createDesktopApiMock());
  });

  afterEach(() => {
    delete window.pdfMerger;
  });

  it('renders the initial empty state and keeps merge disabled', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /merge pdfs with file browsing and ordered output/i })).toBeInTheDocument();
    expect(screen.getByText(/choose pdf files or load a folder to begin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /merge pdfs/i })).toBeDisabled();
  });

  it('adds selected files and fills the output folder automatically', async () => {
    const desktopApi = createDesktopApiMock({
      selectFiles: vi.fn().mockResolvedValue(selectedFiles),
    });
    setDesktopApiMock(desktopApi);

    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add pdf files/i }));

    expect(desktopApi.selectFiles).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('1. alpha.pdf')).toBeInTheDocument();
    expect(screen.getByText('2. beta.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText(/output folder/i)).toHaveValue('/tmp');
    expect(screen.getByRole('button', { name: /merge pdfs/i })).toBeEnabled();
  });

  it('merges the queued files and shows the success message', async () => {
    const desktopApi = createDesktopApiMock({
      selectFiles: vi.fn().mockResolvedValue(selectedFiles),
      mergePdfs: vi.fn().mockResolvedValue({
        fileCount: 2,
        outputPath: '/tmp/final.pdf',
      }),
    });
    setDesktopApiMock(desktopApi);

    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add pdf files/i }));
    await user.clear(screen.getByLabelText(/output file name/i));
    await user.type(screen.getByLabelText(/output file name/i), 'final-report.pdf');
    await user.click(screen.getByRole('button', { name: /merge pdfs/i }));

    await waitFor(() => {
      expect(desktopApi.mergePdfs).toHaveBeenCalledWith({
        files: ['/tmp/alpha.pdf', '/tmp/beta.pdf'],
        outputFolder: '/tmp',
        outputName: 'final-report.pdf',
      });
    });

    expect(await screen.findByText(/merged 2 files into \/tmp\/final\.pdf/i)).toBeInTheDocument();
  });
});
