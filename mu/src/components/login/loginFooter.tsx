import { Roboto } from "next/font/google";
import Link from "next/link";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

function LoginFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="rise relative bg-slate-900/40 dark:bg-slate-980/40 backdrop-blur-xl mt-auto">
      <div className="mx-4 px-3 lg:mx-16 lg:px-6 py-2">
        <div className="rise pt-2 pb-2" style={{ animationDelay: "600ms" }}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p
              className={`${roboto.className} text-xs text-gray-800 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400`}
              onClick={() =>
                window.open(
                  "https://nowenkottage.com",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              © {currentYear} NowenKottage
            </p>

            <div className="flex items-center space-x-6">
              <Link
                href="/legal"
                className={`${roboto.className} text-xs text-gray-800 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400`}
              >
                Term & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LoginFooter;
