// src/components/dashboard/StatsCards/AnimatedNumber.tsx
import { useSpring, animated } from '@react-spring/web';

export const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 },
  });

  return <animated.span>{number.to((n) => Math.floor(n))}</animated.span>;
};