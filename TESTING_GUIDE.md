# Testing Guide

## Overview

This guide covers testing strategies and best practices for CopyTradinj.

## Testing Stack

- **Frontend**: Vitest, React Testing Library
- **Backend**: Jest, Supertest
- **E2E**: Playwright (optional)

## Setup

### Frontend Testing

```bash
# Install testing dependencies
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Backend Testing

```bash
cd backend
pnpm add -D jest @types/jest ts-jest supertest @types/supertest
```

## Frontend Testing

### Unit Tests

Test individual components and functions:

```typescript
// src/components/__tests__/WalletButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WalletButton from '../WalletButton';

describe('WalletButton', () => {
  it('renders connect button when not connected', () => {
    render(<WalletButton />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('calls onConnect when clicked', () => {
    const onConnect = vi.fn();
    render(<WalletButton onConnect={onConnect} />);
    
    fireEvent.click(screen.getByText('Connect Wallet'));
    expect(onConnect).toHaveBeenCalled();
  });

  it('displays address when connected', () => {
    const address = 'inj1abc...xyz';
    render(<WalletButton address={address} />);
    
    expect(screen.getByText(/inj1abc/)).toBeInTheDocument();
  });
});
```

### Integration Tests

Test component interactions:

```typescript
// src/features/__tests__/CopyTrading.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import CopyTrading from '../CopyTrading';

describe('CopyTrading Feature', () => {
  it('allows user to add master trader', async () => {
    const user = userEvent.setup();
    render(<CopyTrading />);

    const input = screen.getByPlaceholderText('Enter trader address');
    await user.type(input, '0x1234567890abcdef');

    const addButton = screen.getByText('Add Trader');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Trader added successfully')).toBeInTheDocument();
    });
  });

  it('validates trader address format', async () => {
    const user = userEvent.setup();
    render(<CopyTrading />);

    const input = screen.getByPlaceholderText('Enter trader address');
    await user.type(input, 'invalid-address');

    const addButton = screen.getByText('Add Trader');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid address format')).toBeInTheDocument();
    });
  });
});
```

### Hook Tests

Test custom hooks:

```typescript
// src/hooks/__tests__/useWallet.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useWallet } from '../useWallet';

describe('useWallet', () => {
  it('initializes with no address', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.address).toBe('');
    expect(result.current.isConnected).toBe(false);
  });

  it('connects wallet successfully', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBeTruthy();
  });

  it('disconnects wallet', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect();
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBe('');
  });
});
```

## Backend Testing

### Unit Tests

Test individual functions and services:

```typescript
// backend/src/services/__tests__/tradeMonitor.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TradeMonitor } from '../tradeMonitor';

