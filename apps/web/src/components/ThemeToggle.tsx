"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "venturai-theme";

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked ? "dark" : "light";
    setTheme(next);
    setThemeState(next);
  }, []);

  const isDark = theme === "dark";

  return (
    <label
      className="theme-toggle"
      title="Toggle theme"
      htmlFor="venturai-theme-toggle"
    >
      <input
        id="venturai-theme-toggle"
        type="checkbox"
        checked={isDark}
        onChange={handleChange}
        aria-label="Toggle theme"
      />
      <span className="theme-toggle-sr">Toggle theme</span>
      <div className="theme-toggle__icon-wrapper">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          width="1em"
          height="1em"
          fill="currentColor"
          strokeLinecap="round"
          className="theme-toggle__classic theme-toggle__sun"
          viewBox="0 0 32 32"
        >
          <clipPath id="theme-toggle__classic__cutout">
            <path d="M0-5h30a1 1 0 0 0 9 13v24H0Z" />
          </clipPath>
          <g clipPath="url(#theme-toggle__classic__cutout)">
            <circle cx="16" cy="16" r="9.34" />
            <g stroke="currentColor" strokeWidth="1.5">
              <path d="M16 5.5v-4" />
              <path d="M16 30.5v-4" />
              <path d="M1.5 16h4" />
              <path d="M26.5 16h4" />
              <path d="m23.4 8.6 2.8-2.8" />
              <path d="m5.7 26.3 2.9-2.9" />
              <path d="m5.8 5.8 2.8 2.8" />
              <path d="m23.4 23.4 2.9 2.9" />
            </g>
          </g>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          width="1em"
          height="1em"
          fill="currentColor"
          className="theme-toggle__classic theme-toggle__moon"
          viewBox="0 0 24 24"
        >
          <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      </div>
    </label>
  );
}
