import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import { MdCheckCircle, MdRadioButtonUnchecked } from "react-icons/md";
import { FaAlignLeft, FaEraser, FaSpinner } from "react-icons/fa";
import "./Home.css";
import { motion } from "framer-motion";

import courseData from "../content/courseData";
import { chapters as importedChapters } from "../content/chapters/Chapters";
import { restoreFromSuspend } from "../utils/scormSync";

const storage = {
  get: (key) => localStorage.getItem(`${keyPrefix}${key}`),
  set: (key, val) => localStorage.setItem(`${keyPrefix}${key}`, val),
  remove: (key) => localStorage.removeItem(`${keyPrefix}${key}`),
};

const courseId = courseData.courseId;
const keyPrefix = `${courseId}_`;

const Home = () => {
  const scormRef = useRef(null);
  const navigate = useNavigate();
  const [courseInfo, setCourseInfo] = useState({
    name: "",
    introduction: [],
    image: "/path-to-your-image.jpg",
  });
  const [chapters, setChapters] = useState([]);
  const [localProgress, setLocalProgress] = useState(0);
  const [hasStartedCourse, setHasStartedCourse] = useState(false);
  const [suspendRestored, setSuspendRestored] = useState(false);

  useEffect(() => {
    const ok = !!window.DiscereSCORM;

    if (ok) {
      sessionStorage.removeItem("fromFinish");
    }
  }, [navigate]);

  useEffect(() => {
    scormRef.current = window.DiscereSCORM;
  }, []);

  useEffect(() => {
    const trySyncWithSuspend = (retries = 5) => {
      const scorm = window.DiscereSCORM;
      if (scorm) {
        if (!scorm.isActive) {
          const ok = scorm.initialize();
          console.log("🎯 SCORM initialize() →", ok);
        }
        if (scorm.isActive) {
          console.log(
            "🔄 SCORM ativo — restaurando progresso do suspend_data..."
          );
          restoreFromSuspend(() => setSuspendRestored(true));
          return;
        }
      }
      // Allow the LMS API time to become available before falling back to web mode.
      if (!scorm && retries > 0) {
        setTimeout(() => trySyncWithSuspend(retries - 1), 100);
      } else if (!scorm) {
        console.log("🌐 Ambiente web — nenhum SCORM detectado.");
        setSuspendRestored(true);
      }
    };

    trySyncWithSuspend();
  }, []);

  useEffect(() => {
    const updateFlag = sessionStorage.getItem("updateHomeChapters");
    if (updateFlag === "true") {
      sessionStorage.removeItem("updateHomeChapters");
      setSuspendRestored(false);
      restoreFromSuspend(() => setSuspendRestored(true));
    }
  }, []);

  useEffect(() => {
    // Wait until SCORM progress restoration completes.
    if (!suspendRestored || importedChapters.length === 0) return;

    const completedLessons = JSON.parse(
      localStorage.getItem(`${keyPrefix}completedLessons`) || "[]"
    );

    const updatedChapters = importedChapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        const key = `${chapter.id}_${lesson.id}`;
        const completed = completedLessons.includes(key);
        return { ...lesson, completed };
      }),
    }));

    setChapters(updatedChapters);

    setCourseInfo({
      name: courseData.courseName || "Untitled Course",
      introduction: courseData.courseIntroduction,
      image: courseData.courseImage || "/path-to-your-image.jpg",
    });
  }, [suspendRestored]);

  useEffect(() => {
    if (chapters.length === 0) return;

    let sumProgress = 0;
    let lessonCount = 0;

    chapters.forEach((chap) => {
      chap.lessons.forEach((les) => {
        const lk = `${chap.id}_${les.id}`;
        let pct = parseInt(storage.get(`progress_${lk}`), 10) || 0;
        if (pct > 100) pct = 100;
        sumProgress += pct;
        lessonCount += 1;
      });
    });

    const globalProgress =
      lessonCount > 0 ? Math.round(sumProgress / lessonCount) : 0;
    setLocalProgress(globalProgress);
  }, [chapters]);

  useEffect(() => {
    let hasAnyProgress = false;

    importedChapters.forEach((chap) => {
      chap.lessons.forEach((les) => {
        const key = `${chap.id}_${les.id}`;
        const vistos = JSON.parse(storage.get(`seen_${key}`)) || [];

        if (vistos.length > 0) {
          hasAnyProgress = true;
        }
      });
    });

    setHasStartedCourse(hasAnyProgress);
  }, []);

  useEffect(() => {
    return () => {
      sessionStorage.removeItem("internalNav");
    };
  }, []);

  const handleStartCourse = () => {
    for (const chap of chapters) {
      for (const les of chap.lessons) {
        const key = `${chap.id}_${les.id}`;
        const pct = Math.min(
          100,
          parseInt(storage.get(`progress_${key}`), 10) || 0
        );
        if (pct < 100) {
          window.__navigatingInternally__ = true;
          sessionStorage.setItem("internalNav", "true");
          navigate(`/lesson/${chap.id}/${les.id}`);
          return;
        }
      }
    }

    if (chapters.length > 0) {
      const [firstChap] = chapters;
      const [firstLes] = firstChap.lessons;
      window.__navigatingInternally__ = true;
      sessionStorage.setItem("internalNav", "true");
      navigate(`/lesson/${firstChap.id}/${firstLes.id}`);
    }
  };

  // SCORM mode uses restored suspend_data; web mode uses local course state.
  const scormApi = window.DiscereSCORM;
  const courseStarted = scormApi ? localProgress > 0 : hasStartedCourse;

  if (!suspendRestored) {
    return (
      <div className="loading-overlay">
        <FaSpinner size={48} className="loading-icon" />
        <span className="loading-text">Loading course progress...</span>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="course-header-container">
        <div className="course-header">
          <div className="course-info">
            {courseInfo.name && <h1>{courseInfo.name}</h1>}
            <p className="course-info-percentage">
              Course progress: {localProgress}%
            </p>

            <button className="start-course-btn" onClick={handleStartCourse}>
              {courseStarted ? "Continue Course" : "Start Course"}
            </button>

            {!window.DiscereSCORM?.isActive && (
              <button
                className="reset-progress-btn"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear local progress (without affecting LMS data)?"
                    )
                  ) {
                    Object.keys(localStorage).forEach((key) => {
                      if (key.startsWith(keyPrefix)) {
                        storage.remove(key.replace(keyPrefix, ""));
                      }
                    });

                    sessionStorage.clear();

                    if (window.DiscereSCORM?.isActive) {
                      alert(
                        "Local data cleared. On reload, progress will be restored from the LMS."
                      );
                    }

                    window.location.reload();
                  }
                }}
              >
                <FaEraser
                  size={15}
                  className="inline-block mr-2 align-text-bottom"
                  style={{ marginRight: "0.5rem", color: "#4A5568" }}
                />
                Clear Progress
              </button>
            )}

            <div className="course-intro">
              {courseInfo.introduction.map((text, index) => (
                <p key={index}>{text}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="course-image-container">
          <motion.div
            className="course-image"
            initial={{ clipPath: "circle(0% at 50% 50%)", opacity: 0 }}
            animate={{ clipPath: "circle(100% at 50% 50%)", opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <img src={courseInfo.image} alt="Curso" />
          </motion.div>
        </div>
      </div>

      <div className="course-content">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="chapter">
            <h2>{chapter.chapterName}</h2>
            {chapter.lessons.map((lesson) => (
              <Link
                to={`/lesson/${chapter.id}/${lesson.id}`}
                key={lesson.id}
                className="lesson-item"
              >
                <div className="lesson-icon">
                  <FaAlignLeft color="gray" size={18} />
                </div>

                <span className="lesson-name">{lesson.name}</span>
                <div
                  className={`lesson-status ${
                    lesson.completed ? "completed" : ""
                  }`}
                >
                  {lesson.completed ? (
                    <MdCheckCircle color="green" size={18} />
                  ) : (
                    <MdRadioButtonUnchecked color="gray" size={18} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
