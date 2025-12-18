'use client';
import { MonitorCog, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/shared/lib/utils';

const btns = [
  { name: 'light', Icon: Moon },
  { name: 'dark', Icon: Sun },
  { name: 'system', Icon: MonitorCog },
];

const ThemeSwitch = ({ className }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log(theme);
  if (!mounted) return null;
  return (
    <div suppressHydrationWarning className={cn('flex items-center gap-4', className)}>
      {btns.map(({ name, Icon }, i) => (
        <Button
          onClick={() => setTheme(name)}
          variant={theme && theme == name ? 'default' : 'outline'}
          size={'icon'}
          key={name}
        >
          <Icon size={20} />
        </Button>
      ))}
    </div>
  );
};

export default ThemeSwitch;
