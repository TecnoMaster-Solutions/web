"use client";

import { useCallback, useEffect, useState } from "react";
import type { NavigateAction, View } from "react-big-calendar";

export const useAppointmentResponsive = () => {
  const [calendarView, setCalendarView] = useState<View>("month");
  const [availableViews, setAvailableViews] = useState<View[]>(["month", "week", "day", "agenda"]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(max-width: 768px)");
    const apply = () => {
      if (mql.matches) {
        setCalendarView("agenda");
        setAvailableViews(["agenda", "week"]);
      } else {
        setCalendarView("month");
        setAvailableViews(["month", "week", "day", "agenda"]);
      }
    };

    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  const handleNavigate = useCallback(
    (date: Date, _action: NavigateAction) => {
      setCurrentDate(date);
    },
    []
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return {
    calendarView,
    setCalendarView,
    availableViews,
    currentDate,
    handleNavigate,
    isFullscreen,
    toggleFullscreen,
  };
};
