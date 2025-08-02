import { Router, Request, Response } from 'express';
import { RuleBasedEngine } from '../../../engines/stage1/ruleBasedEngine';
import { asyncHandler, createAPIError } from '../middleware/errorHandler';
import { SearchRequest, Language } from '../types';
import { sanitizeInput } from '../../../engines/utils/helpers';

const router = Router();
const ruleBasedEngine = RuleBasedEngine.getInstance();

const validateSearchRequest = (body: any): SearchRequest => {
  const { text, languages, maxCharacters } = body;

  if (!text || typeof text !== 'string') {
    throw createAPIError('Text is required and must be a string', 400);
  }

  if (!languages || !Array.isArray(languages) || languages.length === 0) {
    throw createAPIError('Languages array is required and must contain at least one language', 400);
  }

  const validLanguages: Language[] = ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'];
  const invalidLanguages = languages.filter(lang => !validLanguages.includes(lang));
  
  if (invalidLanguages.length > 0) {
    throw createAPIError(
      `Invalid languages: ${invalidLanguages.join(', ')}. Supported languages: ${validLanguages.join(', ')}`,
      400
    );
  }

  const sanitizedText = sanitizeInput(text, maxCharacters);

  return {
    text: sanitizedText,
    languages: languages as Language[],
    maxCharacters
  };
};

router.post('/basic', asyncHandler(async (req: Request, res: Response) => {

  try {
    const searchRequest = validateSearchRequest(req.body);
    
    const result = await ruleBasedEngine.search(searchRequest);

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId: req.headers['x-request-id'] || 'unknown',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0.0'
      }
    });

  } catch (error) {
    
    if ((error as any).statusCode) {
      throw error;
    } else {
      throw createAPIError(`Basic search failed: ${(error as Error).message}`, 500);
    }
  }
}));

router.post('/deep', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Deep search not yet implemented',
      stage: 2,
      timestamp: new Date().toISOString()
    }
  });
}));

router.post('/context', asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'Context search not yet implemented', 
      stage: 3,
      timestamp: new Date().toISOString()
    }
  });
}));

router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      stage1: {
        name: 'Rule-based Search',
        status: 'active',
        description: 'Regex pattern matching for basic PII detection'
      },
      stage2: {
        name: 'Deep Search',
        status: 'pending',
        description: 'NER and preprocessing for advanced detection'
      },
      stage3: {
        name: 'Context Search',
        status: 'pending',
        description: 'Context validation and false positive filtering'
      }
    },
    metadata: {
      timestamp: new Date().toISOString(),
      supportedLanguages: ['korean', 'english', 'chinese', 'japanese', 'spanish', 'french'],
      maxTextLength: 10000
    }
  });
}));

export default router;