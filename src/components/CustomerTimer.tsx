import { useState, useEffect } from "react";

interface CustomerTimerProps {
  checkOutTime: string;
}

const CustomerTimer = ({ checkOutTime }: CustomerTimerProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const [hours, minutes] = checkOutTime.split(':');
      const checkOut = new Date();
      checkOut.setHours(parseInt(hours), parseInt(minutes), 0);

      const diff = checkOut.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Time's up!");
        clearInterval(timer);
      } else {
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [checkOutTime]);

  return (
    <span className={timeLeft === "Time's up!" ? "text-destructive font-semibold" : "text-muted-foreground"}>
      {timeLeft}
    </span>
  );
};

export default CustomerTimer;
