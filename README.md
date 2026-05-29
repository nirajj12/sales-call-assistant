# SalesSignal AI

**SalesSignal AI** is an AI-powered sales call intelligence platform that turns speaker-labeled sales transcripts into structured, actionable deal insights.

It analyzes a sales conversation and extracts **MEDDIC qualification signals**, **buyer objections**, **deal risks**, **buying signals**, **next actions**, **rep coaching recommendations**, and **evidence-backed transcript quotes** through an async LangGraph workflow.

## Assignment Deliverables

This repository includes the required deliverables:

- GitHub-ready project repository
- 3 sample transcripts in [transcripts](/Users/nirajmac/Documents/Intellify/transcripts)
- README coverage for:
  - MEDDIC extraction prompt design
  - confidence scoring
  - objection classification
  - async job architecture

## LLM Strategy

### Primary LLM Used

The current working local setup uses:

- **Provider:** Groq
- **Model:** `llama-3.3-70b-versatile`

This is the configuration the app is currently tuned and validated against for local development and demo runs.

Why this choice:

- low-latency structured JSON responses
- good cost/performance tradeoff for repeated pipeline calls
- strong fit for parallel MEDDIC and objection extraction in a background workflow

### Alternative Providers Supported

The LLM client also supports these providers:

- OpenAI
- Gemini
- Anthropic
- Mock mode for local development without a real API provider

The provider layer is implemented in [app/services/llm_client.py](/Users/nirajmac/Documents/Intellify/app/services/llm_client.py) and can route requests through provider-specific clients while preserving the same structured extraction interface for the rest of the graph.

Important implementation note:

- provider fallbacks should only be enabled when the configured model name is valid for those fallback providers
- for example, `llama-3.3-70b-versatile` is a Groq-oriented model name and should not be reused as an OpenAI or Gemini fallback model

For that reason, the recommended local config keeps `LLM_PROVIDER_FALLBACKS` empty unless you explicitly configure compatible alternatives.

## Demo Overview

Sales managers only review a small percentage of calls manually. Most sales conversations contain important signals about pain, urgency, approval process, objections, and buying intent, but those signals usually stay buried inside transcripts.

SalesSignal AI solves this by converting raw call transcripts into structured intelligence that sales teams can use immediately.

With one transcript, the system produces:

- MEDDIC analysis
- Objection analysis
- Deal intelligence
- Risk assessment
- Buying signals
- Rep coaching
- Evidence-backed transcript quotes
- Async job progress tracking

## Core Features

### Transcript Input

Users can submit a transcript in two ways:

- Paste transcript text directly into the app
- Upload a transcript file

The system expects speaker-labeled transcript format such as:

```txt
Rep: Thanks for joining today. What challenges are you facing with your current process?
Customer: Our team spends too much time manually preparing weekly reports.
Rep: How much time does that usually take?
Customer: Around 10 hours per week across the team.
```

Speaker attribution is preserved throughout the workflow so each extracted insight can be traced back to the rep or customer.

### MEDDIC Extraction

The workflow extracts all six MEDDIC elements:

| MEDDIC Element | Meaning |
| --- | --- |
| Metrics | Quantifiable business impact or measurable outcome |
| Economic Buyer | Person with budget or final approval authority |
| Decision Criteria | Factors used to compare and select a solution |
| Decision Process | Steps, stakeholders, and timeline for making a decision |
| Identify Pain | Business problem driving the purchase |
| Champion | Internal advocate supporting the deal |

Each MEDDIC element includes:

- Extracted value
- Confidence level
- Supporting transcript evidence
- Gap flag if the element is missing or weak
- Suggested follow-up question for the rep

### MEDDIC Extraction Prompt Design

The MEDDIC extraction step uses a dedicated structured prompt instead of sharing one large prompt with the rest of the workflow.

The prompt is designed to do four things consistently:

- force extraction of the six MEDDIC keys only
- require quote-grounded evidence for each extracted claim
- assign confidence based on evidence strength instead of guesswork
- mark missing elements as gaps rather than inventing answers

At a high level, the prompt instructs the model to:

1. read only the provided transcript
2. extract `metrics`, `economic_buyer`, `decision_criteria`, `decision_process`, `identify_pain`, and `champion`
3. return structured JSON for each field
4. include evidence anchors from the transcript
5. lower confidence or mark gaps when support is weak

This separation is important because MEDDIC extraction is the most schema-sensitive part of the pipeline, and keeping it isolated improves reliability, validation, and retry handling.

The design goal is not just “extract MEDDIC,” but “extract MEDDIC in a way the rest of the system can trust.” That is why the prompt is paired with schema validation, JSON repair, quote verification, and downstream judge review.

