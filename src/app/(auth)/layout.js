import { Logo } from "@/components/layout/logo";

// Centered shell for login/signup with an animated aurora backdrop.
export default function AuthLayout({ children }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob absolute -top-32 -left-24 size-[28rem] rounded-full bg-primary/25 blur-3xl" />
        <div
          className="aurora-blob absolute top-1/3 -right-24 size-[26rem] rounded-full bg-chart-2/20 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />
        <div
          className="aurora-blob absolute -bottom-32 left-1/4 size-[24rem] rounded-full bg-chart-3/20 blur-3xl"
          style={{ animationDelay: "-12s" }}
        />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" showText />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            AI-assisted skin disease screening across 10 conditions.
          </p>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          For educational use. This tool assists, and does not replace, a
          qualified doctor.
        </p>
      </div>
    </div>
  );
}
