# AI Model Costs & Pricing Analysis

## Overview
This document provides cost analysis for the AI models used in The Boxing Locker platform, including chat and voice interactions.

## Models Used

### 1. Chat Model: Google Gemini 2.5 Flash (via OpenRouter)
- **Model ID**: `google/gemini-2.5-flash`
- **Provider**: OpenRouter API
- **Use Case**: Text-based chat conversations with Matt Goddard's AI coach

### 2. Voice Model: Gemini 2.5 Flash Native Audio
- **Model ID**: `gemini-2.5-flash-native-audio-preview-12-2025`
- **Provider**: Google Gemini Live API (Direct)
- **Use Case**: Real-time voice conversations with Freya Mills' AI coach

---

## Chat Model Costs (Google Gemini 2.5 Flash)

### Pricing Structure
**Note**: Exact pricing for Gemini 2.5 Flash via OpenRouter may vary. Based on typical AI model pricing patterns:

#### Estimated Pricing (as of 2025)
- **Input Tokens**: ~$0.10 - $0.25 per 1M tokens
- **Output Tokens**: ~$0.30 - $0.50 per 1M tokens
- **Model Type**: Fast, efficient model optimized for speed and cost

### Cost Per Message Calculation

#### Average Message Breakdown
- **User Input**: ~50-100 words = ~75-150 tokens
- **AI Response**: ~150-300 words = ~225-450 tokens
- **System Prompt**: ~500 tokens (one-time per session)
- **Context History**: ~200-500 tokens (accumulates over conversation)

#### Per Message Cost Estimate
- **Input Cost**: 150 tokens × ($0.20 / 1,000,000) = **$0.00003**
- **Output Cost**: 350 tokens × ($0.40 / 1,000,000) = **$0.00014**
- **Total per Message**: **~$0.00017 - $0.00025**

### Monthly Cost Estimates

#### Light User (50 messages/month)
- 50 messages × $0.00020 = **$0.01/month**

#### Average User (200 messages/month)
- 200 messages × $0.00020 = **$0.04/month**

#### Heavy User (1,000 messages/month)
- 1,000 messages × $0.00020 = **$0.20/month**

#### Platform Scale (10,000 users, 200 avg messages)
- 10,000 users × 200 messages × $0.00020 = **$400/month**

---

## Voice Model Costs (Gemini Live API)

### Pricing Structure
**Source**: Google Cloud Vertex AI Gemini Live API Pricing (2025)

#### Actual Pricing Structure
- **Session Setup**: $0.005 per session (one-time charge)
- **Active Time**: $0.025 per minute of active conversation
- **Audio Input Tokens**: $3.00 per 1 million tokens
- **Audio Output Tokens**: $12.00 per 1 million tokens

### Cost Per Session Calculation

#### Average Session Breakdown
- **Session Length**: 5-10 minutes
- **Audio Tokens**: ~1,000 tokens per minute (input + output)
- **Active Speaking**: Real-time streaming throughout session

#### Per Session Cost Calculation (5-minute example)
- **Session Setup**: $0.005
- **Active Time**: 5 minutes × $0.025 = **$0.125**
- **Audio Input**: 5,000 tokens × ($3.00 / 1,000,000) = **$0.015**
- **Audio Output**: 5,000 tokens × ($12.00 / 1,000,000) = **$0.06**
- **Total per 5-minute session**: **$0.205**

#### Per Session Cost Estimate
- **5-minute session**: **~$0.20 - $0.25**
- **10-minute session**: **~$0.40 - $0.50**
- **Average**: **~$0.20 - $0.30 per session**

### Monthly Cost Estimates

#### Light User (5 sessions/month)
- 5 sessions × $0.25 = **$1.25/month**

#### Average User (10 sessions/month)
- 10 sessions × $0.25 = **$2.50/month**

#### Heavy User (30 sessions/month)
- 30 sessions × $0.25 = **$7.50/month**

#### Platform Scale (1,000 users, 10 avg sessions)
- 1,000 users × 10 sessions × $0.25 = **$2,500/month**

---

## Coach Page (Lead Magnet) Costs

### Model Used
- **Model**: `google/gemini-2.5-flash` (same as chat)
- **Response Type**: Structured JSON output
- **Response Length**: Longer responses (500-1000 words)

