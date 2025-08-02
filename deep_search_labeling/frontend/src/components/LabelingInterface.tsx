import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Slider,
  Grid,
  Card,
  CardContent,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save,
  NavigateNext,
  NavigateBefore,
  Undo,
  Redo,
  Help,
  Delete,
} from '@mui/icons-material';
import { PIIType, PIIEntity, TextSample } from '../types';

interface LabelingInterfaceProps {
  sample?: TextSample;
  onSave: (entities: PIIEntity[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const entityColors: Record<PIIType, string> = {
  [PIIType.NAME]: '#FF5722',
  [PIIType.EMAIL]: '#2196F3',
  [PIIType.PHONE]: '#4CAF50',
  [PIIType.ADDRESS]: '#9C27B0',
  [PIIType.ID_NUMBER]: '#FF9800',
  [PIIType.CREDIT_CARD]: '#F44336',
  [PIIType.ORGANIZATION]: '#607D8B',
  [PIIType.DATE]: '#795548',
  [PIIType.POSTAL_CODE]: '#3F51B5',
  [PIIType.CUSTOM]: '#9E9E9E',
};

const LabelingInterface: React.FC<LabelingInterfaceProps> = ({
  sample,
  onSave,
  onNext,
  onPrevious,
}) => {
  const [entities, setEntities] = useState<PIIEntity[]>([]);
  const [selectedText, setSelectedText] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<PIIType>(PIIType.NAME);
  const [confidence, setConfidence] = useState<number>(0.8);
  const [notes, setNotes] = useState<string>('');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [undoStack, setUndoStack] = useState<PIIEntity[][]>([]);
  const [redoStack, setRedoStack] = useState<PIIEntity[][]>([]);

  // Mock sample data
  const mockSample: TextSample = sample || {
    id: '1',
    projectId: '1',
    text: 'Hello, my name is John Doe and you can reach me at john.doe@example.com or call me at (555) 123-4567. I live at 123 Main Street, New York, NY 10001.',
    language: 'english',
    status: 'in_progress' as any,
    entities: [],
    annotatorIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  useEffect(() => {
    if (sample) {
      setEntities(sample.entities || []);
    }
  }, [sample]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString();
      const start = range.startOffset;
      const end = range.endOffset;

      setSelectedText({
        start,
        end,
        text: selectedText,
      });
    }
  }, []);

  const addEntity = useCallback(() => {
    if (!selectedText) return;

    // Check for overlapping entities
    const hasOverlap = entities.some(
      (entity) =>
        (selectedText.start >= entity.start && selectedText.start < entity.end) ||
        (selectedText.end > entity.start && selectedText.end <= entity.end) ||
        (selectedText.start <= entity.start && selectedText.end >= entity.end)
    );

    if (hasOverlap) {
      alert('Selected text overlaps with existing entity');
      return;
    }

    const newEntity: PIIEntity = {
      id: Date.now().toString(),
      start: selectedText.start,
      end: selectedText.end,
      text: selectedText.text,
      type: selectedEntityType,
      confidence,
      notes: notes || undefined,
      annotatorId: 'current-user', // This would come from auth context
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save current state for undo
    setUndoStack((prev) => [...prev, entities]);
    setRedoStack([]);

    setEntities((prev) => [...prev, newEntity]);
    setSelectedText(null);
    setNotes('');
  }, [selectedText, selectedEntityType, confidence, notes, entities]);

  const deleteEntity = useCallback((entityId: string) => {
    setUndoStack((prev) => [...prev, entities]);
    setRedoStack([]);
    setEntities((prev) => prev.filter((entity) => entity.id !== entityId));
  }, [entities]);

  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      setRedoStack((prev) => [entities, ...prev]);
      setEntities(undoStack[undoStack.length - 1]);
      setUndoStack((prev) => prev.slice(0, -1));
    }
  }, [entities, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length > 0) {
      setUndoStack((prev) => [...prev, entities]);
      setEntities(redoStack[0]);
      setRedoStack((prev) => prev.slice(1));
    }
  }, [entities, redoStack]);

  const renderHighlightedText = () => {
    const text = mockSample.text;
    let lastIndex = 0;
    const parts = [];

    // Sort entities by start position
    const sortedEntities = [...entities].sort((a, b) => a.start - b.start);

    sortedEntities.forEach((entity, index) => {
      // Add text before entity
      if (entity.start > lastIndex) {
        parts.push(text.slice(lastIndex, entity.start));
      }

      // Add highlighted entity
      parts.push(
        <Chip
          key={`entity-${index}`}
          label={entity.text}
          style={{
            backgroundColor: entityColors[entity.type],
            color: 'white',
            margin: '0 2px',
            height: 'auto',
            borderRadius: '4px',
          }}
          onDelete={() => deleteEntity(entity.id)}
          deleteIcon={<Delete style={{ color: 'white' }} />}
          size="small"
        />
      );

      lastIndex = entity.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const keyboardShortcuts = [
    { key: '1', type: PIIType.NAME },
    { key: '2', type: PIIType.EMAIL },
    { key: '3', type: PIIType.PHONE },
    { key: '4', type: PIIType.ADDRESS },
    { key: '5', type: PIIType.ID_NUMBER },
  ];

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            onSave(entities);
            break;
          case 'z':
            event.preventDefault();
            undo();
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
        }
      } else {
        const shortcut = keyboardShortcuts.find((s) => s.key === event.key);
        if (shortcut && selectedText) {
          setSelectedEntityType(shortcut.type);
          setTimeout(addEntity, 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [entities, selectedText, undo, redo, addEntity, onSave, keyboardShortcuts]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Text Annotation Interface
      </Typography>

      <Grid container spacing={3}>
        {/* Main Text Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 3, minHeight: 400 }}>
            <Typography variant="h6" gutterBottom>
              Text Sample
            </Typography>
            <Box
              sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 2,
                minHeight: 300,
                fontSize: '16px',
                lineHeight: 1.6,
                userSelect: 'text',
                backgroundColor: '#fafafa',
              }}
              onMouseUp={handleTextSelection}
            >
              {renderHighlightedText()}
            </Box>

            {/* Selection Info */}
            {selectedText && (
              <Card sx={{ mt: 2, backgroundColor: '#e3f2fd' }}>
                <CardContent>
                  <Typography variant="subtitle1">
                    Selected: "{selectedText.text}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Position: {selectedText.start} - {selectedText.end}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>

        {/* Annotation Controls */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Annotation Controls
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value as PIIType)}
                label="Entity Type"
              >
                {Object.values(PIIType).map((type) => (
                  <MenuItem key={type} value={type}>
                    <Chip
                      label={type.toUpperCase()}
                      size="small"
                      style={{
                        backgroundColor: entityColors[type],
                        color: 'white',
                        marginRight: 8,
                      }}
                    />
                    {type.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography gutterBottom>Confidence: {confidence}</Typography>
            <Slider
              value={confidence}
              onChange={(_, value) => setConfidence(value as number)}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />

            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={addEntity}
                disabled={!selectedText}
                size="small"
              >
                Add Entity
              </Button>
              
              <Tooltip title="Undo (Ctrl+Z)">
                <span>
                  <IconButton
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    size="small"
                  >
                    <Undo />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Redo (Ctrl+Y)">
                <span>
                  <IconButton
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    size="small"
                  >
                    <Redo />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Help & Shortcuts">
                <IconButton
                  onClick={() => setShowGuidelines(true)}
                  size="small"
                >
                  <Help />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Entity List */}
            <Typography variant="h6" sx={{ mt: 3 }}>
              Detected Entities ({entities.length})
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {entities.map((entity) => (
                <Card key={entity.id} sx={{ mb: 1, p: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Chip
                        label={entity.type.toUpperCase()}
                        size="small"
                        style={{
                          backgroundColor: entityColors[entity.type],
                          color: 'white',
                        }}
                      />
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        "{entity.text}"
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {entity.confidence}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => deleteEntity(entity.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<NavigateBefore />}
          onClick={onPrevious}
        >
          Previous Sample
        </Button>

        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={() => onSave(entities)}
        >
          Save Progress
        </Button>

        <Button
          variant="outlined"
          endIcon={<NavigateNext />}
          onClick={onNext}
        >
          Next Sample
        </Button>
      </Box>

      {/* Help Dialog */}
      <Dialog open={showGuidelines} onClose={() => setShowGuidelines(false)} maxWidth="md">
        <DialogTitle>Annotation Guidelines & Shortcuts</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Keyboard Shortcuts
          </Typography>
          <Box sx={{ mb: 2 }}>
            {keyboardShortcuts.map((shortcut) => (
              <Typography key={shortcut.key} variant="body2">
                <strong>{shortcut.key}</strong> - {shortcut.type.replace('_', ' ')}
              </Typography>
            ))}
            <Typography variant="body2">
              <strong>Ctrl+S</strong> - Save progress
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl+Z</strong> - Undo
            </Typography>
            <Typography variant="body2">
              <strong>Ctrl+Y</strong> - Redo
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom>
            Annotation Guidelines
          </Typography>
          <Typography variant="body2" paragraph>
            1. Select complete entities only (don't split names or addresses)
          </Typography>
          <Typography variant="body2" paragraph>
            2. Include titles and honorifics with names
          </Typography>
          <Typography variant="body2" paragraph>
            3. Mark uncertain cases with lower confidence scores
          </Typography>
          <Typography variant="body2" paragraph>
            4. Consider context when determining if information is identifying
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGuidelines(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Save */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => onSave(entities)}
      >
        <Save />
      </Fab>
    </Box>
  );
};

export default LabelingInterface;