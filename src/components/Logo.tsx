"use client";

import Image from "next/image";
import logoLight from "/public/logo-light.svg";
import logoDark from "/public/logo-dark.svg";
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

  const logoSrc = theme === "light" ? logoLight : logoDark;

  return (
    <div className="flex justify-center">
      <Image
        src={logoSrc}
        alt="CodeConnect"
        style={{ height: "auto", width: "180px" }}
        priority
      />
    </div>
  );
};

export default Logo;
