import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  children: React.ReactNode;
};

const HIGHLIGHTS = [
  "Track every account in one ledger",
  "Categorise spend and spot the leaks",
  "Set budgets and automate recurring entries",
];

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="relative flex flex-col px-4 py-6 lg:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-2.5">
            <BrandMark className="size-5 text-blue-700" />
            <span className="heading-16 text-gray-1000">Fintrack</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      <aside className="bg-surface border-alpha-300 hidden flex-col justify-center border-l px-12 lg:flex">
        <BrandMark className="mb-8 size-10 text-blue-700" />
        <h2 className="heading-32 text-gray-1000 max-w-sm text-balance">
          Know where your money goes.
        </h2>
        <p className="copy-14 mt-3 max-w-sm text-gray-900">
          A personal finance workspace for accounts, budgets and recurring
          transactions — with the charts to back them up.
        </p>
        <ul className="mt-8 space-y-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-x-2.5">
              <span
                aria-hidden="true"
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-700"
              />
              <span className="copy-14 text-gray-900">{item}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default AuthLayout;
