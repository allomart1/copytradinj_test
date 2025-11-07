import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';

interface MonitoringConfig {
  sentryDsn?: string;
  logRocketAppId?: string;
  environment: 'development' | 'staging' | 'production';
  enablePerformance?: boolean;
}

class MonitoringService {
  private initialized = false;

  initialize(config: MonitoringConfig) {
    if (this.initialized) return;

    const { sentryDsn, logRocketAppId, environment, enablePerformance = true } = config;

    // Initialize Sentry for error tracking
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        environment,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event, hint) {
          // Filter out sensitive data
          if (event.request?.headers) {
            delete event.request.headers['Authorization'];
          }
          return event;
        },
      });

      console.log('✅ Sentry initialized');
    }

    // Initialize LogRocket for session replay
    if (logRocketAppId) {
      LogRocket.init(logRocketAppId, {
        console: {
          shouldAggregateConsoleErrors: true,
        },
        network: {
          requestSanitizer: (request) => {
            // Remove sensitive headers
            if (request.headers) {
              delete request.headers['Authorization'];
            }
            return request;
          },
        },
      });

      setupLogRocketReact(LogRocket);

      // Connect LogRocket to Sentry
      if (sentryDsn) {
        LogRocket.getSessionURL((sessionURL) => {
          Sentry.setContext('LogRocket', { sessionURL });
        });
      }

      console.log('✅ LogRocket initialized');
    }

    this.initialized = true;
  }

  // Track user identity
  identifyUser(walletAddress: string, metadata?: Record<string, any>) {
    if (!this.initialized) return;

    const userId = walletAddress.slice(0, 10);

    Sentry.setUser({
      id: userId,
      username: walletAddress,
      ...metadata,
    });

    LogRocket.identify(userId, {
      wallet: walletAddress,
      ...metadata,
    });
  }

  // Track custom events
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      category: 'user-action',
      message: eventName,
      level: 'info',
      data: properties,
    });

    LogRocket.track(eventName, properties);
  }

  // Track errors
  captureError(error: Error, context?: Record<string, any>) {
    if (!this.initialized) {
      console.error('Monitoring not initialized:', error);
      return;
    }

    Sentry.captureException(error, {
      contexts: { custom: context },
    });

    console.error('Error captured:', error, context);
  }

  // Track performance metrics
  trackPerformance(metricName: string, value: number, unit: string = 'ms') {
    if (!this.initialized) return;

    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metricName}: ${value}${unit}`,
      level: 'info',
    });

    LogRocket.track(`performance:${metricName}`, { value, unit });
  }

  // Track transaction
  trackTransaction(
    txHash: string,
    type: 'trade' | 'config',
    status: 'pending' | 'success' | 'failed',
    metadata?: Record<string, any>
  ) {
    this.trackEvent('transaction', {
      txHash,
      type,
      status,
      ...metadata,
    });
  }

  // Track wallet connection
  trackWalletConnection(walletType: 'keplr' | 'leap', success: boolean) {
    this.trackEvent('wallet_connection', {
      walletType,
      success,
      timestamp: Date.now(),
    });
  }

  // Track copy trading session
  trackCopyTradingSession(action: 'start' | 'stop', metadata?: Record<string, any>) {
    this.trackEvent(`copy_trading_${action}`, {
      timestamp: Date.now(),
      ...metadata,
    });
  }

  // Track balance check
  trackBalanceCheck(balance: number, currency: string) {
    this.trackEvent('balance_check', {
      balance,
      currency,
      timestamp: Date.now(),
    });
  }

  // Track gas estimation
  trackGasEstimation(gasLimit: number, gasFeeUSD: string, success: boolean) {
    this.trackEvent('gas_estimation', {
      gasLimit,
      gasFeeUSD,
      success,
      timestamp: Date.now(),
    });
  }
}

export const monitoringService = new MonitoringService();
