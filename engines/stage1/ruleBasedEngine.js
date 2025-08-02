"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleBasedEngine = void 0;
const patterns_1 = require("../patterns");
const helpers_1 = require("../utils/helpers");
class RuleBasedEngine {
    static getInstance() {
        if (!RuleBasedEngine.instance) {
            RuleBasedEngine.instance = new RuleBasedEngine();
        }
        return RuleBasedEngine.instance;
    }
    async search(request) {
        const startTime = Date.now();
        try {
            const { text, languages } = request;
            if (!text || text.trim().length === 0) {
                throw new Error('Text input is required');
            }
            if (!languages || languages.length === 0) {
                throw new Error('At least one language must be selected');
            }
            const maxLength = request.maxCharacters || 10000;
            if (text.length > maxLength) {
                throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
            }
            const patterns = (0, patterns_1.getPatternsByLanguages)(languages);
            const items = [];
            for (const languagePattern of patterns) {
                const languageItems = this.searchWithLanguagePatterns(text, languagePattern.language, languagePattern.patterns);
                items.push(...languageItems);
            }
            const deduplicatedItems = this.deduplicateItems(items);
            const summary = this.generateSummary(deduplicatedItems);
            const processingTime = Date.now() - startTime;
            return {
                stage: 1,
                method: 'rule_based',
                items: deduplicatedItems,
                summary,
                processingTime
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            throw new Error(`Rule-based search failed: ${error.message}`);
        }
    }
    searchWithLanguagePatterns(text, language, patterns) {
        const items = [];
        for (const pattern of patterns) {
            try {
                const regex = new RegExp(pattern.pattern, pattern.flags || 'g');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const matchedText = match[0];
                    const position = {
                        start: match.index,
                        end: match.index + matchedText.length
                    };
                    const isDetected = this.validateMatch(matchedText, pattern.type);
                    const item = {
                        id: (0, helpers_1.generateId)(),
                        text: matchedText,
                        type: pattern.type,
                        language,
                        position,
                        isDetected,
                        source: 'regex_pattern'
                    };
                    items.push(item);
                    if (regex.global === false)
                        break;
                }
            }
            catch (error) {
                console.warn(`Pattern matching failed for ${pattern.type} in ${language}:`, error.message);
            }
        }
        return items;
    }
    validateMatch(text, type) {
        try {
            switch (type) {
                case 'phone':
                    return this.validatePhone(text);
                case 'email':
                    return this.validateEmail(text);
                case 'credit_card':
                    return this.validateCreditCard(text);
                case 'ssn':
                    return this.validateSSN(text);
                default:
                    return true;
            }
        }
        catch (error) {
            return false;
        }
    }
    validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 7 && cleaned.length <= 15;
    }
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    validateCreditCard(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }
        return this.luhnCheck(cleaned);
    }
    validateSSN(ssn) {
        const cleaned = ssn.replace(/\D/g, '');
        if (cleaned.length !== 9) {
            return false;
        }
        const area = cleaned.substring(0, 3);
        const group = cleaned.substring(3, 5);
        const serial = cleaned.substring(5, 9);
        if (area === '000' || area === '666' || parseInt(area) >= 900) {
            return false;
        }
        if (group === '00' || serial === '0000') {
            return false;
        }
        return true;
    }
    luhnCheck(cardNumber) {
        let sum = 0;
        let alternate = false;
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let n = parseInt(cardNumber.charAt(i), 10);
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10) === 0;
    }
    deduplicateItems(items) {
        const uniqueItems = new Map();
        for (const item of items) {
            const key = `${item.text}_${item.position.start}_${item.position.end}_${item.type}`;
            if (!uniqueItems.has(key)) {
                uniqueItems.set(key, item);
            }
            else {
                const existing = uniqueItems.get(key);
                if (item.isDetected && !existing.isDetected) {
                    uniqueItems.set(key, item);
                }
            }
        }
        return Array.from(uniqueItems.values()).sort((a, b) => a.position.start - b.position.start);
    }
    generateSummary(items) {
        const detectedItems = items.filter(item => item.isDetected);
        const languageBreakdown = {};
        const typeBreakdown = {};
        for (const item of detectedItems) {
            languageBreakdown[item.language] = (languageBreakdown[item.language] || 0) + 1;
            typeBreakdown[item.type] = (typeBreakdown[item.type] || 0) + 1;
        }
        return {
            totalItems: items.length,
            detectedItems: detectedItems.length,
            detectionRate: items.length > 0 ? (detectedItems.length / items.length) * 100 : 0,
            languageBreakdown,
            typeBreakdown
        };
    }
}
exports.RuleBasedEngine = RuleBasedEngine;
//# sourceMappingURL=ruleBasedEngine.js.map