import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

// No StrictMode: react-leaflet's Leaflet map instance is imperative DOM state
// (L.map() marks its container as initialized and throws on a second call
// against the same node). StrictMode's dev-only mount->unmount->remount pass
// exercises exactly that path and can leave the map never actually attached,
// even though the rest of the React tree renders fine - which reads as "the
// business list shows but the map doesn't."
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
