import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import App from "./app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
            <h2>页面加载出错</h2>
            <pre style={{ whiteSpace: "pre-wrap", overflow: "auto" }}>
              {String(error)}
            </pre>
            <button onClick={resetErrorBoundary}>重试</button>
          </div>
        )}
      >
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
);
