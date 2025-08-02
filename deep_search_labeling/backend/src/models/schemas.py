from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PIITypeEnum(str, Enum):
    NAME = "name"
    EMAIL = "email"
    PHONE = "phone"
    ADDRESS = "address"
    ID_NUMBER = "id_number"
    CREDIT_CARD = "credit_card"
    ORGANIZATION = "organization"
    DATE = "date"
    POSTAL_CODE = "postal_code"
    CUSTOM = "custom"

class SampleStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    REJECTED = "rejected"

class ProjectStatusEnum(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ANNOTATOR = "annotator"
    REVIEWER = "reviewer"

class ExportFormatEnum(str, Enum):
    HUGGINGFACE = "huggingface"
    SPACY = "spacy"
    CONLL = "conll"
    JSON = "json"
    CSV = "csv"

# Base schemas
class PIIEntityBase(BaseModel):
    start: int
    end: int
    text: str
    type: PIITypeEnum
    confidence: float = 0.8
    notes: Optional[str] = None

    @validator('confidence')
    def validate_confidence(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError('Confidence must be between 0.0 and 1.0')
        return v

class PIIEntityCreate(PIIEntityBase):
    pass

class PIIEntityUpdate(BaseModel):
    start: Optional[int] = None
    end: Optional[int] = None
    text: Optional[str] = None
    type: Optional[PIITypeEnum] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None

class PIIEntityResponse(PIIEntityBase):
    id: str
    sample_id: str
    annotator_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Text Sample schemas
class TextSampleBase(BaseModel):
    text: str
    filename: Optional[str] = None
    language: str = "english"

class TextSampleCreate(TextSampleBase):
    pass

class TextSampleResponse(TextSampleBase):
    id: str
    project_id: str
    status: SampleStatusEnum
    quality_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TextSampleDetailResponse(TextSampleResponse):
    entities: List[PIIEntityResponse] = []

    class Config:
        from_attributes = True

# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    guidelines: Optional[str] = None
    quality_threshold: float = 0.8
    multi_annotator: bool = True

    @validator('quality_threshold')
    def validate_quality_threshold(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError('Quality threshold must be between 0.0 and 1.0')
        return v

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    guidelines: Optional[str] = None
    status: Optional[ProjectStatusEnum] = None
    quality_threshold: Optional[float] = None
    multi_annotator: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: str
    status: ProjectStatusEnum
    created_by: str
    total_samples: int = 0
    completed_samples: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Annotator schemas
class AnnotatorBase(BaseModel):
    name: str
    email: str
    role: UserRoleEnum = UserRoleEnum.ANNOTATOR

class AnnotatorCreate(AnnotatorBase):
    password: str

class AnnotatorResponse(AnnotatorBase):
    id: str
    is_active: bool
    total_annotations: int
    quality_score: float
    created_at: datetime

    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Export schemas
class ExportConfigBase(BaseModel):
    format: ExportFormatEnum
    quality_threshold: float = 0.8
    include_metadata: bool = True
    anonymize: bool = False

class ExportConfigCreate(ExportConfigBase):
    pass

class ExportJobResponse(BaseModel):
    id: str
    project_id: str
    format: ExportFormatEnum
    status: str
    file_path: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Analytics schemas
class QualityMetrics(BaseModel):
    inter_annotator_agreement: float
    cohens_kappa: float
    entity_distribution: Dict[str, int]
    annotator_performance: Dict[str, float]
    completion_rate: float
    average_time: float

class ProjectAnalytics(BaseModel):
    project_id: str
    total_samples: int
    completed_samples: int
    total_entities: int
    unique_annotators: int
    quality_metrics: QualityMetrics
    progress_over_time: List[Dict[str, Any]]

# API Response wrapper
class APIResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    pagination: Optional[Dict[str, int]] = None