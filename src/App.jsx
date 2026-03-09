import { useMemo, useState } from 'react';

const defaultOutputName = 'merged_document.pdf';

function App() {
  const desktopApi = window.pdfMerger;
  const [files, setFiles] = useState([]);
  const [outputFolder, setOutputFolder] = useState('');
  const [outputName, setOutputName] = useState(defaultOutputName);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({
    kind: 'info',
    text: 'Choose PDF files or load a folder to begin.',
  });

  const fileCountLabel = useMemo(() => {
    if (files.length === 0) {
      return 'No files selected';
    }

    return `${files.length} file${files.length > 1 ? 's' : ''} selected`;
  }, [files]);

  const mergeUniqueFiles = (nextFiles, replace = false) => {
    setFiles((currentFiles) => {
      const source = replace ? [] : currentFiles;
      const fileMap = new Map(source.map((file) => [file.path, file]));

      nextFiles.forEach((file) => {
        fileMap.set(file.path, file);
      });

      return Array.from(fileMap.values());
    });
  };

  const handleAddFiles = async () => {
    if (!desktopApi) {
      return;
    }

    const selectedFiles = await desktopApi.selectFiles();
    if (!selectedFiles.length) {
      return;
    }

    mergeUniqueFiles(selectedFiles);
    setOutputFolder((current) => current || selectedFiles[0].directory);
    setStatus({
      kind: 'info',
      text: `${selectedFiles.length} PDF file${selectedFiles.length > 1 ? 's were' : ' was'} added.`,
    });
  };

  const handleLoadFolder = async () => {
    if (!desktopApi) {
      return;
    }

    const result = await desktopApi.selectFolder();
    if (!result?.folderPath) {
      return;
    }

    if (!result.files.length) {
      setStatus({
        kind: 'error',
        text: 'The selected folder does not contain PDF files.',
      });
      return;
    }

    mergeUniqueFiles(result.files, true);
    setOutputFolder(result.folderPath);
    setStatus({
      kind: 'success',
      text: `Loaded ${result.files.length} PDF files from ${result.folderPath}.`,
    });
  };

  const handleChooseOutputFolder = async () => {
    if (!desktopApi) {
      return;
    }

    const folder = await desktopApi.selectOutputFolder();
    if (!folder) {
      return;
    }

    setOutputFolder(folder);
    setStatus({
      kind: 'info',
      text: `Output folder set to ${folder}.`,
    });
  };

  const moveFile = (index, direction) => {
    setFiles((currentFiles) => {
      const nextFiles = [...currentFiles];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= nextFiles.length) {
        return currentFiles;
      }

      const [movedFile] = nextFiles.splice(index, 1);
      nextFiles.splice(targetIndex, 0, movedFile);
      return nextFiles;
    });
  };

  const removeFile = (pathToRemove) => {
    setFiles((currentFiles) => currentFiles.filter((file) => file.path !== pathToRemove));
  };

  const handleMerge = async () => {
    if (!desktopApi || files.length < 2 || !outputFolder.trim()) {
      return;
    }

    try {
      setBusy(true);
      setStatus({ kind: 'info', text: 'Merging PDFs...' });

      const result = await desktopApi.mergePdfs({
        files: files.map((file) => file.path),
        outputFolder,
        outputName,
      });

      setStatus({
        kind: 'success',
        text: `Merged ${result.fileCount} files into ${result.outputPath}.`,
      });
    } catch (error) {
      setStatus({
        kind: 'error',
        text: error?.message || 'Unable to merge the selected PDF files.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Desktop PDF utility</p>
          <h1>Merge PDFs with file browsing and ordered output.</h1>
          <p className="hero-copy">
            Built as a desktop application with a React UI and native file dialogs.
            Choose files, load a folder, reorder the stack, and export a merged PDF.
          </p>
        </div>

        <div className="hero-actions">
          <button className="primary-button" onClick={handleAddFiles} type="button">
            Add PDF files
          </button>
          <button className="secondary-button" onClick={handleLoadFolder} type="button">
            Load folder
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="panel files-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Input selection</p>
              <h2>PDF queue</h2>
            </div>
            <span className="badge">{fileCountLabel}</span>
          </div>

          <p className="panel-copy">
            The order below is the order used in the merged output.
          </p>

          <div className="file-list">
            {files.length === 0 ? (
              <div className="empty-state">
                <strong>No PDF files yet.</strong>
                <span>Add individual files or load a folder to start.</span>
              </div>
            ) : (
              files.map((file, index) => (
                <div className="file-row" key={file.path}>
                  <div>
                    <strong>{index + 1}. {file.name}</strong>
                    <span>{file.path}</span>
                  </div>

                  <div className="row-actions">
                    <button onClick={() => moveFile(index, -1)} type="button">↑</button>
                    <button onClick={() => moveFile(index, 1)} type="button">↓</button>
                    <button onClick={() => removeFile(file.path)} type="button">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel output-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Export settings</p>
              <h2>Output</h2>
            </div>
          </div>

          <label className="field-group">
            <span>Output folder</span>
            <div className="field-inline">
              <input
                onChange={(event) => setOutputFolder(event.target.value)}
                placeholder="Choose where the merged PDF will be saved"
                value={outputFolder}
              />
              <button className="secondary-button" onClick={handleChooseOutputFolder} type="button">
                Browse
              </button>
            </div>
          </label>

          <label className="field-group">
            <span>Output file name</span>
            <input
              onChange={(event) => setOutputName(event.target.value)}
              placeholder={defaultOutputName}
              value={outputName}
            />
          </label>

          <div className={`status-banner ${status.kind}`}>
            {status.text}
          </div>

          <button
            className="merge-button"
            disabled={busy || files.length < 2 || !outputFolder.trim()}
            onClick={handleMerge}
            type="button"
          >
            {busy ? 'Merging...' : 'Merge PDFs'}
          </button>

          <div className="tips-card">
            <strong>Suggested next improvements</strong>
            <ul>
              <li>Drag and drop ordering</li>
              <li>PDF split and extract modes</li>
              <li>Saved presets for common output folders</li>
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}

export default App;
