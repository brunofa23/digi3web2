"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOcrSearchValue = exports.compareTermStatus = exports.compareNumberStatus = exports.extractHeaderKeywordConference = void 0;
const sharp_1 = __importDefault(require("sharp"));
const googleVision_1 = require("./googleVision");
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
function normalizeNumber(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? Number(digits) : null;
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
function extractHeaderCandidates(text, source) {
    const sheetCandidates = [];
    const termCandidates = [];
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    const headerLines = lines.slice(0, 18);
    for (const line of headerLines) {
        const sheetMatch = line.match(/(?:folhas?|fls?\.?)\D{0,16}(\d{1,6})/i);
        const termMatch = line.match(/(?:termo|registro|matr[ií]cula)\D{0,20}(\d{1,8})/i);
        if (sheetMatch?.[1]) {
            sheetCandidates.push({
                value: sheetMatch[1],
                confidence: source.includes('level_2') ? 0.94 : 0.9,
                evidence: normalizeEvidence(line),
                source,
            });
        }
        if (termMatch?.[1]) {
            termCandidates.push({
                value: termMatch[1],
                confidence: source.includes('level_2') ? 0.94 : 0.9,
                evidence: normalizeEvidence(line),
                source,
            });
        }
    }
    return { sheetCandidates, termCandidates };
}
async function buildTopCrop(fileBuffer) {
    const image = (0, sharp_1.default)(fileBuffer);
    const metadata = await image.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    if (!width || !height)
        return null;
    return (0, sharp_1.default)(fileBuffer)
        .extract({ left: 0, top: 0, width, height: Math.max(1, Math.floor(height * 0.35)) })
        .grayscale()
        .normalize()
        .sharpen()
        .resize({ width: Math.min(width * 2, 2400), withoutEnlargement: false })
        .jpeg({ quality: 92 })
        .toBuffer();
}
function bestCandidate(candidates) {
    return candidates.sort((left, right) => right.confidence - left.confidence)[0] || null;
}
async function extractHeaderKeywordConference(fileBuffer, fileName) {
    const fullText = await (0, googleVision_1.extractTextFromFileBuffer)(fileBuffer, fileName);
    const level1 = extractHeaderCandidates(fullText, 'google_vision_level_1');
    let sheetCandidates = [...level1.sheetCandidates];
    let termCandidates = [...level1.termCandidates];
    if (!sheetCandidates.length || !termCandidates.length) {
        const topCrop = await buildTopCrop(fileBuffer);
        if (topCrop) {
            const topText = await (0, googleVision_1.extractTextFromFileBuffer)(topCrop, fileName);
            const level2 = extractHeaderCandidates(topText, 'google_vision_level_2_top');
            sheetCandidates = [...sheetCandidates, ...level2.sheetCandidates];
            termCandidates = [...termCandidates, ...level2.termCandidates];
        }
    }
    const sheet = bestCandidate(sheetCandidates);
    const term = bestCandidate(termCandidates);
    const detectedSheet = sheet ? normalizeNumber(sheet.value) : null;
    const detectedTerm = term ? onlyDigits(term.value) || term.value : null;
    const confidence = Math.max(sheet?.confidence || 0, term?.confidence || 0);
    const evidenceText = normalizeEvidence([sheet?.evidence, term?.evidence].filter(Boolean).join(' | ')) || null;
    const source = sheet?.source || term?.source || 'google_vision_level_1';
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
exports.extractHeaderKeywordConference = extractHeaderKeywordConference;
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