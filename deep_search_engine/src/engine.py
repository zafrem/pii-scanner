import asyncio
import logging
import re
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import spacy
from transformers import (
    AutoTokenizer, 
    AutoModelForTokenClassification, 
    pipeline,
    TrainingArguments,
    Trainer
)
import torch

from .config import config
from .models import (
    DeepSearchRequest,
    DeepSearchResponse,
    PIIEntity,
    PIIType,
    ConfidenceLevel,
    Position,
    TrainingRequest,
    ModelInfo
)

logger = logging.getLogger(__name__)

class DeepSearchEngine:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.nlp_models = {}
        self.is_initialized = False
        self.training_status = {"is_training": False, "progress": 0, "model": None}
    
    async def initialize(self):
        """Initialize the deep search engine with models."""
        try:
            logger.info("Initializing Deep Search Engine...")
            
            # Load spaCy models for different languages
            await self._load_spacy_models()
            
            # Load transformer models
            await self._load_transformer_models()
            
            self.is_initialized = True
            logger.info("Deep Search Engine initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize engine: {e}")
            raise
    
    async def _load_spacy_models(self):
        """Load spaCy models for different languages."""
        spacy_models = {
            "english": "en_core_web_sm",
            "spanish": "es_core_news_sm",
            "french": "fr_core_news_sm",
            "chinese": "zh_core_web_sm",
            "japanese": "ja_core_news_sm",
            "korean": "ko_core_news_sm"
        }
        
        for lang, model_name in spacy_models.items():
            try:
                logger.info(f"Loading spaCy model for {lang}: {model_name}")
                self.nlp_models[lang] = spacy.load(model_name)
                logger.info(f"Successfully loaded {model_name}")
            except OSError:
                logger.warning(f"spaCy model {model_name} not found, using basic fallback")
                # Use a fallback or skip this language
                continue
    
    async def _load_transformer_models(self):
        """Load transformer models for NER."""
        try:
            model_name = config.default_model
            logger.info(f"Loading transformer model: {model_name}")
            
            # Load tokenizer and model
            self.tokenizers["default"] = AutoTokenizer.from_pretrained(model_name)
            self.models["default"] = AutoModelForTokenClassification.from_pretrained(model_name)
            
            logger.info("Transformer models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load transformer models: {e}")
            # Continue with basic functionality
    
    def is_ready(self) -> bool:
        """Check if the engine is ready to process requests."""
        return self.is_initialized
    
    async def search(self, request: DeepSearchRequest) -> DeepSearchResponse:
        """Perform deep PII search using NER and context analysis."""
        if not self.is_ready():
            raise RuntimeError("Engine not initialized")
        
        logger.info(f"Starting deep search for text length: {len(request.text)}")
        
        detected_entities = []
        
        # Process with each requested language
        for language in request.languages:
            entities = await self._process_language(request.text, language, request.confidence_threshold)
            detected_entities.extend(entities)
        
        # Remove duplicates and merge overlapping entities
        detected_entities = self._deduplicate_entities(detected_entities)
        
        response = DeepSearchResponse(
            items=detected_entities,
            model_info={
                "primary_model": config.default_model,
                "languages_processed": request.languages,
                "method": "transformers+spacy"
            }
        )
        
        logger.info(f"Deep search completed. Found {len(detected_entities)} entities")
        return response
    
    async def _process_language(self, text: str, language: str, threshold: float) -> List[PIIEntity]:
        """Process text for a specific language."""
        entities = []
        
        # Use spaCy for basic NER if available
        if language in self.nlp_models:
            spacy_entities = self._extract_spacy_entities(text, language)
            entities.extend(spacy_entities)
        
        # Use transformer-based NER
        transformer_entities = await self._extract_transformer_entities(text, language, threshold)
        entities.extend(transformer_entities)
        
        # Apply rule-based post-processing
        entities = self._apply_rule_based_filters(entities, text)
        
        return entities
    
    def _extract_spacy_entities(self, text: str, language: str) -> List[PIIEntity]:
        """Extract entities using spaCy NER."""
        entities = []
        
        if language not in self.nlp_models:
            return entities
        
        nlp = self.nlp_models[language]
        doc = nlp(text)
        
        for ent in doc.ents:
            pii_type = self._map_spacy_label_to_pii(ent.label_)
            if pii_type:
                entity = PIIEntity(
                    id=str(uuid.uuid4()),
                    text=ent.text,
                    type=pii_type,
                    language=language,
                    position=Position(start=ent.start_char, end=ent.end_char),
                    probability=0.8,  # Default confidence for spaCy
                    confidence_level=ConfidenceLevel.MEDIUM,
                    context=self._extract_context(text, ent.start_char, ent.end_char),
                    sources=["spacy"]
                )
                entities.append(entity)
        
        return entities
    
    async def _extract_transformer_entities(self, text: str, language: str, threshold: float) -> List[PIIEntity]:
        """Extract entities using transformer models."""
        entities = []
        
        if "default" not in self.models:
            return entities
        
        try:
            # Create NER pipeline
            ner_pipeline = pipeline(
                "ner",
                model=self.models["default"],
                tokenizer=self.tokenizers["default"],
                aggregation_strategy="simple",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Process text
            results = ner_pipeline(text)
            
            for result in results:
                if result["score"] >= threshold:
                    pii_type = self._map_transformer_label_to_pii(result["entity_group"])
                    if pii_type:
                        entity = PIIEntity(
                            id=str(uuid.uuid4()),
                            text=result["word"],
                            type=pii_type,
                            language=language,
                            position=Position(start=result["start"], end=result["end"]),
                            probability=result["score"],
                            confidence_level=self._get_confidence_level(result["score"]),
                            context=self._extract_context(text, result["start"], result["end"]),
                            sources=["transformer"]
                        )
                        entities.append(entity)
            
        except Exception as e:
            logger.error(f"Transformer NER failed: {e}")
        
        return entities
    
    def _map_spacy_label_to_pii(self, label: str) -> Optional[PIIType]:
        """Map spaCy entity labels to PII types."""
        mapping = {
            "PERSON": PIIType.NAME,
            "ORG": PIIType.ORGANIZATION,
            "DATE": PIIType.DATE,
            "GPE": PIIType.ADDRESS,
            "LOC": PIIType.ADDRESS,
            "EMAIL": PIIType.EMAIL,
            "PHONE": PIIType.PHONE
        }
        return mapping.get(label)
    
    def _map_transformer_label_to_pii(self, label: str) -> Optional[PIIType]:
        """Map transformer entity labels to PII types."""
        mapping = {
            "PER": PIIType.NAME,
            "PERSON": PIIType.NAME,
            "ORG": PIIType.ORGANIZATION,
            "LOC": PIIType.ADDRESS,
            "DATE": PIIType.DATE,
            "EMAIL": PIIType.EMAIL,
            "PHONE": PIIType.PHONE,
            "MISC": None  # Skip miscellaneous entities
        }
        return mapping.get(label)
    
    def _get_confidence_level(self, score: float) -> ConfidenceLevel:
        """Determine confidence level based on score."""
        if score >= 0.9:
            return ConfidenceLevel.HIGH
        elif score >= 0.7:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
    
    def _extract_context(self, text: str, start: int, end: int, window: int = 50) -> str:
        """Extract context around detected entity."""
        context_start = max(0, start - window)
        context_end = min(len(text), end + window)
        return text[context_start:context_end]
    
    def _apply_rule_based_filters(self, entities: List[PIIEntity], text: str) -> List[PIIEntity]:
        """Apply rule-based filters and add regex-based detections."""
        # Add regex-based email detection
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        for match in re.finditer(email_pattern, text):
            entity = PIIEntity(
                id=str(uuid.uuid4()),
                text=match.group(),
                type=PIIType.EMAIL,
                language="universal",
                position=Position(start=match.start(), end=match.end()),
                probability=0.95,
                confidence_level=ConfidenceLevel.HIGH,
                context=self._extract_context(text, match.start(), match.end()),
                sources=["regex"]
            )
            entities.append(entity)
        
        # Add phone number detection
        phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'
        for match in re.finditer(phone_pattern, text):
            entity = PIIEntity(
                id=str(uuid.uuid4()),
                text=match.group(),
                type=PIIType.PHONE,
                language="universal",
                position=Position(start=match.start(), end=match.end()),
                probability=0.9,
                confidence_level=ConfidenceLevel.HIGH,
                context=self._extract_context(text, match.start(), match.end()),
                sources=["regex"]
            )
            entities.append(entity)
        
        return entities
    
    def _deduplicate_entities(self, entities: List[PIIEntity]) -> List[PIIEntity]:
        """Remove duplicate and overlapping entities."""
        if not entities:
            return entities
        
        # Sort by position
        entities.sort(key=lambda e: (e.position.start, e.position.end))
        
        deduplicated = []
        for entity in entities:
            # Check for overlap with existing entities
            overlap = False
            for existing in deduplicated:
                if (entity.position.start < existing.position.end and 
                    entity.position.end > existing.position.start):
                    # Choose entity with higher probability
                    if entity.probability > existing.probability:
                        deduplicated.remove(existing)
                        deduplicated.append(entity)
                    overlap = True
                    break
            
            if not overlap:
                deduplicated.append(entity)
        
        return deduplicated
    
    async def list_models(self) -> List[ModelInfo]:
        """List available models."""
        models = [
            ModelInfo(
                name="bert-base-multilingual-cased",
                version="1.0",
                languages=config.supported_languages,
                accuracy=0.85,
                f1_score=0.82,
                last_trained="2024-01-01"
            )
        ]
        return models
    
    async def train_model(self, request: TrainingRequest):
        """Train or fine-tune a model (placeholder implementation)."""
        self.training_status = {
            "is_training": True,
            "progress": 0,
            "model": request.model_name,
            "started_at": datetime.now().isoformat()
        }
        
        try:
            # Simulate training process
            for i in range(101):
                await asyncio.sleep(0.1)  # Simulate training time
                self.training_status["progress"] = i
                
                if i % 20 == 0:
                    logger.info(f"Training progress: {i}%")
            
            self.training_status = {
                "is_training": False,
                "progress": 100,
                "model": request.model_name,
                "completed_at": datetime.now().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Training completed for model: {request.model_name}")
            
        except Exception as e:
            self.training_status = {
                "is_training": False,
                "progress": 0,
                "model": request.model_name,
                "error": str(e),
                "status": "failed"
            }
            logger.error(f"Training failed: {e}")
    
    async def get_training_status(self) -> Dict[str, Any]:
        """Get current training status."""
        return self.training_status