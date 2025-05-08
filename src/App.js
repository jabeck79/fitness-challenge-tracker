// React app with localStorage, charts, and challenge logic for Adam and Katie
// Includes: points system, weekly tracker, leaderboard, achievements

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const USERS = ["Katie Beckman", "Adam Beckman"];
const WEEK_START = new Date("2025-05-12");
const WEEK_END = new Date("2025-06-09");
const getWeekKey = (date) => {
  const d = new Date(date);
  const monday = new Date(d.setDate(d.getDate() - d.getDay() + 1));
  return monday.toISOString().split("T")[0];
};

const ACTIVITIES = [
  { name: "Carbon Fitness Class", key: "carbon", points: 2 },
  { name: "Yoga (45–60 min)", key: "yoga1", points: 1 },
  { name: "Yoga (>75 min)", key: "yoga2", points: 2 },
  { name: "Hydration >90oz", key: "hydration", points: 1 },
  { name: "Cardio/Bike/Run/Hike", key: "cardio", points: 1 },
  { name: "Breathing/Meditation", key: "meditation", points: 1 },
  { name: "Weekly Challenge Completed", key: "weekly", points: 3 },
  { name: "Alcohol Consumption", key: "alcohol", points: -5 },
  { name: "Sugar Treat", key: "sugar", points: -2 }
];

export default function FitnessChallengeApp() {
  const [log, setLog] = useState(() => {
    const stored = localStorage.getItem("fitnessLog");
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem("fitnessLog", JSON.stringify(log));
  }, [log]);

  const today = new Date().toISOString().split("T")[0];

  const handleToggle = (user, date, activityKey) => {
    setLog((prev) => {
      const updated = { ...prev };
      if (!updated[date]) updated[date] = {};
      if (!updated[date][user]) updated[date][user] = [];
      const idx = updated[date][user].indexOf(activityKey);
      if (idx === -1) {
        updated[date][user].push(activityKey);
      } else {
        updated[date][user].splice(idx, 1);
      }
      return updated;
    });
  };

  const getWeeklyScores = () => {
    const weeks = {};
    Object.keys(log).forEach((date) => {
      const week = getWeekKey(date);
      if (!weeks[week]) weeks[week] = { week, ...Object.fromEntries(USERS.map(u => [u, 0])) };
      USERS.forEach((user) => {
        const activities = log[date]?.[user] || [];
        activities.forEach((key) => {
          const activity = ACTIVITIES.find((a) => a.key === key);
          if (activity) weeks[week][user] += activity.points;
        });
      });
    });
    return Object.values(weeks).sort((a, b) => new Date(a.week) - new Date(b.week));
  };

  const getTotalScores = () => {
    const totals = Object.fromEntries(USERS.map(u => [u, 0]));
    Object.keys(log).forEach((date) => {
      USERS.forEach((user) => {
        const activities = log[date]?.[user] || [];
        activities.forEach((key) => {
          const activity = ACTIVITIES.find((a) => a.key === key);
          if (activity) totals[user] += activity.points;
        });
      });
    });
    return totals;
  };

  const getAchievement = (score, maxScore) => {
    const pct = score / maxScore;
    if (pct >= 0.9) return { label: "💎 Diamond", color: "text-blue-500", confetti: true };
    if (pct >= 0.75) return { label: "🥇 Gold", color: "text-yellow-500", confetti: true };
    if (pct >= 0.5) return { label: "🥈 Silver", color: "text-gray-500", confetti: false };
    if (pct >= 0.25) return { label: "🥉 Bronze", color: "text-orange-400", confetti: false };
    return { label: "🏁 Participant", color: "text-green-500", confetti: false };
  };

  const weeklyScores = getWeeklyScores();
  const totalScores = getTotalScores();
  const maxTotal = Math.max(...Object.values(totalScores));

  useEffect(() => {
    USERS.forEach((user) => {
      const { confetti: doConfetti } = getAchievement(totalScores[user], maxTotal);
      if (doConfetti) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    });
  }, [totalScores]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">Beckman Fitness Challenge</h1>
      <p className="text-center text-sm mb-6">May 12 – June 9, 2025</p>

      <div className="space-y-6 mb-10">
        {USERS.map((user) => (
          <div key={user} className="bg-white shadow p-4 rounded-xl">
            <h2 className="text-xl font-semibold mb-2 text-purple-600">{user}</h2>
            <p className="text-sm text-gray-500 mb-2">Log for: {today}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTIVITIES.map((act) => {
                const isChecked = log?.[today]?.[user]?.includes(act.key) || false;
                return (
                  <label
                    key={act.key}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(user, today, act.key)}
                    />
                    <span>
                      {act.name} ({act.points > 0 ? "+" : ""}
                      {act.points} pts)
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4 text-center">Weekly Leaderboard</h2>
      <div className="bg-white shadow p-4 rounded-xl mb-10">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyScores} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Katie Beckman" fill="#9B51E0" />
            <Bar dataKey="Adam Beckman" fill="#4285F4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-center">Final Achievements</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {USERS.map((user) => {
          const { label, color } = getAchievement(totalScores[user], maxTotal);
          return (
            <motion.div
              key={user}
              className="bg-white shadow p-4 rounded-xl text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold text-purple-700 mb-2">{user}</h3>
              <p className="text-lg">Total Points: <strong>{totalScores[user]}</strong></p>
              <motion.p
                className={`mt-2 text-2xl font-bold ${color}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1.1 }}
                transition={{ yoyo: Infinity, duration: 1 }}
              >
                {label}
              </motion.p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
