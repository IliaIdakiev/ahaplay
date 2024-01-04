import "./App.css";
import { GlobalContextProvider } from "./contexts/Global";
import Router from "./Router";

function App() {
  return (
    <div className="App">
      <GlobalContextProvider>
        <Router />
      </GlobalContextProvider>
    </div>
  );
}

export default App;
