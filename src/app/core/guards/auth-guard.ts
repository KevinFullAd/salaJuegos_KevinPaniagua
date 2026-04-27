import { AuthService } from '@core/services/auth.service';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastService } from '@services/toast.service';


export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if(authService.isLogged()){
    return true;
  }

  toastService.show('AUTH_REQUIRED');
  router.navigate(['/login']);
  return false;
};
