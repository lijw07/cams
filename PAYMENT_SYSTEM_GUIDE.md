# CAMS Payment System Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Legal & Compliance Requirements](#legal--compliance-requirements)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [Implementation Phases](#implementation-phases)
6. [Security Considerations](#security-considerations)
7. [Business Operations](#business-operations)
8. [Development Setup](#development-setup)
9. [Testing Strategy](#testing-strategy)
10. [Monitoring & Analytics](#monitoring--analytics)
11. [Go-Live Checklist](#go-live-checklist)

## Overview

This guide provides a comprehensive roadmap for implementing a subscription-based payment system for the CAMS (Centralized Application Management System). The system will support monthly and yearly billing cycles with multiple pricing tiers.

### Business Model
- **SaaS Subscription**: Recurring monthly/yearly payments
- **Freemium**: Free tier with limited features
- **Usage-based limits**: Applications, connections, users per plan
- **Self-service**: Users can upgrade/downgrade/cancel independently

## Legal & Compliance Requirements

### 1. Payment Card Industry (PCI) Compliance
**Status**: ⚠️ CRITICAL - Required for credit card processing

**Implementation Strategy**:
- ✅ **Use Stripe/PayPal**: Handles PCI compliance automatically
- ❌ **Never store**: Credit card numbers, CVV, or payment data
- ✅ **Tokenization**: All payment data tokenized by payment processor

```typescript
// ✅ CORRECT: Use Stripe's secure tokenization
const paymentMethod = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement, // Stripe's secure card element
});

// ❌ NEVER DO THIS: Store sensitive payment data
const creditCard = {
  number: '4111111111111111', // Security violation!
  cvv: '123', // Security violation!
};
```

### 2. Tax Compliance
**Status**: ⚠️ REQUIRED - Varies by jurisdiction

**US Requirements**:
- Sales tax varies by state
- Some states require tax on SaaS services
- Use services like Stripe Tax for automatic calculation

**International Requirements**:
- EU: VAT required (20%+ in most countries)
- Canada: GST/HST required
- Other countries: Consult local tax professional

**Implementation**:
```typescript
// Use Stripe Tax for automatic tax calculation
const session = await stripe.checkout.sessions.create({
  automatic_tax: { enabled: true },
  customer_update: {
    address: 'auto',
    name: 'auto'
  },
  // ... other options
});
```

### 3. Data Protection & Privacy
**Status**: ⚠️ MANDATORY - GDPR, CCPA compliance required

**GDPR Requirements (EU)**:
- Right to be forgotten
- Data portability
- Consent management
- Transparent data processing

**CCPA Requirements (California)**:
- Right to know data collected
- Right to delete personal information
- Right to opt-out of data sale

**Implementation**:
```csharp
// GDPR Compliance endpoints
[HttpPost("gdpr/export-data")]
public async Task<IActionResult> ExportUserData(string userId)
{
    var userData = await _userService.ExportAllUserDataAsync(userId);
    return File(userData, "application/json", "user-data.json");
}

[HttpDelete("gdpr/delete-account")]
public async Task<IActionResult> DeleteUserAccount(string userId)
{
    await _userService.AnonymizeUserDataAsync(userId);
    return Ok();
}
```

### 4. Required Legal Documents
**Status**: ⚠️ MANDATORY - Must have before launch

- [ ] **Terms of Service**: Service description, payment terms, cancellation policy
- [ ] **Privacy Policy**: Data collection, usage, sharing practices
- [ ] **Refund Policy**: Clear refund terms and conditions
- [ ] **Acceptable Use Policy**: What users can/cannot do
- [ ] **Cookie Policy**: If using cookies for tracking

**Resources**:
- Legal template services: Termly, iubenda, PrivacyPolicies.com
- Recommend consulting with technology lawyer

## Technical Architecture

### Payment Flow Architecture
```
User Browser → Frontend (React) → Backend (C#/.NET) → Stripe API
     ↓              ↓                    ↓              ↓
 Checkout UI → Create Session → Validate Request → Process Payment
     ↓              ↓                    ↓              ↓
 Redirect → Success/Cancel ← Webhook Handler ← Payment Confirmation
```

### Core Components

#### 1. Payment Processor Integration
**Recommended**: Stripe (handles most compliance automatically)

**Key Benefits**:
- PCI compliance handled
- International payment support
- Built-in subscription management
- Automatic tax calculation
- Comprehensive webhooks

#### 2. Subscription Management
- Plan creation and management
- Billing cycle handling (monthly/yearly)
- Proration for plan changes
- Cancellation and refund processing
- Trial period management

#### 3. Access Control
- Subscription-based feature gating
- Usage limit enforcement
- API rate limiting per plan
- Real-time subscription status checking

## Database Schema

### Core Tables

```sql
-- Subscription Plans
CREATE TABLE SubscriptionPlans (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(100) NOT NULL, -- 'Starter', 'Professional', 'Enterprise'
    Description NVARCHAR(500),
    PriceMonthly DECIMAL(10,2) NOT NULL,
    PriceYearly DECIMAL(10,2) NOT NULL,
    MaxApplications INT NOT NULL,
    MaxConnections INT NOT NULL,
    MaxUsers INT NOT NULL,
    MaxApiCalls INT NOT NULL, -- Per month
    Features NVARCHAR(MAX), -- JSON array of features
    StripeProductId NVARCHAR(255), -- Stripe product ID
    StripePriceMonthlyId NVARCHAR(255), -- Stripe price ID for monthly
    StripePriceYearlyId NVARCHAR(255), -- Stripe price ID for yearly
    IsActive BIT DEFAULT 1,
    SortOrder INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- User Subscriptions
CREATE TABLE UserSubscriptions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    PlanId UNIQUEIDENTIFIER NOT NULL,
    StripeCustomerId NVARCHAR(255) NOT NULL,
    StripeSubscriptionId NVARCHAR(255) NOT NULL,
    Status NVARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'past_due', 'unpaid', 'trialing'
    BillingCycle NVARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
    CurrentPeriodStart DATETIME2 NOT NULL,
    CurrentPeriodEnd DATETIME2 NOT NULL,
    TrialStart DATETIME2 NULL,
    TrialEnd DATETIME2 NULL,
    CancelledAt DATETIME2 NULL,
    CancelAtPeriodEnd BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (PlanId) REFERENCES SubscriptionPlans(Id),
    INDEX IX_UserSubscriptions_UserId (UserId),
    INDEX IX_UserSubscriptions_Status (Status),
    INDEX IX_UserSubscriptions_StripeSubscriptionId (StripeSubscriptionId)
);

-- Payment Transactions
CREATE TABLE PaymentTransactions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SubscriptionId UNIQUEIDENTIFIER NOT NULL,
    StripePaymentIntentId NVARCHAR(255),
    StripeInvoiceId NVARCHAR(255),
    Amount DECIMAL(10,2) NOT NULL,
    Currency NVARCHAR(3) DEFAULT 'USD',
    Status NVARCHAR(50) NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'
    PaymentMethod NVARCHAR(100), -- 'card', 'bank_transfer', etc.
    FailureReason NVARCHAR(500),
    TransactionDate DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (SubscriptionId) REFERENCES UserSubscriptions(Id),
    INDEX IX_PaymentTransactions_SubscriptionId (SubscriptionId),
    INDEX IX_PaymentTransactions_Status (Status),
    INDEX IX_PaymentTransactions_TransactionDate (TransactionDate)
);

-- Usage Tracking
CREATE TABLE UsageMetrics (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    SubscriptionId UNIQUEIDENTIFIER NOT NULL,
    MetricType NVARCHAR(50) NOT NULL, -- 'api_calls', 'storage_gb', 'bandwidth_gb'
    MetricValue BIGINT NOT NULL,
    PeriodStart DATETIME2 NOT NULL,
    PeriodEnd DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (SubscriptionId) REFERENCES UserSubscriptions(Id),
    INDEX IX_UsageMetrics_UserId_Period (UserId, PeriodStart, PeriodEnd),
    INDEX IX_UsageMetrics_MetricType (MetricType)
);

-- Webhook Event Log
CREATE TABLE WebhookEvents (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StripeEventId NVARCHAR(255) NOT NULL UNIQUE,
    EventType NVARCHAR(100) NOT NULL,
    ProcessedAt DATETIME2 NULL,
    ProcessingStatus NVARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    EventData NVARCHAR(MAX), -- JSON payload
    ErrorMessage NVARCHAR(MAX),
    RetryCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    INDEX IX_WebhookEvents_StripeEventId (StripeEventId),
    INDEX IX_WebhookEvents_ProcessingStatus (ProcessingStatus),
    INDEX IX_WebhookEvents_EventType (EventType)
);
```

### Sample Data

```sql
-- Insert sample subscription plans
INSERT INTO SubscriptionPlans (Name, Description, PriceMonthly, PriceYearly, MaxApplications, MaxConnections, MaxUsers, MaxApiCalls, Features) VALUES
('Starter', 'Perfect for small teams getting started', 19.00, 190.00, 3, 10, 2, 10000, '["Basic monitoring", "Email support", "Standard integrations"]'),
('Professional', 'For growing teams with advanced needs', 49.00, 490.00, 15, 50, 10, 50000, '["Advanced monitoring", "Priority support", "Custom integrations", "Advanced analytics"]'),
('Enterprise', 'For large organizations with complex requirements', 149.00, 1490.00, 100, 500, 50, 250000, '["Enterprise monitoring", "24/7 phone support", "Custom integrations", "Advanced analytics", "SSO", "Custom branding"]');
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up basic infrastructure and legal compliance

#### Backend Tasks:
- [ ] Create subscription database tables
- [ ] Set up Stripe account and get API keys
- [ ] Implement basic Stripe integration
- [ ] Create subscription service classes
- [ ] Set up webhook endpoint structure

#### Frontend Tasks:
- [ ] Create pricing page component
- [ ] Design subscription management UI
- [ ] Implement Stripe Elements for payment forms
- [ ] Create billing history page

#### Legal Tasks:
- [ ] Draft Terms of Service
- [ ] Create Privacy Policy
- [ ] Set up cookie consent (if needed)
- [ ] Consult with lawyer on compliance

### Phase 2: Core Payment Flow (Week 3-4)
**Goal**: Implement subscription creation and basic billing

#### Backend Implementation:
```csharp
// Core subscription service
public class SubscriptionService
{
    private readonly IStripeService _stripeService;
    private readonly ISubscriptionRepository _subscriptionRepo;
    private readonly IConfiguration _config;

    public async Task<CheckoutSessionResponse> CreateCheckoutSessionAsync(
        string userId, 
        string planId, 
        string billingCycle)
    {
        var user = await _userService.GetAsync(userId);
        var plan = await _subscriptionRepo.GetPlanAsync(planId);
        
        // Create or get Stripe customer
        var customer = await _stripeService.GetOrCreateCustomerAsync(user);
        
        // Determine price based on billing cycle
        var priceId = billingCycle == "yearly" ? plan.StripePriceYearlyId : plan.StripePriceMonthlyId;
        
        var options = new SessionCreateOptions
        {
            Customer = customer.Id,
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1
                }
            },
            Mode = "subscription",
            SuccessUrl = $"{_config["App:BaseUrl"]}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = $"{_config["App:BaseUrl"]}/pricing",
            ClientReferenceId = userId,
            AutomaticTax = new SessionAutomaticTaxOptions { Enabled = true }
        };

        var session = await _stripeService.CheckoutSessions.CreateAsync(options);
        
        return new CheckoutSessionResponse
        {
            SessionId = session.Id,
            PublishableKey = _config["Stripe:PublishableKey"]
        };
    }
}
```

#### Frontend Implementation:
```typescript
// Pricing page with plan selection
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxApplications: number;
  maxConnections: number;
  maxUsers: number;
  recommended?: boolean;
}

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle })
      });
      
      const { sessionId } = await response.json();
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY!);
      await stripe!.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Subscription error:', error);
      // Show error notification
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="pricing-page">
      {/* Billing cycle toggle */}
      <div className="billing-toggle">
        <button 
          className={billingCycle === 'monthly' ? 'active' : ''}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button 
          className={billingCycle === 'yearly' ? 'active' : ''}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly (Save 17%)
        </button>
      </div>

      {/* Plan cards */}
      <div className="plans-grid">
        {PRICING_PLANS.map(plan => (
          <PricingCard 
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            loading={loading === plan.id}
            onSubscribe={() => handleSubscribe(plan.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Phase 3: Webhook Processing (Week 5)
**Goal**: Handle Stripe webhooks for subscription lifecycle events

#### Critical Webhooks to Handle:
```csharp
[HttpPost("stripe/webhook")]
public async Task<IActionResult> StripeWebhook()
{
    var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
    
    try
    {
        var stripeEvent = EventUtility.ConstructEvent(
            json, 
            Request.Headers["Stripe-Signature"], 
            _config["Stripe:WebhookSecret"]);

        // Prevent duplicate processing
        var existingEvent = await _webhookRepo.GetByStripeEventIdAsync(stripeEvent.Id);
        if (existingEvent != null)
        {
            return Ok(); // Already processed
        }

        // Log the event
        await _webhookRepo.CreateAsync(new WebhookEvent
        {
            StripeEventId = stripeEvent.Id,
            EventType = stripeEvent.Type,
            EventData = json,
            ProcessingStatus = "pending"
        });

        switch (stripeEvent.Type)
        {
            case Events.CheckoutSessionCompleted:
                await HandleCheckoutCompleted(stripeEvent);
                break;
            case Events.InvoicePaymentSucceeded:
                await HandlePaymentSucceeded(stripeEvent);
                break;
            case Events.InvoicePaymentFailed:
                await HandlePaymentFailed(stripeEvent);
                break;
            case Events.CustomerSubscriptionUpdated:
                await HandleSubscriptionUpdated(stripeEvent);
                break;
            case Events.CustomerSubscriptionDeleted:
                await HandleSubscriptionCancelled(stripeEvent);
                break;
            default:
                _logger.LogInformation($"Unhandled webhook event type: {stripeEvent.Type}");
                break;
        }

        // Mark as processed
        await _webhookRepo.MarkAsProcessedAsync(stripeEvent.Id);
        
        return Ok();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Webhook processing failed");
        return BadRequest($"Webhook error: {ex.Message}");
    }
}

private async Task HandleCheckoutCompleted(Event stripeEvent)
{
    var session = stripeEvent.Data.Object as Session;
    var userId = session.ClientReferenceId;
    
    // Get subscription details from Stripe
    var subscription = await _stripeService.Subscriptions.GetAsync(session.SubscriptionId);
    
    // Create local subscription record
    await _subscriptionService.CreateSubscriptionAsync(new CreateSubscriptionRequest
    {
        UserId = userId,
        StripeCustomerId = session.CustomerId,
        StripeSubscriptionId = session.SubscriptionId,
        Status = subscription.Status,
        CurrentPeriodStart = subscription.CurrentPeriodStart,
        CurrentPeriodEnd = subscription.CurrentPeriodEnd
    });
    
    // Send welcome email
    await _emailService.SendWelcomeEmailAsync(userId);
}
```

### Phase 4: Access Control (Week 6)
**Goal**: Implement subscription-based feature gating

#### Middleware Implementation:
```csharp
public class SubscriptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ISubscriptionService _subscriptionService;

    public async Task InvokeAsync(HttpContext context)
    {
        var userId = context.User.FindFirst("UserId")?.Value;
        
        if (!string.IsNullOrEmpty(userId))
        {
            var subscription = await _subscriptionService.GetActiveSubscriptionAsync(userId);
            
            if (subscription == null)
            {
                // User has no active subscription
                if (IsProtectedEndpoint(context.Request.Path))
                {
                    context.Response.StatusCode = 402; // Payment Required
                    await context.Response.WriteAsync("Active subscription required");
                    return;
                }
            }
            else
            {
                // Add subscription info to context for controllers to use
                context.Items["Subscription"] = subscription;
                context.Items["MaxApplications"] = subscription.Plan.MaxApplications;
                context.Items["MaxConnections"] = subscription.Plan.MaxConnections;
                context.Items["MaxUsers"] = subscription.Plan.MaxUsers;
            }
        }
        
        await _next(context);
    }
}

// Usage in controllers
[HttpPost("applications")]
public async Task<IActionResult> CreateApplication([FromBody] ApplicationRequest request)
{
    var maxApps = (int)HttpContext.Items["MaxApplications"];
    var currentApps = await _applicationService.GetUserApplicationCountAsync(UserId);
    
    if (currentApps >= maxApps)
    {
        return BadRequest(new ErrorResponse
        {
            Code = "SUBSCRIPTION_LIMIT_EXCEEDED",
            Message = $"Subscription limit reached. Maximum {maxApps} applications allowed.",
            Details = "Please upgrade your subscription to create more applications."
        });
    }
    
    // Proceed with creation
    var result = await _applicationService.CreateAsync(request);
    return Ok(result);
}
```

### Phase 5: Subscription Management (Week 7-8)
**Goal**: Allow users to manage their subscriptions

#### Frontend Subscription Management:
```typescript
const SubscriptionManagement: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const sub = await subscriptionService.getCurrentSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    try {
      await subscriptionService.cancelSubscription();
      await loadSubscription(); // Reload to show updated status
      addNotification({
        title: 'Subscription Cancelled',
        message: 'Your subscription will remain active until the end of the current billing period.',
        type: 'info'
      });
    } catch (error) {
      addNotification({
        title: 'Cancellation Failed',
        message: 'Unable to cancel subscription. Please contact support.',
        type: 'error'
      });
    }
  };

  const handleUpgrade = (newPlanId: string) => {
    // Redirect to Stripe customer portal or create new checkout session
    window.location.href = `/api/subscription/upgrade?planId=${newPlanId}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="subscription-management">
      <div className="current-plan">
        <h2>Current Plan: {subscription?.plan.name}</h2>
        <p>Status: {subscription?.status}</p>
        <p>Next billing: {new Date(subscription?.currentPeriodEnd).toLocaleDateString()}</p>
        <p>Amount: ${subscription?.plan.priceMonthly}/month</p>
      </div>

      <div className="usage-metrics">
        <h3>Current Usage</h3>
        <div className="usage-item">
          <span>Applications: {subscription?.usage.applications} / {subscription?.plan.maxApplications}</span>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{width: `${(subscription?.usage.applications / subscription?.plan.maxApplications) * 100}%`}}
            />
          </div>
        </div>
        {/* Similar for connections, users, etc. */}
      </div>

      <div className="actions">
        <button onClick={() => handleUpgrade('professional')} className="btn btn-primary">
          Upgrade Plan
        </button>
        <button onClick={handleCancelSubscription} className="btn btn-secondary">
          Cancel Subscription
        </button>
      </div>
    </div>
  );
};
```

## Security Considerations

### 1. Payment Security
- **PCI Compliance**: Use Stripe - never handle raw card data
- **API Security**: Authenticate all payment endpoints
- **Webhook Validation**: Verify Stripe signatures on webhooks
- **Idempotency**: Prevent duplicate webhook processing

### 2. Fraud Detection
```csharp
public class FraudDetectionService
{
    public async Task<FraudRiskScore> AnalyzeSignupAsync(SignupRequest request, string ipAddress)
    {
        var riskFactors = new List<string>();
        var score = 0;

        // Check IP reputation
        if (await _ipReputationService.IsHighRiskAsync(ipAddress))
        {
            score += 30;
            riskFactors.Add("High-risk IP address");
        }

        // Check email domain
        if (await _emailValidationService.IsDisposableEmailAsync(request.Email))
        {
            score += 25;
            riskFactors.Add("Disposable email address");
        }

        // Check signup velocity
        var recentSignups = await _userRepo.GetRecentSignupsByIpAsync(ipAddress, TimeSpan.FromHours(1));
        if (recentSignups.Count > 3)
        {
            score += 40;
            riskFactors.Add("Multiple signups from same IP");
        }

        return new FraudRiskScore
        {
            Score = score,
            RiskLevel = score > 70 ? "HIGH" : score > 40 ? "MEDIUM" : "LOW",
            RiskFactors = riskFactors
        };
    }
}
```

### 3. Access Control Security
- **Subscription Validation**: Check on every protected request
- **Rate Limiting**: Implement per-plan API limits
- **Session Management**: Secure session handling
- **Audit Logging**: Log all subscription changes

## Business Operations

### 1. Key SaaS Metrics to Track
```typescript
interface SaaSMetrics {
  // Revenue Metrics
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  
  // Growth Metrics
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  ltvcacRatio: number; // Should be > 3:1
  
  // Retention Metrics
  netRevenueRetention: number; // Should be > 100%
  grossRevenueRetention: number;
  logoRetention: number;
  churnRate: number;
  
  // Product Metrics
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  featureAdoptionRates: Record<string, number>;
  timeToValue: number; // Days to first meaningful use
}
```

### 2. Customer Health Monitoring
```csharp
public class CustomerHealthService
{
    public async Task<CustomerHealthScore> CalculateHealthScoreAsync(string userId)
    {
        var user = await _userService.GetAsync(userId);
        var usage = await _analyticsService.GetUsageMetricsAsync(userId);
        var subscription = await _subscriptionService.GetActiveSubscriptionAsync(userId);

        var score = 100;
        var indicators = new List<string>();

        // Login frequency
        if (usage.DaysSinceLastLogin > 14)
        {
            score -= 30;
            indicators.Add("Inactive for 2+ weeks");
        }

        // Feature adoption
        if (usage.FeatureAdoptionRate < 0.3)
        {
            score -= 20;
            indicators.Add("Low feature adoption");
        }

        // Support ticket volume
        if (usage.SupportTicketsThisMonth > 3)
        {
            score -= 15;
            indicators.Add("High support ticket volume");
        }

        // Payment issues
        if (subscription?.Status == "past_due")
        {
            score -= 25;
            indicators.Add("Payment issues");
        }

        return new CustomerHealthScore
        {
            UserId = userId,
            Score = Math.Max(0, score),
            RiskLevel = score < 40 ? "HIGH" : score < 70 ? "MEDIUM" : "LOW",
            Indicators = indicators,
            LastCalculated = DateTime.UtcNow
        };
    }
}
```

### 3. Revenue Recognition
```csharp
public class RevenueRecognitionService
{
    public async Task ProcessMonthlyRevenueRecognitionAsync()
    {
        var activeSubscriptions = await _subscriptionRepo.GetAllActiveAsync();
        
        foreach (var subscription in activeSubscriptions)
        {
            var monthlyRevenue = subscription.BillingCycle == "yearly" 
                ? subscription.Amount / 12 
                : subscription.Amount;

            await _accountingService.RecognizeRevenueAsync(new RevenueEntry
            {
                SubscriptionId = subscription.Id,
                Amount = monthlyRevenue,
                RecognitionDate = DateTime.UtcNow,
                Period = $"{DateTime.UtcNow:yyyy-MM}",
                RevenueType = "Subscription"
            });
        }
    }
}
```

## Development Setup

### 1. Environment Configuration

#### Backend (.NET)
```json
// appsettings.Development.json
{
  "Stripe": {
    "PublishableKey": "pk_test_...",
    "SecretKey": "sk_test_...",
    "WebhookSecret": "whsec_..."
  },
  "App": {
    "BaseUrl": "https://localhost:3000",
    "Environment": "Development"
  },
  "Database": {
    "ConnectionString": "..."
  }
}
```

#### Frontend (React)
```env
# .env.development
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
REACT_APP_API_BASE_URL=https://localhost:5001
REACT_APP_ENVIRONMENT=development
```

### 2. Required Dependencies

#### Backend NuGet Packages
```xml
<PackageReference Include="Stripe.net" Version="43.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.0" />
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
<PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
```

#### Frontend NPM Packages
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^2.0.0",
    "@stripe/react-stripe-js": "^2.0.0",
    "react-query": "^3.39.0",
    "recharts": "^2.8.0"
  }
}
```

### 3. Development Workflow

#### Daily Development Checklist
- [ ] Start Stripe CLI for webhook forwarding: `stripe listen --forward-to localhost:5001/api/stripe/webhook`
- [ ] Use Stripe test cards for payment testing
- [ ] Check webhook event processing in Stripe dashboard
- [ ] Monitor application logs for payment errors
- [ ] Test subscription limits and access control

#### Stripe CLI Setup
```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows
choco install stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:5001/api/stripe/webhook
```

## Testing Strategy

### 1. Payment Testing

#### Stripe Test Cards
```typescript
const STRIPE_TEST_CARDS = {
  // Successful payments
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  
  // Failed payments
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  incorrectCvc: '4000000000000127',
  
  // International cards
  brazil: '4000000760000002',
  canada: '4000001240000000',
  india: '4000000000000077'
};
```

#### Automated Payment Tests
```csharp
[TestClass]
public class PaymentIntegrationTests
{
    [TestMethod]
    public async Task CreateCheckoutSession_ValidRequest_ReturnsSessionId()
    {
        // Arrange
        var request = new CreateCheckoutSessionRequest
        {
            UserId = "test-user-id",
            PlanId = "starter-plan",
            BillingCycle = "monthly"
        };

        // Act
        var result = await _subscriptionService.CreateCheckoutSessionAsync(request);

        // Assert
        Assert.IsNotNull(result.SessionId);
        Assert.IsTrue(result.SessionId.StartsWith("cs_test_"));
    }

    [TestMethod]
    public async Task WebhookHandler_CheckoutCompleted_CreatesSubscription()
    {
        // Arrange
        var webhookEvent = CreateTestWebhookEvent("checkout.session.completed");

        // Act
        var result = await _webhookController.StripeWebhook(webhookEvent);

        // Assert
        Assert.IsInstanceOfType(result, typeof(OkResult));
        
        var subscription = await _subscriptionRepo.GetByStripeIdAsync("sub_test_123");
        Assert.IsNotNull(subscription);
        Assert.AreEqual("active", subscription.Status);
    }
}
```

### 2. Load Testing
```javascript
// k6 load test script for subscription endpoints
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 }
  ]
};

export default function() {
  // Test subscription creation under load
  let response = http.post('https://api.cams.com/subscription/create-checkout-session', {
    planId: 'starter',
    billingCycle: 'monthly'
  });
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000
  });
}
```

### 3. Security Testing
- **Penetration Testing**: Hire security firm for annual testing
- **Vulnerability Scanning**: Use tools like OWASP ZAP
- **Payment Security**: Test with invalid/malicious payment data
- **Access Control**: Verify subscription-based restrictions work

## Monitoring & Analytics

### 1. Key Metrics Dashboard
```csharp
public class MetricsCollectorService
{
    public async Task CollectDailyMetricsAsync()
    {
        var metrics = new
        {
            // Revenue Metrics
            TotalActiveSubscriptions = await _subscriptionRepo.CountActiveAsync(),
            MonthlyRecurringRevenue = await CalculateMRRAsync(),
            DailyRevenue = await CalculateDailyRevenueAsync(),
            
            // Customer Metrics
            NewSignups = await _userRepo.CountSignupsAsync(DateTime.Today),
            Cancellations = await _subscriptionRepo.CountCancellationsAsync(DateTime.Today),
            ChurnRate = await CalculateChurnRateAsync(),
            
            // Technical Metrics
            PaymentSuccessRate = await CalculatePaymentSuccessRateAsync(),
            WebhookProcessingLatency = await CalculateWebhookLatencyAsync(),
            ApiResponseTime = await CalculateApiResponseTimeAsync()
        };

        // Send to monitoring service (Datadog, New Relic, etc.)
        await _monitoringService.ReportMetricsAsync("saas.daily", metrics);
        
        // Alert on critical issues
        if (metrics.PaymentSuccessRate < 0.95)
        {
            await _alertService.SendCriticalAlertAsync("Payment success rate below 95%", metrics);
        }
    }
}
```

### 2. Financial Alerts
```csharp
public class FinancialAlertService
{
    public async Task CheckFinancialHealthAsync()
    {
        var metrics = await _metricsService.GetCurrentMetricsAsync();
        
        // High churn rate alert
        if (metrics.MonthlyChurnRate > 0.05) // 5%
        {
            await SendAlertAsync("HIGH_CHURN", $"Monthly churn rate is {metrics.MonthlyChurnRate:P2}");
        }
        
        // Low conversion rate
        if (metrics.TrialToPayingConversion < 0.15) // 15%
        {
            await SendAlertAsync("LOW_CONVERSION", $"Trial conversion rate is {metrics.TrialToPayingConversion:P2}");
        }
        
        // Failed payment spike
        if (metrics.FailedPaymentRate > 0.10) // 10%
        {
            await SendAlertAsync("PAYMENT_FAILURES", $"Failed payment rate is {metrics.FailedPaymentRate:P2}");
        }
    }
}
```

### 3. Customer Analytics
```typescript
interface CustomerSegmentation {
  powerUsers: Customer[]; // High usage, high value
  atRiskUsers: Customer[]; // Low usage, payment issues
  growthOpportunities: Customer[]; // Using basic plan, high usage
  newUsers: Customer[]; // Recently signed up
}

const segmentCustomers = async (): Promise<CustomerSegmentation> => {
  const customers = await customerService.getAllCustomers();
  
  return {
    powerUsers: customers.filter(c => 
      c.monthlyUsage > c.planLimits.usage * 0.8 && 
      c.subscription.plan.tier === 'enterprise'
    ),
    atRiskUsers: customers.filter(c => 
      c.healthScore < 40 || 
      c.subscription.status === 'past_due'
    ),
    growthOpportunities: customers.filter(c => 
      c.monthlyUsage > c.planLimits.usage * 0.7 && 
      c.subscription.plan.tier === 'starter'
    ),
    newUsers: customers.filter(c => 
      Date.now() - c.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
    )
  };
};
```

## Go-Live Checklist

### Pre-Launch (Production Readiness)

#### Legal & Compliance
- [ ] **Legal Documents Review**: All legal documents reviewed by lawyer
- [ ] **Privacy Policy**: Comprehensive privacy policy in place
- [ ] **Terms of Service**: Clear terms including cancellation policy
- [ ] **GDPR Compliance**: Data export/deletion endpoints implemented
- [ ] **Tax Compliance**: Tax calculation configured for required jurisdictions

#### Technical Infrastructure
- [ ] **Stripe Production Setup**: Live Stripe account configured
- [ ] **Webhook Endpoints**: Production webhook endpoints configured and tested
- [ ] **Database Migration**: Production database schema deployed
- [ ] **SSL Certificates**: All endpoints secured with valid SSL
- [ ] **Backup Strategy**: Automated backups configured for critical data

#### Security
- [ ] **Security Audit**: Third-party security audit completed
- [ ] **Penetration Testing**: Payment flow penetration tested
- [ ] **Access Control**: Subscription-based access control tested
- [ ] **Fraud Detection**: Basic fraud detection rules implemented
- [ ] **Rate Limiting**: API rate limiting per subscription plan implemented

#### Monitoring & Alerting
- [ ] **Error Monitoring**: Error tracking (Sentry, Bugsnag) configured
- [ ] **Performance Monitoring**: APM (New Relic, Datadog) configured
- [ ] **Financial Alerts**: Critical financial metrics alerting set up
- [ ] **Uptime Monitoring**: Payment endpoint uptime monitoring configured
- [ ] **Log Aggregation**: Centralized logging for troubleshooting

#### Testing
- [ ] **Load Testing**: Payment flow load tested for expected traffic
- [ ] **End-to-End Testing**: Complete subscription lifecycle tested
- [ ] **Webhook Testing**: All webhook scenarios tested in production-like environment
- [ ] **Mobile Testing**: Payment flow tested on mobile devices
- [ ] **Browser Testing**: Cross-browser payment compatibility verified

### Launch Day
- [ ] **Soft Launch**: Launch to limited user group (beta users)
- [ ] **Monitor Metrics**: Closely monitor payment success rates
- [ ] **Customer Support**: Support team briefed on payment-related issues
- [ ] **Rollback Plan**: Plan in place to rollback if critical issues occur

### Post-Launch (First 30 Days)
- [ ] **Daily Metric Reviews**: Review key metrics daily
- [ ] **Customer Feedback**: Collect feedback on payment experience
- [ ] **Performance Optimization**: Optimize based on real-world usage
- [ ] **Support Documentation**: Update support docs based on common issues

### Ongoing Maintenance

#### Monthly Tasks
- [ ] **Financial Reconciliation**: Reconcile Stripe data with internal records
- [ ] **Metric Analysis**: Analyze churn, conversion, and growth metrics
- [ ] **Security Review**: Review access logs and security incidents
- [ ] **Performance Review**: Analyze payment flow performance

#### Quarterly Tasks
- [ ] **Legal Review**: Review legal documents for updates needed
- [ ] **Security Audit**: Quarterly security review
- [ ] **Compliance Check**: Ensure ongoing compliance with regulations
- [ ] **Disaster Recovery Test**: Test backup and recovery procedures

#### Annual Tasks
- [ ] **Comprehensive Security Audit**: Full third-party security audit
- [ ] **Legal Document Update**: Annual legal document review and updates
- [ ] **Tax Law Review**: Review tax compliance for new jurisdictions
- [ ] **Insurance Review**: Review cyber liability and business insurance

---

## Quick Start Commands

### Set up Development Environment
```bash
# Backend setup
cd Backend
dotnet restore
dotnet ef database update
dotnet run

# Frontend setup
cd frontend
npm install
npm start

# Stripe CLI setup
stripe login
stripe listen --forward-to localhost:5001/api/stripe/webhook
```

### Create Test Subscription Plans
```sql
EXEC [dbo].[CreateTestSubscriptionPlans]
```

### Test Payment Flow
1. Navigate to `/pricing`
2. Select a plan
3. Use test card: `4242424242424242`
4. Complete checkout
5. Verify subscription in `/account/subscription`

---

This guide provides a comprehensive roadmap for implementing a production-ready payment system for CAMS. Start with Phase 1 and work through each phase systematically, ensuring proper testing and compliance at each step.

For questions or support during implementation, consult the respective service documentation:
- **Stripe**: https://stripe.com/docs
- **Legal**: Consult with technology lawyer
- **Security**: Consider hiring security consultant for audit

Remember: Payment systems are critical business infrastructure. Take time to implement properly and don't rush to production without thorough testing and legal review.