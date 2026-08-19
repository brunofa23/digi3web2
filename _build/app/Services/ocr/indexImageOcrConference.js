"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOcrSearchValue = exports.compareTermStatus = exports.compareNumberStatus = exports.extractTopIsolatedNumberConference = exports.extractHeaderKeywordConference = void 0;
const sharp_1 = __importDefault(require("sharp"));
const googleVision_1 = require("./googleVision");
const DEFAULT_POSITIVE_KEYWORDS = ['LIVRO', 'FOLHAS', 'TERMO'];
const DEFAULT_NEGATIVE_KEYWORDS = [
    'AS FOLHAS',
    'A FOLHAS',
    'DO LIVRO',
    'NO LIVRO',
    'SOB O TERMO',
    'EM DATA',
    'REGISTRADO',
    'REGISTRADA',
];
function normalizeSearchValue(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
function normalizeEvidence(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);
}
function normalizeMatchText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}
function normalizeKeywordText(value) {
    return normalizeMatchValue(value);
}
function normalizeMatchValue(value) {
    return normalizeMatchText(value)
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function normalizeKeywordList(keywords = []) {
    return Array.from(new Set(keywords
        .map((keyword) => normalizeKeywordText(keyword))
        .filter(Boolean)));
}
function normalizeNumber(value) {
    const digits = String(value || '')
        .replace(/[Oo]/g, '0')
        .replace(/[Il]/g, '1')
        .replace(/\D/g, '');
    return digits ? Number(digits) : null;
}
function normalizeDigitsText(value) {
    return String(value || '')
        .replace(/[Oo]/g, '0')
        .replace(/[Il]/g, '1')
        .replace(/\D/g, '');
}
function onlyDigits(value) {
    return String(value || '').replace(/\D/g, '');
}
function confidenceLevel(confidence) {
    if (confidence >= 0.92)
        return 'high';
    if (confidence >= 0.7)
        return 'medium';
    return 'low';
}
function isValidCpf(cpf) {
    const digits = onlyDigits(cpf);
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits))
        return false;
    let sum = 0;
    for (let index = 0; index < 9; index++)
        sum += Number(digits[index]) * (10 - index);
    const firstDigit = 11 - (sum % 11);
    if ((firstDigit >= 10 ? 0 : firstDigit) !== Number(digits[9]))
        return false;
    sum = 0;
    for (let index = 0; index < 10; index++)
        sum += Number(digits[index]) * (11 - index);
    const secondDigit = 11 - (sum % 11);
    return (secondDigit >= 10 ? 0 : secondDigit) === Number(digits[10]);
}
function isValidCnpj(cnpj) {
    const digits = onlyDigits(cnpj);
    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits))
        return false;
    const calc = (length) => {
        const weights = length === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
        const digit = 11 - (sum % 11);
        return digit >= 10 ? 0 : digit;
    };
    return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}
