import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Sheet,
  MessageSquare,
  Columns3,
  CalendarDays,
  Wallet,
  ClipboardList,
  Play,
  Pause,
  Check,
  Plus,
  Send,
  CircleCheck,
  Cloud,
} from "lucide-react";
import "./LandingProductDemo.css";

const FEATURES = [
  { name: "Google Docs", detail: "Document management", Icon: FileText },
  { name: "Google Sheets", detail: "Spreadsheet management", Icon: Sheet },
  {
    name: "Team Chat",
    detail: "Stay in the conversation",
    Icon: MessageSquare,
  },
  { name: "Trello", detail: "Turn plans into progress", Icon: Columns3 },
  { name: "Calendar", detail: "Make every event count", Icon: CalendarDays },
  {
    name: "Finance",
    detail: "Every contribution, accounted for",
    Icon: Wallet,
  },
  { name: "Google Forms", detail: "Forms and responses", Icon: ClipboardList },
];
const TASKS = [
  "Design event poster",
  "Prepare presentation",
  "Confirm event venue",
  "Publish announcement",
];
const EXPENSES = [
  ["Venue booking", "Events", "800,000 ₫", "Paid"],
  ["Poster printing", "Marketing", "200,000 ₫", "Paid"],
  ["Refreshments", "Events", "300,000 ₫", "Paid"],
];
const BODY =
  "Meeting Agenda\n\n1. Review upcoming club events.\n2. Assign tasks to team members.\n3. Discuss monthly activities.";
const type = (text, tick, start, duration) =>
  text.slice(
    0,
    Math.floor(
      text.length * Math.min(1, Math.max(0, (tick - start) / duration)),
    ),
  );
