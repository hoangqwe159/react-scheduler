import { useMemo, useState } from "react";
import DateProvider from "../hoc/DateProvider";
import { Button, Popover } from "@mui/material";
import { endOfWeek, format, startOfWeek, addDays, isAfter } from "date-fns";
import { WeekProps } from "../../views/Week";
import { LocaleArrow } from "../common/LocaleArrow";
import { DateCalendar } from "@mui/x-date-pickers";
import useStore from "../../hooks/useStore";

interface WeekDateBtnProps {
  selectedDate: Date;
  onChange(value: Date): void;
  weekProps: WeekProps;
}

const WeekDateBtn = ({ selectedDate, onChange, weekProps }: WeekDateBtnProps) => {
  const { locale, navigationPickerProps } = useStore();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { weekStartOn } = weekProps;
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: weekStartOn });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: weekStartOn });

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (e: Date | null) => {
    onChange(e || new Date());
    handleClose();
  };

  const handlePrev = () => {
    const lastDayPrevWeek = addDays(weekStart, -1);
    onChange(lastDayPrevWeek);
  };

  const handleNext = () => {
    const firstDayNextWeek = addDays(weekEnd, 1);
    onChange(firstDayNextWeek);
  };

  const disablePrev = useMemo(() => {
    const minDate = navigationPickerProps?.minDate;
    if (!minDate) return false;

    const lastDayPrevWeek = addDays(weekStart, -1);
    return !isAfter(lastDayPrevWeek, minDate);
  }, [navigationPickerProps?.minDate, weekStart]);

  const disableNext = useMemo(() => {
    const maxDate = navigationPickerProps?.maxDate;
    if (!maxDate) return false;

    const firstDayNextWeek = addDays(weekEnd, 1);
    return isAfter(firstDayNextWeek, maxDate);
  }, [navigationPickerProps?.maxDate, weekEnd]);

  return (
    <>
      <LocaleArrow
        type="prev"
        disabled={disablePrev}
        onClick={handlePrev}
        aria-label="previous week"
      />
      <Button style={{ padding: 4 }} onClick={handleOpen} aria-label="selected week">
        {`${format(weekStart, "dd", { locale })} - ${format(weekEnd, "dd MMM yyyy", {
          locale,
        })}`}
      </Button>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <DateProvider>
          <DateCalendar
            {...navigationPickerProps}
            openTo="day"
            views={["month", "day"]}
            value={selectedDate}
            onChange={handleChange}
          />
        </DateProvider>
      </Popover>
      <LocaleArrow type="next" disabled={disableNext} onClick={handleNext} aria-label="next week" />
    </>
  );
};

export { WeekDateBtn };
