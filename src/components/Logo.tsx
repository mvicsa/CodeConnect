"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Logo = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const logoSrc = theme === "light" ? "/logo-light.svg" : "/logo-dark.svg";

  return (
    <div className="flex justify-center">
      <Image
        src={logoSrc}
        alt="CodeConnect"
        width={180}
        height={50}
        priority
      />
    </div>
  );
};

export default Logo;