const vnd = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function Simulation({ feature, tick, reduced }) {
  if (feature === 0)
    return (
      <>
        <div className="lpd-toolbar">
          <span>
            <FileText size={15} /> Club documents / Meeting notes
          </span>
          <span className={tick >= 65 ? "lpd-success" : ""}>
            <Cloud size={14} />
            {tick < 52 ? "Draft" : tick < 65 ? "Saving…" : "Saved"}
          </span>
        </div>
        {tick < 10 ? (
          <div className="lpd-start">
            <FileText size={40} />
            <h4>A home for your club’s ideas</h4>
            <span className="lpd-action">
              <Plus size={14} /> New Document
            </span>
          </div>
        ) : (
          <div className="lpd-paper">
            <div className="lpd-format">
              B <i>I</i> <u>U</u> <span>Normal text ▾</span>
            </div>
            <h4>
              {type("Club Weekly Meeting Notes", tick, 10, 15)}
              {tick < 25 && <b className="lpd-caret" />}
            </h4>
            <div
              className={
                tick >= 55 ? "lpd-document lpd-formatted" : "lpd-document"
              }
            >
              {type(BODY, tick, 25, 27)}
              {tick >= 25 && tick < 52 && <b className="lpd-caret" />}
            </div>
            {tick >= 65 && (
              <small className="lpd-success">
                <Check size={13} /> All changes saved
              </small>
            )}
          </div>
        )}
      </>
    );
  if (feature === 1)
    return (
      <>
        <div className="lpd-toolbar">
          <span>Club event expenses</span>
          <span className="lpd-success">
            {tick > 55 ? "✓ Calculated" : "Editing cells"}
          </span>
        </div>
        <div className="lpd-formula">
          <strong>
            {tick < 55 ? `C${Math.min(4, 2 + Math.floor(tick / 18))}` : "C5"}
          </strong>
          <span>ƒx</span>
          {tick > 55 ? "=SUM(C2:C4)" : "Event budget"}
        </div>
        <table className="lpd-sheet">
          <thead>
            <tr>
              {["", "A", "B", "C", "D"].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>1</th>
              {["Item", "Category", "Amount", "Status"].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
            {EXPENSES.map((row, index) => (
              <tr key={row[0]}>
                <th>{index + 2}</th>
                {row.map((cell, col) => (
                  <td
                    className={
                      Math.floor(tick / 18) === index && col === 2
                        ? "lpd-cell-active"
                        : ""
                    }
                    key={col}
                  >
                    {tick > index * 18 + 5
                      ? type(cell, tick, index * 18 + 5, 9)
                      : ""}
                  </td>
                ))}
              </tr>
            ))}
            <tr className={tick > 55 ? "lpd-total" : ""}>
              <th>5</th>
              <td colSpan="2">Total</td>
              <td colSpan="2">{tick > 55 ? "1,300,000 ₫" : "—"}</td>
            </tr>
          </tbody>
        </table>
        <small className="lpd-note">A clear budget. A confident team.</small>
      </>
    );
  if (feature === 2)
    return (
      <>
        <div className="lpd-toolbar">
          <span># event-planning</span>
          <span className="lpd-success">3 members online</span>
        </div>
        <div className="lpd-chat">
          {[
            {
              name: "Alex",
              text: "Is everything ready for Friday’s event?",
              at: 6,
            },
            { name: "Jamie", text: "The venue is confirmed!", at: 25 },
            {
              name: "You",
              text: "Great! I’ll finalize the task list.",
              at: 53,
            },
          ].map(
            (message) =>
              tick >= message.at && (
                <div
                  className={`lpd-message ${message.name === "You" ? "lpd-mine" : ""}`}
                  key={message.name}
                >
                  <span className="lpd-avatar">{message.name[0]}</span>
                  <div>
                    <small>
                      {message.name} · 10:
                      {message.name === "Alex" ? "30" : "31"}
                    </small>
                    <div className="lpd-bubble">{message.text}</div>
                    {message.name === "You" && <small>✓✓ Delivered</small>}
                  </div>
                </div>
              ),
          )}
          {tick > 14 && tick < 25 && (
            <div className="lpd-typing">
              Jamie is typing <span>•••</span>
            </div>
          )}
        </div>
        <div className="lpd-compose">
          <span>
            {tick > 34 && tick < 53
              ? type("Great! I’ll finalize the task list.", tick, 34, 17)
              : "Message your team…"}
          </span>
          <Send size={16} />
        </div>
      </>
    );
  if (feature === 3) {
    const columns = [tick < 23 ? 0 : tick < 49 ? 1 : 2, 0, 2, 1];
    return (
      <>
        <div className="lpd-toolbar">
          <span>Friday event / Task board</span>
          <span>
            {tick >= 49 ? "2 tasks completed" : "4 tasks · 3 teammates"}
          </span>
        </div>
        <div className="lpd-kanban">
          {["To Do", "In Progress", "Done"].map((name, col) => (
            <div className="lpd-column" key={name}>
              <h4>
                {name} <small>{columns.filter((x) => x === col).length}</small>
              </h4>
              {TASKS.map(
                (task, index) =>
                  columns[index] === col && (
                    <motion.div
                      layout
                      layoutId={`demo-task-${index}`}
                      transition={{
                        duration: reduced ? 0 : 0.65,
                        type: "tween",
                      }}
                      className={`lpd-task ${index === 0 ? "lpd-moving" : ""}`}
                      key={task}
                    >
                      <span className="lpd-tag">
                        {index === 0 ? "Design" : "Event team"}
                      </span>
                      <strong>{task}</strong>
                      <div>
                        <span className="lpd-avatar">
                          {index % 2 ? "J" : "A"}
                        </span>
                        {col === 2 ? (
                          <CircleCheck size={15} />
                        ) : (
                          <small>Friday</small>
                        )}
                      </div>
                    </motion.div>
                  ),
              )}
            </div>
          ))}
        </div>
      </>
    );
  }
  if (feature === 4)
    return (
      <>
        <div className="lpd-toolbar">
          <span>November 2026</span>
          <span>Club calendar</span>
        </div>
        <div className="lpd-calendar">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <strong key={index}>{day}</strong>
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <div
              className={i === 12 && tick > 8 ? "lpd-date-active" : ""}
              key={i}
            >
              {i < 30 ? i + 1 : ""}
              {i === 12 && tick >= 56 && (
                <span>
                  Planning
                  <br />
                  16:00
                </span>
              )}
            </div>
          ))}
        </div>
        {tick >= 18 && tick < 56 && (
          <div className="lpd-event-panel">
            <small>NEW EVENT · NOV 13</small>
            <strong>
              {type("Club Planning Meeting", tick, 18, 20)}
              <b className="lpd-caret" />
            </strong>
            {tick > 36 && <span>16:00 – 17:00 · Club room</span>}
            <span className="lpd-action">
              {tick > 48 ? "✓ Saving…" : "Save event"}
            </span>
          </div>
        )}
        {tick >= 56 && (
          <small className="lpd-note lpd-success">
            ✓ Event added to your club calendar
          </small>
        )}
      </>
    );
  if (feature === 5)
    return (
      <>
        <div className="lpd-finance-cards">
          {[
            ["Total Balance", tick > 42 ? 5700000 : 5200000],
            ["Income", tick > 42 ? 7500000 : 7000000],
            ["Expenses", 1800000],
          ].map(([label, value]) => (
            <div
              key={label}
              className={
                tick > 42 && label === "Total Balance" ? "lpd-total" : ""
              }
            >
              <small>{label}</small>
              <strong>{vnd(value)}</strong>
            </div>
          ))}
        </div>
        <div
          className="lpd-chart"
          aria-label="Illustrative monthly income chart"
        >
          {[35, 52, 44, 72, 60, 88].map((height, index) => (
            <div key={index}>
              <i style={{ height: `${tick > 5 ? height : 5}%` }} />
              <small>{["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][index]}</small>
            </div>
          ))}
        </div>
        <div className="lpd-transactions">
          <strong>Recent transactions</strong>
          <div>
            <span>
              Venue booking <small>Today · Expense</small>
            </span>
            <b>−800,000 ₫</b>
          </div>
          {tick > 42 && (
            <div className="lpd-new-transaction">
              <span>
                Membership contribution <small>Just now · Income</small>
              </span>
              <b className="lpd-success">+500,000 ₫</b>
            </div>
          )}
        </div>
      </>
    );
  return (
    <>
      <div className="lpd-toolbar">
        <span>Forms / Event registration</span>
        <span>{tick >= 60 ? "Preview" : "Building your form"}</span>
      </div>
      {tick < 8 ? (
        <div className="lpd-start">
          <ClipboardList size={40} />
          <h4>Bring your next event together</h4>
          <span className="lpd-action">
            <Plus size={14} /> New form
          </span>
        </div>
      ) : (
        <div className="lpd-form-preview">
          <div className="lpd-form-accent" />
          <h4>
            {type("Club Event Registration", tick, 8, 17)}
            {tick < 25 && <b className="lpd-caret" />}
          </h4>
          <small>Join us for our next club event.</small>
          {tick >= 27 && (
            <div className="lpd-question">
              <strong>
                {type("Will you attend the event?", tick, 27, 14)}
              </strong>
              {["Yes", "No", "Maybe"].map(
                (option, index) =>
                  tick >= 43 + index * 5 && (
                    <div className="lpd-option" key={option}>
                      <i />
                      {option}
                    </div>
                  ),
              )}
            </div>
          )}
          {tick >= 60 && (
            <span className="lpd-action">
              <Check size={14} /> Form ready to share
            </span>
          )}
        </div>
      )}
    </>
  );
}

export default function LandingProductDemo() {
  const [feature, setFeature] = useState(0),
    [tick, setTick] = useState(0),
    [paused, setPaused] = useState(false),
    [visible, setVisible] = useState(false),
    [pageVisible, setPageVisible] = useState(!document.hidden),
    [reduced, setReduced] = useState(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const root = useRef(null),
    navigation = useRef(null),
    elapsed = useRef(0),
    featureRef = useRef(0);
  const running = !paused && visible && pageVisible && !reduced;
  const playing = useRef(running);
  playing.current = running;
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(root.current);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReduced(media.matches);
    const onVisibility = () => setPageVisible(!document.hidden);
    media.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (!playing.current) return;
      elapsed.current += 1;
      if (elapsed.current >= 75) {
        elapsed.current = 0;
        featureRef.current = (featureRef.current + 1) % FEATURES.length;
        setFeature(featureRef.current);
      }
      setTick(elapsed.current);
    }, 100);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    const nav = navigation.current,
      button = nav?.children[feature];
    if (!button) return;
    const horizontal = nav.scrollWidth > nav.clientWidth;
    nav.scrollTo({
      left: horizontal
        ? Math.max(
            0,
            button.offsetLeft -
              nav.offsetLeft -
              nav.clientWidth / 2 +
              button.clientWidth / 2,
          )
        : 0,
      top: horizontal
        ? 0
        : Math.max(
            0,
            button.offsetTop -
              nav.offsetTop -
              nav.clientHeight / 2 +
              button.clientHeight / 2,
          ),
      behavior: reduced ? "instant" : "smooth",
    });
  }, [feature, reduced]);
  function select(index) {
    elapsed.current = 0;
    featureRef.current = index;
    setFeature(index);
    setTick(0);
  }
  const current = FEATURES[feature];
  return (
    <section
      ref={root}
      className="lpd"
      aria-label="Interactive S-Club product demo"
      data-playing={running}
    >
      <div className="lpd-window">
        <div className="lpd-brand">
          <img src="/logo.png" alt="" />
          S-Club <span>Workspace</span>
        </div>

        <span className="lpd-window-dots" aria-hidden="true">
          ● ● ●
        </span>
      </div>
      <div className="lpd-app">
        <aside className="lpd-sidebar">
          <small>YOUR WORKSPACE</small>
          <nav ref={navigation} aria-label="Demo features">
            {FEATURES.map(({ name, Icon }, index) => (
              <button
                type="button"
                key={name}
                aria-pressed={feature === index}
                onClick={() => select(index)}
              >
                <Icon size={17} />
                <span>{name}</span>
                {feature === index && <i />}
              </button>
            ))}
          </nav>
          <div className="lpd-club">
            <span className="lpd-avatar">C</span>
            <span>
              Campus Creators<small>Fictional demo club</small>
            </span>
          </div>
        </aside>
        <div className="lpd-workspace">
          <header>
            <div>
              <small>ONE CLUB. EVERYTHING CONNECTED.</small>
              <h3>{current.name}</h3>
              <span>{current.detail}</span>
            </div>
            <span
              className="lpd-team"
              aria-label="Three fictional team members"
            >
              <i>A</i>
              <i>J</i>
              <i>Y</i>
            </span>
          </header>
          <div className="lpd-scene" key={feature}>
            <Simulation
              feature={feature}
              tick={reduced ? 74 : tick}
              reduced={reduced}
            />
          </div>
        </div>
      </div>
      <div className="lpd-playback">
        <span>
          <i className={running ? "lpd-live" : ""} />
          {reduced
            ? "Reduced motion · Select a feature"
            : paused
              ? "Playback paused"
              : !visible || !pageVisible
                ? "Playback on hold"
                : "Auto-playing"}{" "}
          <b>
            {feature + 1} / {FEATURES.length}
          </b>
        </span>
        <button
          type="button"
          disabled={reduced}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Resume demo" : "Pause demo"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
      <div className="lpd-progress" aria-hidden="true">
        <i style={{ width: `${reduced ? 100 : (tick / 75) * 100}%` }} />
      </div>
    </section>
  );
}
