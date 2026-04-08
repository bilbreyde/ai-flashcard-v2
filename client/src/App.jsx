import { useState, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import Setup from "./components/Setup";
import Quiz from "./components/Quiz";
import Summary from "./components/Summary";

function AppInner() {
  const { user } = useAuth();
  const [screen, setScreen] = useState("setup");
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [certId, setCertId] = useState("google-ai-leadership");

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

  const restart = useCallback(() => setScreen("setup"), []);

  if (!user) return <AuthScreen />;

  return (
    <div className="app">
      {screen === "setup" && <Setup onStart={startQuiz} />}
      {screen === "quiz" && <Quiz questions={questions} onFinish={finishQuiz} />}
      {screen === "summary" && (
        <Summary results={results} certId={certId} onRestart={restart} onRetry={restart} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
