import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Lesson from "./pages/Lesson";
import Header from "./components/Header";
import Footer from "./components/Footer";
import "./App.css";
import PageWrapper from "./components/PageWrapper";
import courseData from "./content/courseData";
window.courseData = courseData;

const AppRoutes = () => {
  const location = useLocation();
  const isLessonPage = location.pathname.startsWith("/lesson/");

  return (
    <>
      <Header />
      <main style={{ flex: 1, minHeight: "calc(100dvh - 130px)" }}>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route
              path="/"
              element={
                <PageWrapper>
                  <Home />
                </PageWrapper>
              }
            />
            <Route
              path="/lesson/:chapterId/:lessonId"
              element={
                <PageWrapper>
                  <Lesson />
                </PageWrapper>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer className={isLessonPage ? "hide-on-lesson" : ""} />
    </>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
