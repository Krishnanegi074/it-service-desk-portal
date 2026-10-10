import type { Instrumentation } from 'next';
import { inspectEnvironment } from '@/lib/environment';
import { log, reportServerError } from '@/lib/observability';

export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const environment = inspectEnvironment();
  log(environment.ready ? 'info' : 'error', {
    event: 'runtime_environment_check',
    message: environment.ready
      ? `Runtime configuration loaded for ${environment.environment}.`
      : 'Runtime configuration has blocking errors.',
    errors: environment.errors,
    warnings: environment.warnings,
    services: environment.services
  });
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportServerError(error, {
    method: request.method,
    path: request.path.split('?')[0],
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource
  });
};
