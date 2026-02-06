import { ApplicationConfig, provideZoneChangeDetection, ApplicationRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { Socket, SocketIoConfig } from 'ngx-socket-io';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

// Socket.IO configuration
const socketConfig: SocketIoConfig = {
  url: 'http://localhost:3000',
  options: {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: false
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideMomentDateAdapter(),
    {
      provide: Socket,
      useFactory: (appRef: ApplicationRef) => {
        return new Socket(socketConfig, appRef);
      },
      deps: [ApplicationRef]
    }
  ]
};