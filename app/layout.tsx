import type { Metadata } from "next";
import { getPublishedProjectSummaries } from "@/src/services/projects/get-published-projects";
import { PageTransition } from "@/src/components/layout/page-transition";
import { ProjectsProvider } from "@/src/components/work/projects-provider";
import "./globals.css";

/** Public project data can change from the CMS without a redeploy. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Caloid",
  description:
    "Montreal-based photographer and cinematographer Camilo Luna.",
};

/**
 * Self-contained boot overlay: paints before React/CSS, types CALOID,
 * lets page content load underneath, then fades once ready (min 2s).
 * No React involvement.
 */
const BOOT_OVERLAY_SCRIPT = `
(function () {
  try {
    if (location.pathname.indexOf("/admin") === 0) return;
  } catch (e) {}

  if (document.getElementById("caloid-boot-overlay")) return;

  var MARK = "CALOID";
  var TYPE_MS = 160;
  var MIN_MS = 2000;
  var MAX_MS = 8000;
  var EXIT_MS = 400;
  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  var style = document.createElement("style");
  style.textContent = [
    "#caloid-boot-overlay{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#fff;margin:0;}",
    "#caloid-boot-overlay .caloid-boot-mark{margin:0;display:inline-flex;align-items:baseline;min-height:1.1em;font-family:system-ui,sans-serif;font-size:clamp(2.5rem,8vw,5rem);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#cf0023;}",
    "#caloid-boot-overlay .caloid-boot-typed{white-space:pre;}",
    "#caloid-boot-overlay .caloid-boot-caret{display:inline-block;width:0.08em;height:0.85em;margin-left:0.06em;background:#cf0023;transform:translateY(0.06em);animation:caloid-boot-blink 0.9s steps(1,end) infinite;}",
    "#caloid-boot-overlay.is-exit{animation:caloid-boot-fade " + EXIT_MS + "ms ease forwards;pointer-events:none;}",
    "@keyframes caloid-boot-blink{0%,45%{opacity:1}50%,100%{opacity:0}}",
    "@keyframes caloid-boot-fade{from{opacity:1}to{opacity:0}}",
    "@media (prefers-reduced-motion:reduce){#caloid-boot-overlay .caloid-boot-caret{animation:none;opacity:1}#caloid-boot-overlay.is-exit{animation:none;opacity:0}}"
  ].join("");
  document.documentElement.appendChild(style);

  var root = document.createElement("div");
  root.id = "caloid-boot-overlay";
  root.setAttribute("role", "status");
  root.setAttribute("aria-busy", "true");
  root.setAttribute("aria-label", "Loading");

  var mark = document.createElement("p");
  mark.className = "caloid-boot-mark";
  mark.setAttribute("aria-hidden", "true");

  var typed = document.createElement("span");
  typed.className = "caloid-boot-typed";

  var caret = document.createElement("span");
  caret.className = "caloid-boot-caret";

  mark.appendChild(typed);
  mark.appendChild(caret);
  root.appendChild(mark);
  document.documentElement.appendChild(root);

  var started = Date.now();
  var typingDone = false;
  var assetsDone = false;
  var minElapsed = false;
  var dismissed = false;

  function dismiss() {
    if (dismissed) return;
    if (!typingDone || !assetsDone || !minElapsed) return;
    dismissed = true;
    caret.remove();
    root.setAttribute("aria-busy", "false");
    root.classList.add("is-exit");
    window.setTimeout(function () {
      root.remove();
      style.remove();
    }, EXIT_MS);
  }

  function markTypingDone() {
    typingDone = true;
    typed.textContent = MARK;
    dismiss();
  }

  function markAssetsDone() {
    assetsDone = true;
    dismiss();
  }

  window.setTimeout(function () {
    minElapsed = true;
    dismiss();
  }, MIN_MS);

  window.setTimeout(markAssetsDone, MAX_MS);

  function trackableImages() {
    return Array.prototype.filter.call(document.images, function (img) {
      if (!img.src || img.src.indexOf("data:") === 0) return false;
      if (img.naturalWidth === 1 && img.naturalHeight === 1 && img.complete) return false;
      return true;
    });
  }

  function waitForImage(img) {
    return new Promise(function (resolve) {
      if (img.complete) {
        resolve();
        return;
      }
      var done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      img.addEventListener("load", finish, { once: true });
      img.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 4000);
    });
  }

  function waitForAssets() {
    var deadline = started + MAX_MS;
    var passes = 0;

    function pass() {
      if (dismissed || assetsDone) return;
      var imgs = trackableImages();
      Promise.all(imgs.map(waitForImage)).then(function () {
        passes += 1;
        // Extra passes catch images React mounts after hydration.
        if (passes >= 4 || Date.now() >= deadline) {
          markAssetsDone();
          return;
        }
        window.setTimeout(pass, 120);
      });
    }

    // Let the page mount under the cover before the first check.
    window.setTimeout(pass, 50);
  }

  waitForAssets();

  if (reduce) {
    markTypingDone();
    return;
  }

  typed.textContent = "";
  var count = 0;
  var timer = window.setInterval(function () {
    count += 1;
    typed.textContent = MARK.slice(0, count);
    if (count >= MARK.length) {
      window.clearInterval(timer);
      markTypingDone();
    }
  }, TYPE_MS);
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projectSummaries = await getPublishedProjectSummaries();

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_OVERLAY_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ProjectsProvider projects={projectSummaries}>
          <PageTransition>{children}</PageTransition>
        </ProjectsProvider>
      </body>
    </html>
  );
}
