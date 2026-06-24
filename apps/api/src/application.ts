import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingScope} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {securityHeadersMiddleware} from './middleware/security-headers.middleware';
import {MySequence} from './sequence';
import {NotificationService, NOTIFICATION_SERVICE} from './services/notification.service';
import {RateLimiterService, RATE_LIMITER_BINDING} from './services/rate-limiter.service';
import {EvolutionService, EVOLUTION_SERVICE} from './services/evolution.service';
import {QueueService} from './services/queue.service';

export {ApplicationConfig};

export class ClaudeCodeApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.sequence(MySequence);

    this.middleware(securityHeadersMiddleware);

    this.static('/', path.join(__dirname, '../public'));

    if (process.env.NODE_ENV !== 'production') {
      this.configure(RestExplorerBindings.COMPONENT).to({
        path: '/explorer',
      });
      this.component(RestExplorerComponent);
    }

    this.bind(NOTIFICATION_SERVICE).toClass(NotificationService);
    this.bind(RATE_LIMITER_BINDING).toClass(RateLimiterService).inScope(BindingScope.SINGLETON);
    this.bind(EVOLUTION_SERVICE).toClass(EvolutionService).inScope(BindingScope.SINGLETON);
    this.lifeCycleObserver(QueueService);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
