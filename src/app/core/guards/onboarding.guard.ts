import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LilyStore } from '../store/lily.store';

export const onboardingGuard: CanActivateFn = () => {
  const store = inject(LilyStore);
  const router = inject(Router);

  if (store.onboardingComplete()) {
    return true;
  }

  return router.createUrlTree(['/onboarding']);
};

export const onboardingCompleteGuard: CanActivateFn = () => {
  const store = inject(LilyStore);
  const router = inject(Router);

  if (!store.onboardingComplete()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
