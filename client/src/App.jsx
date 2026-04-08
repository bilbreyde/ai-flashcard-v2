import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import Setup from "./components/Setup";
import Quiz from "./components/Quiz";
import Summary from "./components/Summary";

function AppInner() {
  const { user } = useAuth();
  const [screen, setScreen] = useState("dashboard");
  const [certId, setCertId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);

  const selectCert = useCallback((id) => {
    setCertId(id);
    setScreen("setup");
  }, []);

  const startQuiz = useCallback(({ questions: qs, certId: cid }) => {
    setQuestions(qs);
    setCertId(cid);
    setResults([]);
    setScreen("quiz");
  }, []);

  const finishQuiz = useCallback((res) => {
    setResults(res);
    setScreen("summary");
  }, []);

  const goToDashboard = useCallback(() => setScreen("dashboard"), []);

  if (!user) return <AuthScreen />;

  return (
    <div className="app">
      {screen === "dashboard" && <Dashboard onSelectCert={selectCert} />}
      {screen === "setup" && <Setup certId={certId} onStart={startQuiz} onBack={goToDashboard} />}
      {screen === "quiz" && <Quiz questions={questions} onFinish={finishQuiz} />}
      {screen === "summary" && <Summary results={results} certId={certId} onRestart={goToDashboard} onRetry={() => selectCert(certId)} />}
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