Example:

```json
{
  "element": "Metrics",
  "value": "Customer spends around 10 hours per week preparing reports manually.",
  "confidence": "high",
  "evidence": "Customer: Around 10 hours per week across the team.",
  "gap": false
}
```

### Confidence Scoring

Confidence is based on how clearly the transcript supports the extracted signal.

- `high`: direct, specific, quote-backed evidence
- `medium`: implied or partially confirmed evidence
- `low`: vague or weakly supported evidence
- `none`: insufficient evidence, treated as a gap

If a MEDDIC element is missing, the system marks a gap and recommends the next discovery question.

In practice, confidence works like this:

- `high` means the transcript contains a direct, specific answer with strong evidence
- `medium` means the answer is implied or partially supported
- `low` means the signal is present but ambiguous or weak
- `none` means the system should not claim the field was actually discovered

### Objection Analysis

The workflow detects both explicit and implicit objections.

Each objection includes:

- Objection text
- Category
- Explicit or implicit classification
- How the rep handled it
- Suggested better response
- Supporting evidence quote

Supported objection categories include:

- Price
- Timing
- Competition
- Need
- Authority
- Security

### How Objections Are Classified

The objection extraction step uses a separate prompt and schema from MEDDIC extraction.

Each objection is classified across three dimensions:

- **category**: what kind of concern the buyer raised
- **explicitness**: whether the objection was said directly or implied indirectly
- **handling quality**: whether the rep addressed, deflected, or missed the objection

The category mapping is intentionally practical for sales coaching:

- `price`: budget, ROI, cost, pricing pushback
- `timing`: delays, competing priorities, implementation timing
- `competition`: existing vendor, alternative solution, replacement resistance
- `need`: weak urgency or unclear business pain
- `authority`: missing access to approvers or decision-makers
- `security`: compliance, IT review, privacy, procurement risk

This structure makes the objections section useful for both deal inspection and rep coaching.

Example:

```json
{
  "category": "price",
  "objection": "The customer said the solution may be outside the current budget.",
  "explicitness": "explicit",
  "handling_quality": "partially addressed",
  "suggested_response": "The rep should connect price to measurable ROI and confirm what budget range would be acceptable.",
  "evidence": "Customer: This may be outside our budget for this quarter."
}
```

### Deal Intelligence

The deal intelligence layer summarizes the overall health of the opportunity.

It includes:

- Deal risk score
- Risk factors
- Buying signals
- Competitor mentions
- Next actions
- Deal stage assessment

### Rep Coaching

The coaching module evaluates rep performance and produces practical feedback.

It includes:

- Talk ratio
- Question quality
- Missed discovery opportunities
- Coaching points
- Recommended next steps

Example coaching output:

```txt
The rep asked good pain-discovery questions, but did not confirm the decision process or identify the Economic Buyer. On the next call, the rep should ask who owns final approval and what steps are required before purchase.
```

## Architecture

The project uses an async AI pipeline so long-running LLM analysis does not block the API request.

```txt
Frontend UI
   |
   | POST /api/v1/analyze
   v
FastAPI Backend
   |
   | Create job
   | Queue background task
   v
Celery Worker + Redis
   |
   | Invoke LangGraph workflow
   v
LangGraph Pipeline
   |
   | Transcript Loader
   | Normaliser
   | MEDDIC Extractor
   | Objection Extractor
   | Validators
   | Quote Verifier
   | Judge LLM
   | Coaching + Deal Intelligence
   | Persistence
   v
PostgreSQL
   |
   | Store job + analysis result
   v
Frontend Dashboard
```

### Key Runtime Files

- [app/main.py](/Users/nirajmac/Documents/Intellify/app/main.py)
- [app/worker.py](/Users/nirajmac/Documents/Intellify/app/worker.py)
- [app/graph/state.py](/Users/nirajmac/Documents/Intellify/app/graph/state.py)
- [app/graph/nodes.py](/Users/nirajmac/Documents/Intellify/app/graph/nodes.py)
- [app/graph/routes.py](/Users/nirajmac/Documents/Intellify/app/graph/routes.py)
- [app/graph/workflow.py](/Users/nirajmac/Documents/Intellify/app/graph/workflow.py)
- [app/db/database.py](/Users/nirajmac/Documents/Intellify/app/db/database.py)
- [ui/web](/Users/nirajmac/Documents/Intellify/ui/web)

## LangGraph Workflow

The analysis pipeline is implemented as a shared-state graph.

Main stages:

