import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@repo/community/sentry-options";

Sentry.init(sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));
