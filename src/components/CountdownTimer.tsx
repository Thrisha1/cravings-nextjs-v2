import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: Date;
  upcomming: boolean;
}

export function CountdownTimer({ endTime, upcomming }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft({ days, hours, minutes });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0) {
    return <span className="text-red-600">Expired</span>;
  }

  return (
    <span>
      {timeLeft.days > 0 && <span>{timeLeft.days}d </span>}
      <span>
        {timeLeft.hours}h {timeLeft.days > 0 ? null : timeLeft.minutes + "m"}
      </span>
      {!upcomming && <span> remaining</span>}
    </span>
  );
}
