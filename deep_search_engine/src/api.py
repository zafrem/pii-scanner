from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time
import logging
from typing import List, Dict, Any

from .config import config
from .models import (
    DeepSearchRequest, 
    DeepSearchResponse, 
    TrainingRequest, 
    ModelInfo,
    PIIEntity
)
from .engine import DeepSearchEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PII Scanner - Deep Search Engine",
    description="Deep learning-based PII detection engine with NER and context analysis",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the deep search engine
engine = DeepSearchEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize the engine on startup."""
    logger.info("Starting Deep Search Engine...")
    try:
        await engine.initialize()
        logger.info("Deep Search Engine initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize engine: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "deep-search-engine",
        "version": "1.0.0",
        "timestamp": time.time(),
        "models_loaded": engine.is_ready()
    }

@app.get("/models")
async def list_models() -> List[ModelInfo]:
    """List available models."""
    try:
        return await engine.list_models()
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def deep_search(request: DeepSearchRequest) -> Dict[str, Any]:
    """Perform deep PII search using NER and context analysis."""
    start_time = time.time()
    
    try:
        # Validate request
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not request.languages:
            raise HTTPException(status_code=400, detail="At least one language must be specified")
        
        if len(request.text) > config.max_text_length:
            raise HTTPException(
                status_code=400, 
                detail=f"Text exceeds maximum length of {config.max_text_length} characters"
            )
        
        # Perform deep search
        logger.info(f"Performing deep search for {len(request.languages)} languages")
        response = await engine.search(request)
        
        processing_time = time.time() - start_time
        response.processing_time = processing_time
        
        # Return in the expected API format
        return {
            "success": True,
            "data": {
                "stage": response.stage,
                "method": response.method,
                "items": [
                    {
                        "id": item.id,
                        "text": item.text,
                        "type": item.type.value,
                        "language": item.language,
                        "position": {
                            "start": item.position.start,
                            "end": item.position.end
                        },
                        "probability": item.probability,
                        "confidenceLevel": item.confidence_level.value,
                        "sources": item.sources,
                        "context": item.context
                    }
                    for item in response.items
                ],
                "summary": response.summary,
                "processingTime": response.processing_time,
                "modelInfo": response.model_info
            },
            "metadata": {
                "timestamp": time.time(),
                "apiVersion": "1.0.0",
                "engine": "deep-search"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deep search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Deep search failed: {str(e)}")

@app.post("/train")
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Train or fine-tune a model (background task)."""
    try:
        # Add training task to background
        background_tasks.add_task(engine.train_model, request)
        
        return {
            "success": True,
            "message": "Training started",
            "request": {
                "model_name": request.model_name,
                "languages": request.languages,
                "epochs": request.epochs
            }
        }
        
    except Exception as e:
        logger.error(f"Training initiation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/training/status")
async def get_training_status():
    """Get current training status."""
    try:
        status = await engine.get_training_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        logger.error(f"Failed to get training status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host=config.server_host,
        port=config.server_port,
        workers=config.server_workers,
        reload=config.debug,
        log_level="info"
    )