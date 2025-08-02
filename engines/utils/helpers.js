"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTextSimilarity = exports.extractContext = exports.mergeOverlappingRanges = exports.isOverlapping = exports.sanitizeInput = exports.calculateConfidence = exports.normalizeText = exports.escapeRegex = exports.generateId = void 0;
const crypto_1 = require("crypto");
const generateId = () => {
    return (0, crypto_1.randomBytes)(16).toString('hex');
};
exports.generateId = generateId;
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
exports.escapeRegex = escapeRegex;
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s@.-]/g, '');
};
exports.normalizeText = normalizeText;
const calculateConfidence = (probability, contextScore = 0, validationScore = 0) => {
    const finalScore = probability * 0.6 + contextScore * 0.3 + validationScore * 0.1;
    if (finalScore >= 0.8)
        return 'high';
    if (finalScore >= 0.5)
        return 'medium';
    return 'low';
};
exports.calculateConfidence = calculateConfidence;
const sanitizeInput = (input, maxLength = 10000) => {
    if (!input || typeof input !== 'string') {
        throw new Error('Invalid input: must be a non-empty string');
    }
    const sanitized = input.trim();
    if (sanitized.length === 0) {
        throw new Error('Input cannot be empty');
    }
    if (sanitized.length > maxLength) {
        throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
    }
    return sanitized;
};
exports.sanitizeInput = sanitizeInput;
const isOverlapping = (pos1, pos2) => {
    return pos1.start < pos2.end && pos2.start < pos1.end;
};
exports.isOverlapping = isOverlapping;
const mergeOverlappingRanges = (ranges) => {
    if (ranges.length === 0)
        return [];
    const sorted = ranges.sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const lastMerged = merged[merged.length - 1];
        if (current.start <= lastMerged.end) {
            lastMerged.end = Math.max(lastMerged.end, current.end);
        }
        else {
            merged.push(current);
        }
    }
    return merged;
};
exports.mergeOverlappingRanges = mergeOverlappingRanges;
const extractContext = (text, position, contextWindow = 50) => {
    const beforeStart = Math.max(0, position.start - contextWindow);
    const afterEnd = Math.min(text.length, position.end + contextWindow);
    return {
        before: text.substring(beforeStart, position.start).trim(),
        after: text.substring(position.end, afterEnd).trim()
    };
};
exports.extractContext = extractContext;
const calculateTextSimilarity = (text1, text2) => {
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const s1 = normalize(text1);
    const s2 = normalize(text2);
    if (s1 === s2)
        return 1;
    const maxLength = Math.max(s1.length, s2.length);
    const editDistance = levenshteinDistance(s1, s2);
    return 1 - (editDistance / maxLength);
};
exports.calculateTextSimilarity = calculateTextSimilarity;
const levenshteinDistance = (str1, str2) => {
    const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
    for (let i = 0; i <= str1.length; i++) {
        matrix[0][i] = i;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[str2.length][str1.length];
};
//# sourceMappingURL=helpers.js.map