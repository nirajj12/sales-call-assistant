import json
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from app.core.config import get_settings
from app.core.exceptions import ExtractionException, LLMException
from app.core.logging_config import get_logger
from app.schemas.analysis import CompetitorSignal, DealIntelligence, DealNextStep
from app.schemas.meddic import MEDDICElement, MEDDICResult
from app.schemas.objection import Objection, ObjectionResult
from app.schemas.transcript import CanonicalTranscript


logger = get_logger("app.services.llm")


class LLMClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    def load_prompt(self, prompt_name: str) -> str:
        path = Path(self.settings.prompt_dir / prompt_name)
        return path.read_text(encoding="utf-8")

    async def complete_json(
        self,
        system_prompt: str,
        user_message: str,
        analysis_id: str | None = None,
        node_name: str | None = None,
        schema_cls: type[BaseModel] = BaseModel,
    ) -> dict[str, Any] | list[Any]:
        providers = self._candidate_providers()
        last_error: Exception | None = None
        for provider in providers:
            for attempt in range(1, self.settings.llm_max_retries + 1):
                logger.info(
                    "llm_complete_json provider=%s model=%s attempt=%s analysis_id=%s node=%s",
                    provider,
                    self.settings.llm_model,
                    attempt,
                    analysis_id,
                    node_name,
                )
                try:
                    raw_content = await self._generate_raw_content(
                        provider=provider,
                        system_prompt=system_prompt,
                        user_message=user_message,
                    )
                    normalized_payload = self._normalize_payload(raw_content, schema_cls)
                    if isinstance(normalized_payload, (dict, list)):
                        return normalized_payload
                    raise ExtractionException("Model did not return JSON object or array.")
                except (ExtractionException, ValidationError, LLMException) as exc:
                    last_error = exc
                    logger.warning(
                        "llm_complete_json_failed provider=%s attempt=%s analysis_id=%s node=%s error=%s",
                        provider,
                        attempt,
                        analysis_id,
                        node_name,
                        exc,
                    )
                    if attempt == self.settings.llm_max_retries:
                        break
                    repair_prompt = self._build_repair_prompt(
                        raw_content if "raw_content" in locals() else "",
                        schema_cls,
                    )
                    try:
                        repaired = await self._generate_raw_content(
                            provider=provider,
                            system_prompt="Repair malformed JSON into valid JSON only.",
                            user_message=repair_prompt,
                        )
                        normalized_payload = self._normalize_payload(repaired, schema_cls)
                        if isinstance(normalized_payload, (dict, list)):
                            return normalized_payload
                    except Exception as repair_exc:
                        last_error = repair_exc
                        logger.warning(
                            "llm_complete_json_repair_failed provider=%s attempt=%s error=%s",
                            provider,
                            attempt,
                            repair_exc,
                        )
                        continue
        raise ExtractionException(f"All configured providers failed. Last error: {last_error}")

    async def extract_meddic(self, transcript: CanonicalTranscript) -> MEDDICResult:
        if self.settings.llm_provider == "mock":
            return self._mock_meddic(transcript)
        prompt = self.load_prompt("meddic.txt")
        payload = await self._generate_typed_json(
            system_prompt=prompt,
            user_message=self._transcript_prompt(transcript),
            schema_cls=MEDDICResult,
            json_hint="Return a JSON object matching the MEDDICResult structure.",
        )
        return payload

    async def extract_objections(self, transcript: CanonicalTranscript) -> ObjectionResult:
        if self.settings.llm_provider == "mock":
            return self._mock_objections(transcript)
        prompt = self.load_prompt("objection.txt")
        payload = await self._generate_typed_json(
            system_prompt=prompt,
            user_message=self._transcript_prompt(transcript),
            schema_cls=ObjectionResult,
            json_hint="Return a JSON object with an 'objections' array.",
        )
        return payload

    async def extract_deal_intelligence(self, transcript: CanonicalTranscript) -> DealIntelligence:
        if self.settings.llm_provider == "mock":
            return self._mock_deal_intelligence(transcript)
        prompt = self.load_prompt("deal_intelligence.txt")
        return await self._generate_typed_json(
            system_prompt=prompt,
            user_message=self._transcript_prompt(transcript),
            schema_cls=DealIntelligence,
            json_hint="Return a JSON object matching the DealIntelligence schema.",
        )

    async def _generate_typed_json(
        self,
        system_prompt: str,
        user_message: str,
        schema_cls: type[BaseModel],
        json_hint: str,
    ) -> BaseModel:
        providers = self._candidate_providers()
        last_error: Exception | None = None
        for provider in providers:
            for attempt in range(1, self.settings.llm_max_retries + 1):
                logger.info(
                    "llm_attempt provider=%s model=%s attempt=%s",
                    provider,
                    self.settings.llm_model,
                    attempt,
                )
                try:
                    raw_content = await self._generate_raw_content(
                        provider=provider,
                        system_prompt=system_prompt,
                        user_message=f"{user_message}\n\n{json_hint}",
                    )
                    normalized_payload = self._normalize_payload(raw_content, schema_cls)
                    return schema_cls.model_validate(normalized_payload)
                except (ExtractionException, ValidationError, LLMException) as exc:
                    last_error = exc
                    logger.warning(
                        "llm_attempt_failed provider=%s attempt=%s error=%s",
                        provider,
                        attempt,
                        exc,
                    )
                    if attempt == self.settings.llm_max_retries:
                        break
                    repair_prompt = self._build_repair_prompt(raw_content if "raw_content" in locals() else "", schema_cls)
                    try:
                        repaired = await self._generate_raw_content(
                            provider=provider,
                            system_prompt="Repair malformed JSON into valid JSON only.",
                            user_message=repair_prompt,
                        )
                        normalized_payload = self._normalize_payload(repaired, schema_cls)
                        return schema_cls.model_validate(normalized_payload)
                    except Exception as repair_exc:
                        last_error = repair_exc
                        logger.warning(
                            "llm_repair_failed provider=%s attempt=%s error=%s",
                            provider,
                            attempt,
                            repair_exc,
                        )
                        continue
        raise ExtractionException(f"All configured providers failed. Last error: {last_error}")

    async def _generate_raw_content(self, provider: str, system_prompt: str, user_message: str) -> str:
        if provider == "openai":
            return await self._call_openai(system_prompt, user_message)
        if provider == "groq":
            return await self._call_groq(system_prompt, user_message)
        if provider == "gemini":
            return await self._call_gemini(system_prompt, user_message)
        if provider == "anthropic":
            return await self._call_anthropic(system_prompt, user_message)
        raise ExtractionException(f"Unsupported llm provider: {provider}")

    async def _call_openai(self, system_prompt: str, user_message: str) -> str:
        if not self.settings.openai_api_key:
            raise ExtractionException("OPENAI_API_KEY is missing for llm_provider=openai.")
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise ExtractionException("Install the openai package to use OpenAI or Groq providers.") from exc
        client = AsyncOpenAI(
            api_key=self.settings.openai_api_key,
            timeout=self.settings.llm_timeout_seconds,
        )
        try:
            response = await client.chat.completions.create(
                model=self.settings.llm_model,
                temperature=self.settings.llm_temperature,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
        except Exception as exc:
            raise LLMException(f"OpenAI request failed: {exc}") from exc
        return response.choices[0].message.content or ""

    async def _call_groq(self, system_prompt: str, user_message: str) -> str:
        if not self.settings.groq_api_key:
            raise ExtractionException("GROQ_API_KEY is missing for llm_provider=groq.")
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise ExtractionException("Install the openai package to use OpenAI or Groq providers.") from exc
        client = AsyncOpenAI(
            api_key=self.settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            timeout=self.settings.llm_timeout_seconds,
        )
        try:
            response = await client.chat.completions.create(
                model=self.settings.llm_model,
                temperature=max(self.settings.llm_temperature, 0.0001),
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
        except Exception as exc:
            raise LLMException(f"Groq request failed: {exc}") from exc
        return response.choices[0].message.content or ""

    async def _call_gemini(self, system_prompt: str, user_message: str) -> str:
        if not self.settings.google_api_key:
            raise ExtractionException("GOOGLE_API_KEY is missing for llm_provider=gemini.")
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.settings.llm_model}:generateContent?key={self.settings.google_api_key}"
        )
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_message}]}],
            "generationConfig": {
                "temperature": self.settings.llm_temperature,
                "maxOutputTokens": self.settings.llm_max_output_tokens,
                "responseMimeType": "application/json",
            },
        }
        async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
            response = await client.post(url, json=payload)
        if response.status_code >= 400:
            raise LLMException(f"Gemini request failed: {response.status_code} {response.text}")
        data = response.json()
        return self._extract_gemini_text(data)

    async def _call_anthropic(self, system_prompt: str, user_message: str) -> str:
        if not self.settings.anthropic_api_key:
            raise ExtractionException("ANTHROPIC_API_KEY is missing for llm_provider=anthropic.")
        headers = {
            "x-api-key": self.settings.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload = {
            "model": self.settings.llm_model,
            "system": system_prompt,
            "max_tokens": self.settings.llm_max_output_tokens,
            "temperature": self.settings.llm_temperature,
            "messages": [{"role": "user", "content": user_message}],
        }
        async with httpx.AsyncClient(timeout=self.settings.llm_timeout_seconds) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
            )
        if response.status_code >= 400:
            raise LLMException(f"Anthropic request failed: {response.status_code} {response.text}")
        data = response.json()
        return self._extract_anthropic_text(data)

    def _normalize_payload(self, content: str, schema_cls: type[BaseModel]) -> Any:
        cleaned = self._strip_code_fences(content).strip()
        if not cleaned:
            raise ExtractionException("Model returned empty content.")
        direct = self._try_json_load(cleaned)
        if direct is not None:
            return self._coerce_schema_shape(direct, schema_cls)

        extracted = self._extract_json_substring(cleaned)
        if extracted is not None:
            parsed = self._try_json_load(extracted)
            if parsed is not None:
                return self._coerce_schema_shape(parsed, schema_cls)

        raise ExtractionException("Model returned weak or malformed JSON.")

    def _coerce_schema_shape(self, payload: Any, schema_cls: type[BaseModel]) -> Any:
        if schema_cls is ObjectionResult:
            if isinstance(payload, list):
                return {"objections": [self._normalize_objection_item(item, index) for index, item in enumerate(payload)]}
            if isinstance(payload, dict):
                if "objections" in payload and isinstance(payload["objections"], list):
                    return {
                        "objections": [
                            self._normalize_objection_item(item, index)
                            for index, item in enumerate(payload["objections"])
                        ]
                    }
                # Common provider drift: single objection or alternate key.
                for key in ("items", "results", "data"):
                    if isinstance(payload.get(key), list):
                        return {
                            "objections": [
                                self._normalize_objection_item(item, index)
                                for index, item in enumerate(payload[key])
                            ]
                        }
            raise ExtractionException("Objection output did not contain an objections array.")

        if schema_cls is MEDDICResult:
            if not isinstance(payload, dict):
                raise ExtractionException("MEDDIC output must be a JSON object.")
            if isinstance(payload.get("meddic"), dict):
                payload = payload["meddic"]
            elif isinstance(payload.get("result"), dict):
                payload = payload["result"]
            elif isinstance(payload.get("data"), dict):
                payload = payload["data"]
            expected_keys = {
                "metrics",
                "economic_buyer",
                "decision_criteria",
                "decision_process",
                "identify_pain",
                "champion",
            }
            alias_map = {
                "metric": "metrics",
                "economicBuyer": "economic_buyer",
                "decisionCriteria": "decision_criteria",
                "decisionProcess": "decision_process",
                "pain": "identify_pain",
                "identified_pain": "identify_pain",
            }
            normalized_payload = {}
            for key, value in payload.items():
                normalized_key = alias_map.get(key, key)
                normalized_payload[normalized_key] = self._normalize_meddic_element(
                    normalized_key,
                    value,
                )
            if not expected_keys.intersection(normalized_payload.keys()):
                raise ExtractionException("MEDDIC output missing expected keys.")
            return normalized_payload

        if schema_cls is DealIntelligence:
            if not isinstance(payload, dict):
                raise ExtractionException("Deal intelligence output must be a JSON object.")
            return payload

        return payload

    def _normalize_meddic_element(self, key: str, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        normalized = dict(value)
        confidence = normalized.get("confidence")
        if isinstance(confidence, str):
            normalized["confidence"] = confidence.strip().lower()
        normalized.setdefault("label", key)
        if "gap_flag" not in normalized and normalized.get("confidence") in {"low", "missing", None}:
            normalized["gap_flag"] = True
        return normalized

    def _normalize_objection_item(self, item: Any, index: int) -> Any:
        if not isinstance(item, dict):
            return {
                "objection_id": f"obj-{index + 1}",
                "text": str(item),
                "category": "need",
                "explicitness": "explicit",
                "handling_quality": "needs_follow_up",
                "suggested_response": "",
                "confidence": "medium",
                "evidence_anchor": None,
                "turn_id": None,
            }

        normalized = dict(item)
        normalized.setdefault("objection_id", f"obj-{index + 1}")
        normalized["text"] = (
            normalized.get("text")
            or normalized.get("objection")
            or normalized.get("issue")
            or normalized.get("concern")
            or normalized.get("summary")
            or ""
        )
        normalized["category"] = str(normalized.get("category", "need")).strip().lower() or "need"
        normalized["explicitness"] = (
            str(normalized.get("explicitness", "explicit")).strip().lower() or "explicit"
        )
        normalized["handling_quality"] = (
            normalized.get("handling_quality")
            or normalized.get("rep_handling")
            or normalized.get("handling")
            or "needs_follow_up"
        )
        confidence = normalized.get("confidence", "medium")
        if isinstance(confidence, str):
            normalized["confidence"] = confidence.strip().lower()
        normalized.setdefault("suggested_response", "")
        normalized.setdefault("evidence_anchor", None)
        normalized.setdefault("turn_id", None)
        return normalized

    def _strip_code_fences(self, content: str) -> str:
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            cleaned = cleaned.rsplit("```", 1)[0]
        return cleaned.strip()

    def _extract_json_substring(self, content: str) -> str | None:
        start_candidates = [idx for idx in (content.find("{"), content.find("[")) if idx != -1]
        if not start_candidates:
            return None
        start = min(start_candidates)
        end = max(content.rfind("}"), content.rfind("]"))
        if end <= start:
            return None
        return content[start : end + 1]

    def _try_json_load(self, content: str) -> Any | None:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None

    def _extract_gemini_text(self, payload: dict[str, Any]) -> str:
        text_parts: list[str] = []
        for candidate in payload.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "text" in part:
                    text_parts.append(part["text"])
        return "\n".join(text_parts)

    def _extract_anthropic_text(self, payload: dict[str, Any]) -> str:
        blocks = payload.get("content", [])
        return "\n".join(block.get("text", "") for block in blocks if block.get("type") == "text")

    def _build_repair_prompt(self, content: str, schema_cls: type[BaseModel]) -> str:
        return (
            "Repair the following output into valid JSON only. "
            f"It must validate against schema {schema_cls.__name__}. "
            "Do not add commentary.\n\n"
            f"{content}"
        )

    def _candidate_providers(self) -> list[str]:
        providers = [self.settings.llm_provider.lower()]
        fallbacks = [
            item.strip().lower()
            for item in self.settings.llm_provider_fallbacks.split(",")
            if item.strip()
        ]
        for provider in fallbacks:
            if provider not in providers:
                providers.append(provider)
        compatible = [provider for provider in providers if self._provider_supports_model(provider)]
        return compatible or [self.settings.llm_provider.lower()]

    def _provider_supports_model(self, provider: str) -> bool:
        model = self.settings.llm_model.lower()
        if provider == "groq":
            return any(
                token in model
                for token in ("llama", "mixtral", "qwen", "gemma", "deepseek", "gpt-oss")
            )
        if provider == "openai":
            return model.startswith(("gpt-", "o1", "o3", "o4"))
        if provider == "gemini":
            return model.startswith("gemini")
        if provider == "anthropic":
            return model.startswith("claude")
        return True

    def active_provider_name(self) -> str:
        return self.settings.llm_provider.lower()

    def _transcript_prompt(self, transcript: CanonicalTranscript) -> str:
        return (
            "Analyze the following sales transcript and return JSON only.\n\n"
            f"{transcript.raw_text}"
        )

    def _mock_meddic(self, transcript: CanonicalTranscript) -> MEDDICResult:
        joined = "\n".join(f"{turn.speaker_label}: {turn.text}" for turn in transcript.turns)
        result = MEDDICResult()
        lower_joined = joined.lower()

        if "hour" in lower_joined or "%" in lower_joined:
            result.metrics = MEDDICElement(
                label="metrics",
                value="Customer shared a measurable impact signal.",
                confidence="high",
                evidence_anchor=self._find_anchor(transcript, ["hour", "%", "roi", "week"]),
            )
        if "budget" in lower_joined or "approve" in lower_joined or "finance" in lower_joined:
            result.economic_buyer = MEDDICElement(
                label="economic_buyer",
                value="A budget approver or finance stakeholder is referenced.",
                confidence="medium",
                evidence_anchor=self._find_anchor(
                    transcript, ["budget", "approve", "finance", "procurement"]
                ),
            )
        if "matters most" in lower_joined or "criteria" in lower_joined or "need" in lower_joined:
            result.decision_criteria = MEDDICElement(
                label="decision_criteria",
                value="Decision criteria were discussed.",
                confidence="medium",
                evidence_anchor=self._find_anchor(
                    transcript, ["matters most", "criteria", "need", "must have"]
                ),
            )
        if "next week" in lower_joined or "friday" in lower_joined or "timeline" in lower_joined:
            result.decision_process = MEDDICElement(
                label="decision_process",
                value="The call contains a timeline or next-step indicator.",
                confidence="medium",
                evidence_anchor=self._find_anchor(
                    transcript, ["next week", "friday", "timeline", "by "]
                ),
            )
        if "concern" in lower_joined or "pain" in lower_joined or "manual" in lower_joined:
            result.identify_pain = MEDDICElement(
                label="identify_pain",
                value="Customer described a problem worth solving.",
                confidence="high",
                evidence_anchor=self._find_anchor(
                    transcript, ["concern", "pain", "manual", "problem", "issue"]
                ),
            )
        if "loop in" in lower_joined or "champion" in lower_joined or "lead" in lower_joined:
            result.champion = MEDDICElement(
                label="champion",
                value="A potential internal advocate may exist.",
                confidence="low",
                evidence_anchor=self._find_anchor(
                    transcript, ["loop in", "lead", "champion", "introduce"]
                ),
            )
        return result

    def _mock_objections(self, transcript: CanonicalTranscript) -> ObjectionResult:
        objections: list[Objection] = []
        keywords = [
            ("price", "price"),
            ("budget", "budget"),
            ("internal", "competition"),
            ("switch", "change_management"),
            ("security", "security"),
        ]
        for turn in transcript.turns:
            if turn.speaker_role.value != "customer":
                continue
            lower_text = turn.text.lower()
            for keyword, category in keywords:
                if keyword in lower_text:
                    objections.append(
                        Objection(
                            objection_id=f"obj-{turn.turn_id}-{keyword}",
                            text=turn.text,
                            category=category,
                            explicitness="explicit" if "concern" in lower_text else "implicit",
                            handling_quality="needs_follow_up",
                            suggested_response=(
                                "Acknowledge the concern, quantify impact, and ask a deeper follow-up."
                            ),
                            evidence_anchor=turn.text,
                            turn_id=turn.turn_id,
                        )
                    )
                    break
        return ObjectionResult(objections=objections)

    def _mock_deal_intelligence(self, transcript: CanonicalTranscript) -> DealIntelligence:
        next_steps: list[DealNextStep] = []
        buying_signals: list[str] = []
        competitor_mentions: list[CompetitorSignal] = []
        risk_factors: list[str] = []

        for turn in transcript.turns:
            lower = turn.text.lower()
            if "send" in lower or "next week" in lower or "friday" in lower:
                next_steps.append(
                    DealNextStep(
                        owner="rep" if turn.speaker_role.value == "rep" else "customer",
                        action=turn.text,
                    )
                )
            if "loop in" in lower or "share" in lower or "review" in lower:
                buying_signals.append(turn.text)
            if "internal system" in lower or "current tool" in lower:
                competitor_mentions.append(
                    CompetitorSignal(
                        name="status_quo",
                        context=turn.text,
                        handled_well=False,
                    )
                )
            if "concern" in lower or "risk" in lower or "switch" in lower:
                risk_factors.append(turn.text)

        return DealIntelligence(
            risk_score=4 if buying_signals else 6,
            risk_factors=risk_factors[:3],
            buying_signals=buying_signals[:3],
            next_steps=next_steps[:3],
            competitor_mentions=competitor_mentions[:3],
            likely_stage="evaluation" if next_steps else "discovery",
            crm_stage_guess="Qualification" if not next_steps else "Evaluation",
        )

    def _find_anchor(self, transcript: CanonicalTranscript, keywords: list[str]) -> str | None:
        for turn in transcript.turns:
            lower_text = turn.text.lower()
            if any(keyword in lower_text for keyword in keywords):
                return turn.text
        return None