describe('TradeMonitor', () => {
  let monitor: TradeMonitor;

  beforeEach(() => {
    monitor = new TradeMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  it('detects new trades', async () => {
    const trades: any[] = [];
    monitor.on('trade', (trade) => trades.push(trade));

    await monitor.start();
    
    // Simulate trade
    await monitor.simulateTrade({
      trader: '0x123',
      symbol: 'BTC-PERP',
      side: 'buy',
      size: 1.0,
      price: 50000
    });

    expect(trades).toHaveLength(1);
    expect(trades[0].symbol).toBe('BTC-PERP');
  });

  it('filters trades by trader', async () => {
    monitor.addTrader('0x123');
    
    const trades: any[] = [];
    monitor.on('trade', (trade) => trades.push(trade));

    await monitor.start();

    // Trade from tracked trader
    await monitor.simulateTrade({
      trader: '0x123',
      symbol: 'BTC-PERP',
      side: 'buy',
      size: 1.0,
      price: 50000
    });

    // Trade from untracked trader
    await monitor.simulateTrade({
      trader: '0x456',
      symbol: 'ETH-PERP',
      side: 'buy',
      size: 1.0,
      price: 3000
    });

    expect(trades).toHaveLength(1);
    expect(trades[0].trader).toBe('0x123');
  });
});
```

### API Tests

Test API endpoints:

```typescript
// backend/src/routes/__tests__/api.test.ts
import request from 'supertest';
import { describe, it, expect } from '@jest/globals';
import app from '../../app';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('returns health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('POST /api/traders', () => {
    it('adds new trader', async () => {
      const response = await request(app)
        .post('/api/traders')
        .send({
          address: '0x1234567890abcdef',
          name: 'Test Trader'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('validates trader address', async () => {
      const response = await request(app)
        .post('/api/traders')
        .send({
          address: 'invalid',
          name: 'Test Trader'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/trades', () => {
    it('returns trade history', async () => {
      const response = await request(app).get('/api/trades');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('filters trades by trader', async () => {
      const response = await request(app)
        .get('/api/trades')
        .query({ trader: '0x123' });

      expect(response.status).toBe(200);
      response.body.forEach((trade: any) => {
        expect(trade.trader).toBe('0x123');
      });
    });
  });
});
```

## Integration Tests

Test full workflows:

```typescript
// tests/integration/copyTrading.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers';

describe('Copy Trading Integration', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  it('completes full copy trading flow', async () => {
    // 1. Connect wallet
    const wallet = await connectTestWallet();
    expect(wallet.address).toBeTruthy();

    // 2. Add master trader
    const trader = await addMasterTrader('0x123');
    expect(trader.id).toBeTruthy();

    // 3. Configure copy settings
    const settings = await configureCopySettings({
      traderId: trader.id,
      copyPercentage: 50,
      maxPositionSize: 1000
    });
    expect(settings.id).toBeTruthy();

    // 4. Simulate master trade
    const masterTrade = await simulateMasterTrade({
      trader: '0x123',
      symbol: 'BTC-PERP',
      side: 'buy',
      size: 1.0,
      price: 50000
    });

    // 5. Verify copy trade executed
    await waitForCopyTrade();
    const copyTrade = await getLatestCopyTrade();
    
    expect(copyTrade.symbol).toBe('BTC-PERP');
    expect(copyTrade.size).toBe(0.5); // 50% of master trade
  });
});
```

## E2E Tests (Optional)

Using Playwright for end-to-end testing:

```typescript
// tests/e2e/copyTrading.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Copy Trading E2E', () => {
  test('user can set up copy trading', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');

    // Connect wallet
    await page.click('text=Connect Wallet');
    await page.click('text=Keplr');
    
    // Wait for wallet connection
    await expect(page.locator('text=/inj1.*/')).toBeVisible();

    // Add master trader
    await page.click('text=Add Trader');
    await page.fill('input[placeholder="Enter trader address"]', '0x1234567890abcdef');
    await page.click('button:has-text("Add")');

    // Verify trader added
    await expect(page.locator('text=Trader added successfully')).toBeVisible();

    // Configure settings
    await page.click('text=Configure');
    await page.fill('input[name="copyPercentage"]', '50');
    await page.click('button:has-text("Save")');

    // Enable copy trading
    await page.click('text=Enable Copy Trading');
    
    // Verify enabled
    await expect(page.locator('text=Copy trading enabled')).toBeVisible();
  });
});
```

## Test Coverage

### Running Coverage

```bash
# Frontend
pnpm test:coverage

# Backend
cd backend
pnpm test:coverage
```

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Mocking

### Mocking Blockchain Interactions

```typescript
// src/__mocks__/injective.ts
export const mockWalletStrategy = {
  getAddresses: vi.fn().mockResolvedValue(['inj1test']),
  signAndBroadcast: vi.fn().mockResolvedValue({ txHash: '0xabc' })
};

export const mockMsgBroadcaster = {
  broadcast: vi.fn().mockResolvedValue({ txHash: '0xabc' })
};
```

### Mocking API Calls

```typescript
// src/__mocks__/api.ts
import { vi } from 'vitest';

export const mockApi = {
  getTrades: vi.fn().mockResolvedValue([]),
  addTrader: vi.fn().mockResolvedValue({ id: '1' }),
  updateSettings: vi.fn().mockResolvedValue({ success: true })
};
```

## Best Practices

1. **Write Tests First**: Follow TDD when possible
2. **Test Behavior, Not Implementation**: Focus on what, not how
3. **Keep Tests Independent**: Each test should run in isolation
4. **Use Descriptive Names**: Test names should explain what they test
5. **Mock External Dependencies**: Don't rely on external services
6. **Test Edge Cases**: Include error scenarios and boundary conditions
7. **Maintain Test Data**: Use factories or fixtures for test data
8. **Run Tests Frequently**: Integrate with CI/CD pipeline

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run frontend tests
        run: pnpm test:coverage
      
      - name: Run backend tests
        run: cd backend && pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Frontend

```bash
# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/components/__tests__/WalletButton.test.tsx

# Debug in VS Code
# Add breakpoint and run "Debug Test" from test file
```

### Backend

```bash
# Run tests in watch mode
cd backend
pnpm test:watch

# Run specific test
pnpm test src/services/__tests__/tradeMonitor.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest
```

## Performance Testing

### Load Testing

```typescript
// tests/performance/load.test.ts
import { describe, it } from '@jest/globals';
import autocannon from 'autocannon';

describe('Load Tests', () => {
  it('handles 100 concurrent connections', async () => {
    const result = await autocannon({
      url: 'http://localhost:3001',
      connections: 100,
      duration: 10
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
  });
});
```

## Security Testing

### Input Validation

```typescript
// tests/security/validation.test.ts
import { describe, it, expect } from '@jest/globals';
import { validateAddress, validateAmount } from '../../src/utils/validation';

describe('Security - Input Validation', () => {
  it('rejects SQL injection attempts', () => {
    const malicious = "'; DROP TABLE users; --";
    expect(() => validateAddress(malicious)).toThrow();
  });

  it('rejects XSS attempts', () => {
    const malicious = '<script>alert("xss")</script>';
    expect(() => validateAddress(malicious)).toThrow();
  });

  it('validates numeric inputs', () => {
    expect(() => validateAmount('abc')).toThrow();
    expect(() => validateAmount('-1')).toThrow();
    expect(validateAmount('100')).toBe(100);
  });
});
```
