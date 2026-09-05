import Image from "next/image";

export function XivLogo() {
  return (
    <Image
      src="/brand/xiv-logo-sharp.png"
      alt="XIV"
      width={1254}
      height={1254}
      sizes="64px"
      quality={90}
      className="xiv-brand-logo"
    />
  );
}
