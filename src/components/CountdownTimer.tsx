import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: Date;
  upcomming: boolean;
}

export function CountdownTimer({ endTime, upcomming }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0
  ) {
    return <span className="text-red-600">Expired</span>;
  }

  return (
    <span>
      <span className="">{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s{" "}</span>
      {!upcomming && <span>remaining</span>}
    </span>
  );
}
