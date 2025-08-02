"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frenchPatterns = exports.spanishPatterns = exports.japanesePatterns = exports.chinesePatterns = exports.englishPatterns = exports.koreanPatterns = exports.getPatternsByLanguages = exports.getPatternsByLanguage = exports.allPatterns = void 0;
const korean_1 = require("./korean");
Object.defineProperty(exports, "koreanPatterns", { enumerable: true, get: function () { return korean_1.koreanPatterns; } });
const english_1 = require("./english");
Object.defineProperty(exports, "englishPatterns", { enumerable: true, get: function () { return english_1.englishPatterns; } });
const chinese_1 = require("./chinese");
Object.defineProperty(exports, "chinesePatterns", { enumerable: true, get: function () { return chinese_1.chinesePatterns; } });
const japanese_1 = require("./japanese");
Object.defineProperty(exports, "japanesePatterns", { enumerable: true, get: function () { return japanese_1.japanesePatterns; } });
const spanish_1 = require("./spanish");
Object.defineProperty(exports, "spanishPatterns", { enumerable: true, get: function () { return spanish_1.spanishPatterns; } });
const french_1 = require("./french");
Object.defineProperty(exports, "frenchPatterns", { enumerable: true, get: function () { return french_1.frenchPatterns; } });
exports.allPatterns = {
    korean: korean_1.koreanPatterns,
    english: english_1.englishPatterns,
    chinese: chinese_1.chinesePatterns,
    japanese: japanese_1.japanesePatterns,
    spanish: spanish_1.spanishPatterns,
    french: french_1.frenchPatterns
};
const getPatternsByLanguage = (language) => {
    return exports.allPatterns[language];
};
exports.getPatternsByLanguage = getPatternsByLanguage;
const getPatternsByLanguages = (languages) => {
    return languages.map(language => exports.allPatterns[language]);
};
exports.getPatternsByLanguages = getPatternsByLanguages;
//# sourceMappingURL=index.js.map