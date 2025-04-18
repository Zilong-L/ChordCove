import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./stores/store.ts"; // 引入刚刚创建的 Redux Store
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
