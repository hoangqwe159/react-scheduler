import { useMemo, useState } from "react";
import DateProvider from "../hoc/DateProvider";
import { DateCalendar } from "@mui/x-date-pickers";
import { Button, Popover } from "@mui/material";
import { format, getMonth, setMonth, endOfMonth, isAfter, startOfMonth } from "date-fns";
import { LocaleArrow } from "../common/LocaleArrow";
import useStore from "../../hooks/useStore";

interface MonthDateBtnProps {
  selectedDate: Date;
  onChange(value: Date): void;
}

const MonthDateBtn = ({ selectedDate, onChange }: MonthDateBtnProps) => {
  const { locale, navigationPickerProps } = useStore();
  const currentMonth = getMonth(selectedDate);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

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
    const prevMonth = currentMonth - 1;
    onChange(setMonth(selectedDate, prevMonth));
  };
  const handleNext = () => {
    const nextMonth = currentMonth + 1;
    onChange(setMonth(selectedDate, nextMonth));
  };

  const disabledPrev = useMemo(() => {
    const minDate = navigationPickerProps?.minDate;
    if (!minDate) return false;

    const prevMonth = currentMonth - 1;
    const dateOfPrevMonth = setMonth(selectedDate, prevMonth);
    const lastDayOfPrevMonth = endOfMonth(dateOfPrevMonth);

    return !isAfter(lastDayOfPrevMonth, minDate);
  }, [currentMonth, navigationPickerProps?.minDate, selectedDate]);

  const disabledNext = useMemo(() => {
    const maxDate = navigationPickerProps?.maxDate;
    if (!maxDate) return false;

    const nextMonth = currentMonth + 1;
    const dateOfNextMonth = setMonth(selectedDate, nextMonth);
    const firstDayOfNextMonth = startOfMonth(dateOfNextMonth);

    return isAfter(firstDayOfNextMonth, maxDate);
  }, [currentMonth, navigationPickerProps?.maxDate, selectedDate]);

  return (
    <>
      <LocaleArrow
        type="prev"
        disabled={disabledPrev}
        onClick={handlePrev}
        aria-label="previous month"
      />
      <Button style={{ padding: 4 }} onClick={handleOpen} aria-label="selected month">
        {format(selectedDate, "MMMM yyyy", { locale })}
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
            openTo="month"
            views={["year", "month"]}
            value={selectedDate}
            onChange={handleChange}
          />
        </DateProvider>
      </Popover>
      <LocaleArrow
        type="next"
        disabled={disabledNext}
        onClick={handleNext}
        aria-label="next month"
      />
    </>
  );
};

export { MonthDateBtn };
