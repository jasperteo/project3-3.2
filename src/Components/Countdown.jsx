import { useState, useEffect } from "react";
// import iconify from "@iconify/react";

const Countdown = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: "0",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const timeDifference = end - now;

      if (timeDifference > 0) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: days.toString(),
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
        });
      } else {
        setTimeLeft({
          days: "0",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
      }
    };

    updateCountdown();

    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [endDate]);

  return (
    <>
      <p>
        <iconify-icon inline icon="ant-design:reload-time-outline" />{" "}
        {timeLeft.days} days, {timeLeft.hours} hours, {timeLeft.minutes}
        minutes, {timeLeft.seconds} seconds
      </p>
    </>
  );
};

export default Countdown;
