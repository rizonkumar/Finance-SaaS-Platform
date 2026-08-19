import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth checks live with the resources they guard — see the dashboard layout for
// pages and `app/api/[[...route]]/_middleware.ts` for the API. Path matching
// here would diverge from how Next.js actually routes requests.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