function uniqueEntities(entities) {
    const found = new Map();
    for (const entity of entities) {
        const key = `${entity.entity_type}:${entity.normalized_value}`;
        const current = found.get(key);
        if (!current || entity.confidence > current.confidence) {
            found.set(key, entity);
        }
    }
    return Array.from(found.values());
}
function extractDocumentEntities(text) {
    const matches = text.match(/\b(?:\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/g) || [];
    return matches
        .map((value) => onlyDigits(value))
        .filter((value) => isValidCpf(value) || isValidCnpj(value))
        .map((value) => ({
        entity_type: 'document',
        value,
        normalized_value: value,
        confidence: 0.98,
        evidence_text: value,
    }));
}
function cleanName(value) {
    return String(value || '')
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function extractNameEntities(text) {
    const entities = [];
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    const ignored = /CPF|RG|CNPJ|LIVRO|FOLHA|FOLHAS|FLS|TERMO|REGISTRO|MATRICULA|MATRÍCULA|CARTORIO|CARTÓRIO|DATA|NASC|FALEC|SEXO|COR|ESTADO|CIVIL|NATURAL|PROFISSAO|PROFISSÃO|RESIDENTE|DOMICILIADO/i;
    const labeledPatterns = [
        /(?:^|\b)nome\s*[:\-]?\s*([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
        /(?:^|\b)compareceu\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
        /(?:^|\b)nasceu\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
        /(?:^|\b)falec(?:eu|ido|ida)\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
        /(?:^|\b)filh[ao]\s+(?:legitim[ao]\s+)?de\s+([A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ][A-Za-zÀ-ÖØ-öø-ÿ' ]{5,})/i,
    ];
    for (const line of lines) {
        for (const pattern of labeledPatterns) {
            const match = line.match(pattern);
            const name = cleanName(match?.[1] || '');
            const words = name.split(' ').filter(Boolean);
            if (words.length >= 2 && words.length <= 8 && !ignored.test(name)) {
                entities.push({
                    entity_type: 'name',
                    value: name,
                    normalized_value: normalizeSearchValue(name),
                    confidence: 0.86,
                    evidence_text: normalizeEvidence(line),
                });
            }
        }
    }
    if (!entities.length) {
        for (const line of lines) {
            const name = cleanName(line);
            const words = name.split(' ').filter(Boolean);
            if (words.length >= 2 && words.length <= 6 && name.length >= 8 && !/\d/.test(name) && !ignored.test(name)) {
                entities.push({
                    entity_type: 'name',
                    value: name,
                    normalized_value: normalizeSearchValue(name),
                    confidence: 0.62,
                    evidence_text: normalizeEvidence(line),
                });
            }
        }
    }
    return entities.slice(0, 20);
}
function lineLimitByRegion(region) {
    if (region === 'full_page')
        return Number.POSITIVE_INFINITY;
    if (region === 'upper_half')
        return 90;
    return 60;
}
function cropRatioByRegion(region) {
    if (region === 'full_page')
        return null;
    if (region === 'upper_half')
        return 0.5;
    return 0.35;
}
function minimumPriorityByRegion(region) {
    return region === 'full_page' ? 20 : 35;
}
function extractHeaderCandidates(text, source, options = {}) {
    const sheetCandidates = [];
    const termCandidates = [];
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    const lineLimit = lineLimitByRegion(options.extractionRegion);
    const headerLines = Number.isFinite(lineLimit) ? lines.slice(0, lineLimit) : lines;
    const positiveKeywords = normalizeKeywordList([
        ...DEFAULT_POSITIVE_KEYWORDS,
        ...(options.positiveKeywords || []),
    ]);
    const negativeKeywords = normalizeKeywordList([
        ...DEFAULT_NEGATIVE_KEYWORDS,
        ...(options.negativeKeywords || []),
    ]);
    const candidatePriority = (line, context) => {
        const normalizedLine = normalizeMatchText(line);
        const normalizedContext = normalizeMatchText(context);
        const searchableLine = normalizeMatchValue(line);
        const searchableContext = normalizeMatchValue(context);
        let priority = 0;
        if (/\bLIVRO\b/.test(normalizedContext))
            priority += 20;
        if (/\bFOLHAS?\b|\bFLS\b/.test(normalizedContext))
            priority += 20;
        if (/\bTERMO\b|\bREGISTRO\b|\bMATRICULA\b/.test(normalizedContext))
            priority += 20;
        if (/\bSERVICO\b|\bREGISTRAL\b|\bPESSOAS\b|\bNATURAIS\b|\bTRANSCRICAO\b/.test(normalizedContext))
            priority += 10;
        if (/\bFOLHAS?\s*:/.test(normalizedLine))
            priority += 20;
        if (/\bTERMO\s*:/.test(normalizedLine))
            priority += 20;
        if (/\bFOLHAS?\b.*\bTERMO\b|\bTERMO\b.*\bFOLHAS?\b/.test(normalizedLine))
            priority += 30;
        if (source.includes('level_2'))
            priority += 5;
        for (const keyword of positiveKeywords) {
            if (searchableLine.includes(keyword))
                priority += 12;
            else if (searchableContext.includes(keyword))
                priority += 6;
        }
        for (const keyword of negativeKeywords) {
            if (searchableLine.includes(keyword))
                priority -= 45;
            else if (searchableContext.includes(keyword))
                priority -= 15;
        }
        return priority;
    };
    for (const [lineIndex, line] of headerLines.entries()) {
        const context = headerLines
            .slice(Math.max(0, lineIndex - 2), Math.min(headerLines.length, lineIndex + 3))
            .join(' ');
        const priority = candidatePriority(line, context);
        const confidence = Math.max(0.2, Math.min(0.98, 0.55 + (priority / 100)));
        const sheetMatch = line.match(/(?:folhas?|fls?\.?)\s*[:nº°o.\-]*\s*([0-9OoIl\s.\-]{1,10})/i);
        const termMatch = line.match(/(?:termo|registro|matr[ií]cula)\s*[:nº°o.\-]*\s*([0-9OoIl\s.\-]{1,14})/i);
        if (sheetMatch?.[1] && normalizeDigitsText(sheetMatch[1])) {
            sheetCandidates.push({
                value: sheetMatch[1],
                confidence,
                evidence: normalizeEvidence(line),
                source,
                priority,
                lineIndex,
            });
        }
        if (termMatch?.[1] && normalizeDigitsText(termMatch[1])) {
            termCandidates.push({
                value: termMatch[1],
                confidence,
                evidence: normalizeEvidence(line),
                source,
                priority,
                lineIndex,
            });
        }
    }
    return { sheetCandidates, termCandidates };
}
async function buildTopCrop(fileBuffer, ratio) {
    const image = (0, sharp_1.default)(fileBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    if (!width || !height)
        return null;
    return (0, sharp_1.default)(fileBuffer)
        .extract({ left: 0, top: 0, width, height: Math.max(1, Math.floor(height * ratio)) })
        .grayscale()
        .normalize()
        .sharpen()
        .resize({ width: Math.min(width * 2, 2400), withoutEnlargement: false })
        .jpeg({ quality: 92 })
        .toBuffer();
}
async function buildRatioCrop(fileBuffer, crop) {
    const image = (0, sharp_1.default)(fileBuffer);
    const metadata = await image.metadata();
    const imageWidth = metadata.width || 0;
    const imageHeight = metadata.height || 0;
    if (!imageWidth || !imageHeight)
        return null;
    const left = Math.max(0, Math.floor(imageWidth * crop.left));
    const top = Math.max(0, Math.floor(imageHeight * crop.top));
    const width = Math.max(1, Math.min(imageWidth - left, Math.floor(imageWidth * crop.width)));
    const height = Math.max(1, Math.min(imageHeight - top, Math.floor(imageHeight * crop.height)));
    return (0, sharp_1.default)(fileBuffer)
        .extract({ left, top, width, height })
        .grayscale()
        .normalize()
        .sharpen()
        .resize({ width: Math.min(Math.max(width * 3, 900), 1800), withoutEnlargement: false })
        .jpeg({ quality: 92 })
        .toBuffer();
}
function firstCandidate(candidates, minimumPriority) {
    const candidate = candidates
        .sort((current, next) => {
        if (next.priority !== current.priority)
            return next.priority - current.priority;
        if (next.confidence !== current.confidence)
            return next.confidence - current.confidence;
        return current.lineIndex - next.lineIndex;
    })[0] || null;
    return candidate && candidate.priority >= minimumPriority ? candidate : null;
}
function buildCheckResult(fullText, sheet, term, defaultSource) {
    const detectedSheet = sheet ? normalizeNumber(sheet.value) : null;
    const detectedTerm = term ? normalizeDigitsText(term.value) || term.value : null;
    const confidence = Math.max(sheet?.confidence || 0, term?.confidence || 0);
    const evidenceText = normalizeEvidence([sheet?.evidence, term?.evidence].filter(Boolean).join(' | ')) || null;
    const source = sheet?.source || term?.source || defaultSource;
    const entities = uniqueEntities([
        ...extractDocumentEntities(fullText),
        ...extractNameEntities(fullText),
        ...(detectedSheet !== null
            ? [{
                    entity_type: 'sheet',
                    value: String(detectedSheet),
                    normalized_value: String(detectedSheet),
                    confidence: sheet?.confidence || 0.7,
                    evidence_text: sheet?.evidence || null,
                }]
            : []),
        ...(detectedTerm
            ? [{
                    entity_type: 'term',
                    value: detectedTerm,
                    normalized_value: normalizeSearchValue(detectedTerm),
                    confidence: term?.confidence || 0.7,
                    evidence_text: term?.evidence || null,
                }]
            : []),
    ]);
    return {
        detectedSheet,
        detectedTerm,
        confidence,
        confidenceLevel: confidenceLevel(confidence),
        evidenceText,
        source,
        entities,
    };
}
async function extractHeaderKeywordConference(fileBuffer, fileName, options = {}) {
    const fullText = await (0, googleVision_1.extractTextFromFileBuffer)(fileBuffer, fileName);
    const level1 = extractHeaderCandidates(fullText, 'google_vision_level_1', options);
    let sheetCandidates = [...level1.sheetCandidates];
    let termCandidates = [...level1.termCandidates];
    const cropRatio = cropRatioByRegion(options.extractionRegion);
    if (cropRatio) {
        const topCrop = await buildTopCrop(fileBuffer, cropRatio);
        if (topCrop) {
            const topText = await (0, googleVision_1.extractTextFromFileBuffer)(topCrop, fileName);
            const level2 = extractHeaderCandidates(topText, 'google_vision_level_2_top', options);
            sheetCandidates = [...sheetCandidates, ...level2.sheetCandidates];
            termCandidates = [...termCandidates, ...level2.termCandidates];
        }
    }
    const minimumPriority = minimumPriorityByRegion(options.extractionRegion);
    const sheet = firstCandidate(sheetCandidates, minimumPriority);
    const term = firstCandidate(termCandidates, minimumPriority);
    return buildCheckResult(fullText, sheet, term, 'google_vision_level_1');
}
exports.extractHeaderKeywordConference = extractHeaderKeywordConference;
function topNumberCropsByRegion(region) {
    const topRight = {
        source: 'google_vision_top_number_right',
        left: 0.68,
        top: 0,
        width: 0.32,
        height: 0.22,
        priority: 55,
    };
    const topLeft = {
        source: 'google_vision_top_number_left',
        left: 0,
        top: 0,
        width: 0.32,
        height: 0.22,
        priority: 55,
    };
    const topFull = {
        source: 'google_vision_top_number_full',
        left: 0,
        top: 0,
        width: 1,
        height: 0.18,
        priority: 25,
    };
    if (region === 'top_right')
        return [topRight, topFull];
    if (region === 'top_left')
        return [topLeft, topFull];
    if (region === 'top_full')
        return [topFull];
    return [topRight, topLeft, topFull];
}
function extractTopNumberCandidates(text, source, sourcePriority) {
    const candidates = [];
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    for (const [lineIndex, line] of lines.entries()) {
        const searchableLine = normalizeMatchValue(line);
        const letters = searchableLine.replace(/[0-9 ]/g, '');
        const rawMatches = line.match(/[0-9OoIl]{1,4}/g) || [];
        const numbers = rawMatches
            .map((value) => normalizeDigitsText(value))
            .filter((value) => value.length >= 1 && value.length <= 4);
        if (!numbers.length || rawMatches.length > 2 || letters.length > 2)
            continue;
        for (const value of numbers) {
            const number = Number(value);
            if (!Number.isInteger(number) || number <= 0)
                continue;
            let priority = sourcePriority;
            if (lineIndex <= 2)
                priority += 20;
            if (value.length <= 3)
                priority += 10;
            if (normalizeEvidence(line).length <= 8)
                priority += 20;
            if (source.includes('full'))
                priority -= 10;
            candidates.push({
                value,
                confidence: Math.max(0.2, Math.min(0.98, 0.55 + (priority / 100))),
                evidence: normalizeEvidence(line),
                source,
                priority,
                lineIndex,
            });
        }
    }
    return candidates;
}
async function extractTopIsolatedNumberConference(fileBuffer, fileName, options = {}) {
    const fullText = await (0, googleVision_1.extractTextFromFileBuffer)(fileBuffer, fileName);
    let sheetCandidates = [];
    for (const crop of topNumberCropsByRegion(options.extractionRegion)) {
        const croppedImage = await buildRatioCrop(fileBuffer, crop);
        if (!croppedImage)
            continue;
        const croppedText = await (0, googleVision_1.extractTextFromFileBuffer)(croppedImage, fileName);
        sheetCandidates = [
            ...sheetCandidates,
            ...extractTopNumberCandidates(croppedText, crop.source, crop.priority),
        ];
    }
    const sheet = firstCandidate(sheetCandidates, 50);
    return buildCheckResult(fullText, sheet, null, 'google_vision_top_number');
}
exports.extractTopIsolatedNumberConference = extractTopIsolatedNumberConference;
function compareNumberStatus(expected, detected) {
    if (detected === null || detected === undefined)
        return 'not_found';
    if (expected === null || expected === undefined || Number.isNaN(Number(expected)))
        return 'detected';
    return Number(expected) === Number(detected) ? 'match' : 'divergent';
}
exports.compareNumberStatus = compareNumberStatus;
function compareTermStatus(expected, detected) {
    const expectedValue = onlyDigits(String(expected || '')) || normalizeSearchValue(String(expected || ''));
    const detectedValue = onlyDigits(String(detected || '')) || normalizeSearchValue(String(detected || ''));
    if (!detectedValue)
        return 'not_found';
    if (!expectedValue)
        return 'detected';
    return expectedValue === detectedValue ? 'match' : 'divergent';
}
exports.compareTermStatus = compareTermStatus;
function normalizeOcrSearchValue(value) {
    return normalizeSearchValue(value);
}
exports.normalizeOcrSearchValue = normalizeOcrSearchValue;
//# sourceMappingURL=indexImageOcrConference.js.map