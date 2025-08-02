import aiohttp
import asyncio
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from .config import config
from .models import OllamaRequest, OllamaResponse, ModelStatus

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self):
        self.base_url = config.ollama_host
        self.timeout = config.ollama_timeout
        self.max_retries = config.ollama_max_retries
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Ollama API."""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                if not self.session:
                    self.session = aiohttp.ClientSession(
                        timeout=aiohttp.ClientTimeout(total=self.timeout)
                    )
                
                if method == "GET":
                    async with self.session.get(url) as response:
                        response.raise_for_status()
                        return await response.json()
                
                elif method == "POST":
                    async with self.session.post(url, json=data) as response:
                        response.raise_for_status()
                        return await response.json()
                        
            except aiohttp.ClientError as e:
                logger.warning(f"Ollama request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retries exceeded")
    
    async def health_check(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            await self._make_request("/api/tags")
            return True
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
    
    async def list_models(self) -> List[ModelStatus]:
        """List available models in Ollama."""
        try:
            response = await self._make_request("/api/tags")
            models = []
            
            for model_data in response.get("models", []):
                model = ModelStatus(
                    name=model_data["name"],
                    status="available",
                    version=model_data.get("digest", "unknown")[:12],
                    size=self._format_size(model_data.get("size", 0)),
                    last_used=model_data.get("modified_at")
                )
                models.append(model)
            
            return models
            
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    async def check_model_exists(self, model_name: str) -> bool:
        """Check if a specific model exists in Ollama."""
        models = await self.list_models()
        return any(model.name == model_name for model in models)
    
    async def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama registry."""
        try:
            logger.info(f"Pulling model: {model_name}")
            data = {"name": model_name}
            await self._make_request("/api/pull", method="POST", data=data)
            logger.info(f"Successfully pulled model: {model_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            return False
    
    async def generate(self, request: OllamaRequest) -> OllamaResponse:
        """Generate text using Ollama model."""
        try:
            # Check if model exists
            if not await self.check_model_exists(request.model):
                logger.warning(f"Model {request.model} not found, attempting to pull...")
                if not await self.pull_model(request.model):
                    raise Exception(f"Failed to pull model: {request.model}")
            
            # Prepare request data
            data = {
                "model": request.model,
                "prompt": request.prompt,
                "stream": request.stream,
                "options": request.options
            }
            
            logger.debug(f"Sending request to Ollama: model={request.model}, prompt_length={len(request.prompt)}")
            
            # Make generation request
            response_data = await self._make_request("/api/generate", method="POST", data=data)
            
            logger.debug(f"Received response from Ollama: {response_data.get('done', False)}")
            
            return OllamaResponse(**response_data)
            
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise
    
    async def analyze_text(self, text: str, prompt_template: str, model: Optional[str] = None, **kwargs) -> str:
        """Analyze text using a prompt template."""
        try:
            # Use default model if not specified
            if not model:
                model = config.ollama_model
            
            # Format prompt with provided variables
            formatted_prompt = prompt_template.format(text=text, **kwargs)
            
            # Create request
            request = OllamaRequest(
                model=model,
                prompt=formatted_prompt,
                stream=False,
                options={
                    "temperature": 0.1,
                    "top_p": 0.9,
                    "max_tokens": 300
                }
            )
            
            # Generate response
            response = await self.generate(request)
            return response.response.strip()
            
        except Exception as e:
            logger.error(f"Text analysis failed: {e}")
            raise
    
    async def analyze_json(self, text: str, prompt_template: str, model: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Analyze text and return JSON response."""
        try:
            response_text = await self.analyze_text(text, prompt_template, model, **kwargs)
            
            # Try to parse JSON response
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract JSON from response
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    logger.warning(f"Failed to parse JSON from response: {response_text}")
                    return {
                        "error": "Failed to parse JSON",
                        "raw_response": response_text
                    }
                    
        except Exception as e:
            logger.error(f"JSON analysis failed: {e}")
            raise
    
    def _format_size(self, size_bytes: int) -> str:
        """Format size in bytes to human readable format."""
        if size_bytes == 0:
            return "Unknown"
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        
        return f"{size_bytes:.1f} TB"

# Global client instance
ollama_client = OllamaClient()