1. **Transcript Loader**
   Accepts raw transcript text, validates basic requirements, and initializes graph state.
2. **Transcript Normaliser**
   Parses speaker-labeled turns, preserves attribution, and computes transcript metadata.
3. **MEDDIC Extractor**
   Uses a structured LLM prompt to extract MEDDIC fields with evidence and confidence.
4. **Objection Extractor**
   Detects objections, classifies them, and evaluates rep handling.
5. **Schema Validators**
   Validates LLM output against expected schemas before it moves deeper into the graph.
6. **Quote Verifier**
   Checks whether extracted evidence appears in the transcript to reduce unsupported claims.
7. **Judge LLM**
   Reviews support strength and can downgrade weak or indirect evidence.
8. **Coaching + Deal Intelligence**
   Generates coaching output, buying signals, next actions, and deal risk.
9. **Persistence**
   Saves the final analysis record and updates async job status.

## Async Job Architecture

The app uses background processing because the full LLM workflow takes longer than a normal request-response cycle.

### API Flow

1. User submits a transcript.
2. FastAPI creates a job record.
3. FastAPI immediately returns a `job_id`.
4. Celery processes the LangGraph workflow in the background.
5. Frontend polls job status.
6. When complete, frontend fetches the saved analysis result.

### Main Endpoints

```txt
POST /api/v1/analyze
POST /api/v1/analyze/upload
GET  /api/v1/jobs/{job_id}
GET  /api/v1/analysis/{analysis_id}
GET  /api/v1/analyses
GET  /health
GET  /docs
```

### Job States

```txt
pending
running
completed
partial
failed
```

This design avoids HTTP timeouts and gives the UI a cleaner progress experience.

## Tech Stack

### Frontend

- React
- React Router
- TypeScript
- Chakra UI
- Tailwind CSS
- TanStack Query

### Backend

- FastAPI
- Python
- LangGraph
- Celery
- Redis
- PostgreSQL
- SQLAlchemy Async

### AI Layer

- LLM-based structured extraction
- Prompt-driven MEDDIC analysis
- Prompt-driven objection detection
- Judge LLM validation
- Quote-grounded evidence verification

## UI Pages

### Home Page

The landing page introduces the product and its main capabilities:

- MEDDIC extraction
- Objection detection
- Evidence verification
- AI coaching
- Deal intelligence
- Async workflow tracking

### Transcript Input

Users can:

- Paste a transcript
- Upload a transcript file

### Analysis Progress

After submission, the UI polls the background job and transitions to the analysis view when complete.

### Dashboard

The final dashboard is organized into sections for:

- Summary metrics
- MEDDIC analysis
- Objections
- Deal intelligence
- Rep coaching
- Transcript evidence

## Prompting and Reliability

The system uses separate prompts for focused reasoning tasks instead of asking one model response to do everything at once.

That makes the pipeline more reliable because each step has a specific responsibility:

- MEDDIC prompt extracts qualification signals
- Objection prompt detects and classifies objections
- Judge prompt checks support strength and confidence
- Coaching/deal prompt synthesizes rep feedback and opportunity signals

Prompt files live in:

- [app/prompts/meddic.txt](/Users/nirajmac/Documents/Intellify/app/prompts/meddic.txt)
- [app/prompts/objection.txt](/Users/nirajmac/Documents/Intellify/app/prompts/objection.txt)
- [app/prompts/judge.txt](/Users/nirajmac/Documents/Intellify/app/prompts/judge.txt)

Reliability features in the pipeline include:

- Typed graph state
- Structured schemas
- Pydantic validation
- JSON repair and retry handling
- Confidence levels
- Gap flags
- Quote verification
- Judge review
- Partial failure support

If one part of the analysis fails, the system can still return a partial result instead of dropping the whole job.

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/nirajj12/sales-call-assistant.git
cd sales-call-assistant
```

### 2. Create a Python environment

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy [.env.example](/Users/nirajmac/Documents/Intellify/.env.example) to `.env` and update it for your local stack.

Recommended working local configuration:

```env
APP_ENV=development
ENVIRONMENT=development
DEBUG=true
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/sales_call_intelligence
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
LLM_TEMPERATURE=0.1
LLM_MAX_OUTPUT_TOKENS=1200
LLM_TIMEOUT_SECONDS=60
LLM_PROVIDER_FALLBACKS=
GROQ_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
MAX_TRANSCRIPT_CHARS=50000
APP_LOG_LEVEL=INFO
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=intellify
FRONTEND_DEV_URL=http://localhost:4000
```

Notes:

- `5433` is used intentionally to avoid conflicts with a local PostgreSQL install on `5432`.
- The recommended provider for this project right now is `groq` with `llama-3.3-70b-versatile`.
- If you switch to OpenAI, Gemini, or Anthropic, also switch `LLM_MODEL` to a model that exists on that provider.
- If you use a Groq-specific model, keep `LLM_PROVIDER_FALLBACKS` empty unless you also configure provider-compatible model names.
- Add only the API key for the provider you are actually using.

### 4. Start Redis

```bash
docker run -d -p 6379:6379 --name intellify-redis redis:7
```

### 5. Start PostgreSQL

```bash
docker run -d \
  --name intellify-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=sales_call_intelligence \
  -p 5433:5432 \
  postgres:16
