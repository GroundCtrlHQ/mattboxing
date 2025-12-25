# The Boxing Locker - Documentation

This directory contains all documentation for The Boxing Locker platform, organized by category for easy navigation.

## 📁 Directory Structure

```
docs/
├── README.md (this file)
├── PRD.MD (Product Requirements Document)
├── setup/ (Setup & Configuration)
│   ├── ENV_SETUP.md
│   └── AIVOICE_SETUP.md
├── implementation/ (Implementation Guides)
│   ├── IMPLEMENTATION_CHECKLIST.md
│   └── AIVOICE_IMPLEMENTATION_PLAN.md
├── api-reference/ (API Documentation)
│   ├── GEMINI_LIVE_API_REFERENCE.md
│   └── TESTING_VOICE.md
├── features/ (Feature Documentation)
│   ├── MATT_GODDARD_FAQ.md
│   └── SCRAPECREATORS.md
├── pages/ (Page Documentation)
│   ├── home-page.md
│   ├── chat-page.md
│   ├── coach-page.md
│   ├── videos-page.md
│   ├── about-page.md
│   └── voice-page.md
└── costs/ (Cost Analysis)
    └── ai-model-costs.md
```

## 🚀 Quick Start

### For Developers
1. Start with [PRD.MD](./PRD.MD) for project overview
2. Follow [setup/ENV_SETUP.md](./setup/ENV_SETUP.md) for environment configuration
3. Review [implementation/IMPLEMENTATION_CHECKLIST.md](./implementation/IMPLEMENTATION_CHECKLIST.md) for development roadmap

### For Client Pitch
1. Review [pages/](./pages/) directory for page-by-page feature breakdown
2. Check [costs/ai-model-costs.md](./costs/ai-model-costs.md) for pricing analysis
3. Reference [PRD.MD](./PRD.MD) for product vision and strategy

## 📄 Documentation by Category

### Setup & Configuration
- **[ENV_SETUP.md](./setup/ENV_SETUP.md)**: Environment variables and API keys setup
- **[AIVOICE_SETUP.md](./setup/AIVOICE_SETUP.md)**: Voice coach feature setup instructions

### Implementation Guides
- **[IMPLEMENTATION_CHECKLIST.md](./implementation/IMPLEMENTATION_CHECKLIST.md)**: Complete implementation roadmap and checklist
- **[AIVOICE_IMPLEMENTATION_PLAN.md](./implementation/AIVOICE_IMPLEMENTATION_PLAN.md)**: Voice feature implementation plan

### API Reference
- **[GEMINI_LIVE_API_REFERENCE.md](./api-reference/GEMINI_LIVE_API_REFERENCE.md)**: Google Gemini Live API documentation
- **[TESTING_VOICE.md](./api-reference/TESTING_VOICE.md)**: Voice feature testing guide

### Features
- **[MATT_GODDARD_FAQ.md](./features/MATT_GODDARD_FAQ.md)**: FAQ content used for AI coach context
- **[SCRAPECREATORS.md](./features/SCRAPECREATORS.md)**: Video scraping API documentation

### Page Documentation
Each page has detailed documentation:
- **[home-page.md](./pages/home-page.md)**: Landing page features and purpose
- **[chat-page.md](./pages/chat-page.md)**: Text chat interface with AI coach
- **[coach-page.md](./pages/coach-page.md)**: Lead magnet coaching plan generator
- **[videos-page.md](./pages/videos-page.md)**: Video library browser
- **[about-page.md](./pages/about-page.md)**: About Matt Goddard page
- **[voice-page.md](./pages/voice-page.md)**: Real-time voice coaching interface

### Cost Analysis
- **[ai-model-costs.md](./costs/ai-model-costs.md)**: Comprehensive AI model pricing and cost estimates

## 🎯 Key Documents for Client Pitch

### Essential Reading
1. **Product Overview**: [PRD.MD](./PRD.MD)
2. **Page Features**: [pages/](./pages/) directory
3. **Cost Analysis**: [costs/ai-model-costs.md](./costs/ai-model-costs.md)

### Supporting Documents
- **Implementation Status**: [implementation/IMPLEMENTATION_CHECKLIST.md](./implementation/IMPLEMENTATION_CHECKLIST.md)
- **Feature Details**: [features/](./features/) directory
- **Technical Setup**: [setup/](./setup/) directory

## 📊 Platform Overview

### Core Features
1. **AI Chat Coach**: Text-based conversations with Matt Goddard's AI
2. **Voice Coach**: Real-time voice conversations with Freya Mills' AI
3. **Lead Magnet Coach**: Free personalized coaching plan generator
4. **Video Library**: 600+ curated boxing technique videos
5. **About Page**: Credibility and philosophy showcase

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Google Gemini 2.5 Flash (via OpenRouter)
- **Voice**: Google Gemini Live API
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS v4

### Cost Structure
- **Chat**: ~$0.0002 per message
- **Voice**: ~$0.10-0.15 per session
- **Coach Plans**: ~$0.0006 per plan
- **See**: [costs/ai-model-costs.md](./costs/ai-model-costs.md) for detailed breakdown

## 🔍 Finding Information

### By Topic
- **Setup Questions**: Check [setup/](./setup/) directory
- **Feature Questions**: Check [features/](./features/) or [pages/](./pages/) directories
- **Cost Questions**: Check [costs/](./costs/) directory
- **Implementation Questions**: Check [implementation/](./implementation/) directory

### By Role
- **Developers**: Start with setup and implementation docs
- **Product Managers**: Focus on PRD and page documentation
- **Clients/Stakeholders**: Review PRD, pages, and costs
- **QA/Testers**: Check API reference and testing docs

## 📝 Document Maintenance

### When to Update
- **After major features**: Update relevant page docs
- **After cost changes**: Update cost analysis
- **After setup changes**: Update setup docs
- **After implementation**: Update checklist status

### Document Standards
- Use clear, descriptive headings
- Include purpose and key features
- Add technical details where relevant
- Keep cost estimates current
- Link related documents

## 🤝 Contributing

When adding new documentation:
1. Place in appropriate subdirectory
2. Follow existing naming conventions
3. Update this README with new document
4. Link from related documents

---

**Last Updated**: January 2025
**Maintained By**: Development Team