### Cost Per Plan Generation
- **Input**: ~200-300 tokens (form data + system prompt)
- **Output**: ~750-1500 tokens (comprehensive coaching plan)
- **Total**: ~1,000-1,800 tokens per generation

#### Per Plan Cost
- **Input Cost**: 250 tokens × ($0.20 / 1,000,000) = $0.00005
- **Output Cost**: 1,000 tokens × ($0.40 / 1,000,000) = $0.00040
- **Total per Plan**: **~$0.00045 - $0.00080**

### Monthly Cost Estimates

#### Lead Generation (1,000 plans/month)
- 1,000 plans × $0.00060 = **$0.60/month**

#### High Volume (10,000 plans/month)
- 10,000 plans × $0.00060 = **$6/month**

---

## Total Platform Cost Estimates

### Scenario 1: Small Scale (100 active users)
- **Chat**: 100 users × 200 msgs × $0.00020 = **$4/month**
- **Voice**: 100 users × 10 sessions × $0.12 = **$120/month**
- **Coach Plans**: 500 plans × $0.00060 = **$0.30/month**
- **Total**: **~$124/month**

### Scenario 2: Medium Scale (1,000 active users)
- **Chat**: 1,000 users × 200 msgs × $0.00020 = **$40/month**
- **Voice**: 1,000 users × 10 sessions × $0.12 = **$1,200/month**
- **Coach Plans**: 5,000 plans × $0.00060 = **$3/month**
- **Total**: **~$1,243/month**

### Scenario 3: Large Scale (10,000 active users)
- **Chat**: 10,000 users × 200 msgs × $0.00020 = **$400/month**
- **Voice**: 10,000 users × 10 sessions × $0.12 = **$12,000/month**
- **Coach Plans**: 50,000 plans × $0.00060 = **$30/month**
- **Total**: **~$12,430/month**

---

## Cost Optimization Strategies

### 1. Caching
- **System Prompts**: Cache system prompts to reduce input tokens
- **Common Responses**: Cache frequently asked questions
- **Estimated Savings**: 20-30% reduction in input costs

### 2. Response Length Management
- **Token Limits**: Set appropriate max_tokens to prevent over-generation
- **Structured Output**: Use JSON schema to reduce unnecessary text
- **Estimated Savings**: 10-15% reduction in output costs

### 3. Session Management
- **Context Window**: Limit conversation history to recent messages
- **Summary**: Summarize old messages instead of keeping full history
- **Estimated Savings**: 15-25% reduction in input costs

### 4. Model Selection
- **Flash Models**: Already using cost-optimized models
- **Alternative Models**: Consider even cheaper models for simple queries
- **Estimated Savings**: 30-50% for non-critical interactions

### 5. Rate Limiting
- **User Limits**: Implement reasonable rate limits per user
- **Tiered Access**: Different limits for free vs. paid users
- **Estimated Savings**: Prevents abuse and reduces costs

---

## Pricing Verification

### How to Verify Actual Costs

1. **OpenRouter Pricing**:
   - Visit: https://openrouter.ai/models
   - Search for "google/gemini-2.5-flash"
   - Check current pricing per 1M tokens

2. **Google Gemini Live API**:
   - Visit: https://ai.google.dev/pricing
   - Check Gemini Live API pricing
   - Contact Google Sales for enterprise pricing

3. **Monitor Usage**:
   - Track actual token usage in production
   - Monitor API response times and costs
   - Adjust estimates based on real data

---

## Recommendations

### For Client Pitch
1. **Emphasize Cost Efficiency**: Using Flash models keeps costs low
2. **Scale Predictability**: Linear cost scaling with user growth
3. **Optimization Potential**: Multiple strategies to reduce costs further
4. **Competitive Advantage**: Low costs enable competitive pricing

### For Budget Planning
1. **Start Conservative**: Use higher estimates for initial budgets
2. **Monitor Closely**: Track actual costs in first month
3. **Optimize Early**: Implement caching and optimization from start
4. **Plan for Growth**: Budget for 2-3x growth in first year

---

## Notes

- **Pricing Subject to Change**: AI model pricing can change frequently
- **Volume Discounts**: May be available at higher usage volumes
- **Regional Variations**: Pricing may vary by region
- **API Updates**: New models may offer better price/performance

**Last Updated**: January 2025
**Next Review**: Quarterly or when pricing changes significantly