```

### 6. Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

### 7. Start the worker

```bash
celery -A app.worker.celery_app worker --loglevel=info --concurrency=4
```

### 8. Start the frontend

```bash
cd ui/web
npm install
npm run dev
```

### 9. Open the app

- Frontend: [http://localhost:4000](http://localhost:4000)
- Backend root: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

The backend root is configured to redirect to the frontend during local development, so `http://127.0.0.1:8000/` is a convenient entry point as well.

## Quick Smoke Test

You can use the local smoke script:

```bash
bash scripts/smoke_test.sh
```

Or test the analyze endpoint directly:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Rep: What is your biggest challenge?\nCustomer: We lose 20 hours a week to manual reporting.","source_name":"Test Call"}'
```

Then poll the returned job:

```bash
curl http://127.0.0.1:8000/api/v1/jobs/<job_id>
```

## Testing

Run the Python test suite with:

```bash
pytest tests/ -v
```

The current test coverage focuses on:

- graph topology behavior
- node-level validation and failure handling
- shared graph state reducer behavior
- API job-queue flows

## Sample Transcript

```txt
Rep: Thanks for joining today. Can you tell me what prompted you to look at a new solution?
Customer: Our reporting process is very manual. The team spends around 10 hours every week preparing reports.
Rep: What happens if that does not improve?
Customer: Leadership does not get accurate numbers on time, and it slows down our planning.
Rep: Who else is involved in evaluating a solution?
Customer: My manager and our CFO will both need to review it.
Rep: What criteria will matter most?
Customer: Ease of implementation, security, and whether it can integrate with our CRM.
Rep: Is there a timeline you are working toward?
Customer: We want to make a decision before the end of the quarter.
Customer: My only concern is pricing. We already have budget pressure this quarter.
Rep: That makes sense. I can send an ROI breakdown and a similar customer case study by Thursday.
```

## Example Output Areas

The UI organizes results around:

- Summary metrics
- MEDDIC completeness
- Objections found
- Deal health and risk
- Coaching points
- Evidence verification

Typical MEDDIC cards show:

- Value
- Confidence
- Evidence quote
- Gap status
- Suggested next question

Typical objection cards show:

- Category
- Objection
- Explicitness
- Handling quality
- Suggested better response
- Evidence quote

## Assignment Coverage

This project covers the main sales call intelligence requirements:

- Transcript input
- Speaker-labeled transcript support
- MEDDIC extraction
- Confidence scoring
- Gap detection
- Objection analysis
- Deal risk scoring
- Buying signals
- Next actions
- Rep coaching
- Async API architecture
- Results dashboard
- Evidence-backed insights

## Limitations and Reflection

MEDDIC extraction becomes less reliable when the transcript is vague, short, poorly formatted, or missing key sales context.

The system may produce weaker results when:

- Speakers are not labeled clearly
- The transcript is incomplete
- The buyer uses vague language
- Important details were discussed outside the call
- Multiple stakeholders are mentioned without clear roles
- The rep talks too much and the customer gives limited information
- Competitor references are implied but not named
- The transcript contains sarcasm or ambiguous business language

The most difficult MEDDIC fields to extract reliably are usually:

- Economic Buyer
- Decision Process
- Champion

If the rep never uncovers those areas, the system should mark gaps instead of guessing.

## Future Improvements

Planned or natural next extensions include:

- `.docx` transcript upload support
- Audio upload and transcription
- Multi-call trend analysis
- Manager dashboard
- CRM push simulation
- Follow-up email generation
- Exportable PDF report
- Transcript quote highlighting
- Account-level deal history
- Rep leaderboard and coaching trends

## Author

Built as part of the IntellifyAI Engineering Assessment.

**Project:** Sales Call Intelligence  
**Product Name:** SalesSignal AI  
**Focus:** LLM use case, structured extraction, async AI orchestration, sales intelligence, and a production-oriented workflow.
