"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const BadRequestException_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Exceptions/BadRequestException"));
const Company_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Company"));
const ImageCertificate_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/ImageCertificate"));
const googledrive_1 = global[Symbol.for('ioc.use')]("App/Services/googleDrive/googledrive");
const AuditLogger_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Services/Audit/AuditLogger"));
const googleVision_1 = global[Symbol.for('ioc.use')]("App/Services/ocr/googleVision");
const uploadImages_1 = global[Symbol.for('ioc.use')]("App/Services/uploads/uploadImages");
class ImageCertificatesController {
    normalizeText(value) {
        return String(value || '')
            .replace(/\r/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }
    onlyDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }
    cleanValue(value) {
        return String(value || '')
            .replace(/^[\s:.-]+/, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }
    normalizeName(value) {
        const cleaned = this.cleanValue(value)
            .replace(/^(?:\d+[A-Z]?\s*)?(?:NOME\s*\/\s*NAME|NOME\s+E\s+SOBRENOME|NOME\s+CIVIL|NOME\s+COMPLETO|NOME|NAME|FILIA[CÇ][AÃ]O|PAI|M[ÃA]E)\b\s*[:\-]?/i, '')
            .replace(/\b(CPF|RG|REGISTRO|NASCIMENTO|DATA|SEXO|FILIA[CÇ][AÃ]O|VALIDADE)\b.*$/i, '')
            .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'\s]/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
        if (cleaned.length < 3)
            return null;
        const normalized = cleaned.toUpperCase();
        const ignoredCandidate = /(ATUALIZADO|VERIFIQUE|AUTENTICIDADE|QR\s*CODE|APP\s*VIO|HABILITA[CÇ][AÃ]O|CARTEIRA\s+NACIONAL|REP[ÚU]BLICA|MINIST[ÉE]RIO|SECRETARIA|V[ÁA]LIDA|TERRIT[ÓO]RIO|ASSINATURA|PORTADOR|HIST[ÓO]RICO|EMISS[ÕO]ES)/i;
        if (ignoredCandidate.test(normalized))
            return null;
        if (/^(?:E\s+)?SOBRENOME$|^(?:E\s+)?NOME\s+E\s+SOBRENOME$|^NAME$|^NOME$/i.test(normalized))
            return null;
        if (normalized.split(/\s+/).length < 2)
            return null;
        return normalized;
    }
    getLines(text) {
        return this.normalizeText(text)
            .split('\n')
            .map((line) => this.cleanValue(line))
            .filter(Boolean);
    }
    extractByLineLabel(lines, labels) {
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            for (const label of labels) {
                if (!label.test(line))
                    continue;
                const sameLine = this.cleanValue(line.replace(label, ''));
                if (sameLine)
                    return sameLine;
                for (let nextIndex = index + 1; nextIndex < Math.min(lines.length, index + 4); nextIndex++) {
                    const nextLine = this.cleanValue(lines[nextIndex]);
                    if (nextLine && !labels.some((item) => item.test(nextLine)))
                        return nextLine;
                }
            }
        }
        return null;
    }
    formatDateToIso(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b/);
        if (!match)
            return null;
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    }
    extractCpf(text) {
        const match = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
        return match ? this.onlyDigits(match[0]) : null;
    }
    extractDateBirth(lines, text) {
        const labeled = this.extractByLineLabel(lines, [
            /(?:DATA\s+DE\s+NASCIMENTO|NASCIMENTO|DATA\s+NASC\.?|DT\.?\s*NASC\.?)/i,
        ]);
        const labeledDate = this.formatDateToIso(labeled);
        if (labeledDate)
            return labeledDate;
        const match = text.match(/\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}\b/);
        return match ? this.formatDateToIso(match[0]) : null;
    }
    extractGender(lines) {
        const labeled = this.extractByLineLabel(lines, [/(?:SEXO|G[ÊE]NERO)/i]);
        const value = String(labeled || '').toUpperCase();
        if (/\b(M|MASC|MASCULINO)\b/.test(value))
            return 'M';
        if (/\b(F|FEM|FEMININO)\b/.test(value))
            return 'F';
        return null;
    }
    extractParents(lines) {
        let father = this.normalizeName(this.extractByLineLabel(lines, [/\bPAI\b/i]));
        let mother = this.normalizeName(this.extractByLineLabel(lines, [/\bM[ÃA]E\b/i]));
        const filiationIndex = lines.findIndex((line) => /FILIA[CÇ][AÃ]O/i.test(line));
        if (filiationIndex >= 0) {
            const stopLabels = /(NATURALIDADE|DATA|DOC\.?\s*ORIGEM|CPF|PIS|ASSINATURA|LEI|REGISTRO|VALIDADE|EXPEDI[CÇ][AÃ]O|NACIONALIDADE)/i;
            const sameLine = this.normalizeName(lines[filiationIndex].replace(/.*FILIA[CÇ][AÃ]O\s*[:\-]?/i, ''));
            const candidates = [];
            if (sameLine)
                candidates.push(sameLine);
            for (const line of lines.slice(filiationIndex + 1, filiationIndex + 7)) {
                if (stopLabels.test(line))
                    break;
                const name = this.normalizeName(line);
                if (name)
                    candidates.push(name);
            }
            if (!father && candidates[0])
                father = candidates[0];
            if (!mother && candidates[1])
                mother = candidates[1];
        }
        return { father, mother };
    }
    extractDocumentNumber(lines, text) {
        const labeled = this.extractByLineLabel(lines, [
            /\b(?:RG|REGISTRO\s+GERAL|DOC\.?\s*IDENTIDADE|DOC(?:UMENTO)?\.?\s+DE\s+IDENTIDADE|IDENTIDADE)\b/i,
        ]);
        const cleaned = this.cleanValue(labeled);
        if (cleaned && /\d/.test(cleaned)) {
            const identityMatch = cleaned.match(/\b[A-Z]{1,3}[-\s]?\d[\d.]{4,}[-\w]?\b/i);
            if (identityMatch)
                return identityMatch[0].replace(/\s/g, '');
            const cpfMatch = cleaned.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
            if (cpfMatch)
                return this.onlyDigits(cpfMatch[0]);
            const numericMatch = cleaned.match(/\b\d{1,2}\.?\d{3}\.?\d{3}[-\w]?\b/);
            if (numericMatch)
                return numericMatch[0];
        }
        const rgMatch = text.match(/\b(?:[A-Z]{1,3}[-\s]?)?\d{1,2}\.?\d{3}\.?\d{3}[-\w]?\b/);
        return rgMatch ? rgMatch[0] : null;
    }
    extractCnhDocumentNumber(lines, text) {
        const docIdentityIndex = lines.findIndex((line) => /DOC\.?\s*IDENTIDADE|DOC(?:UMENTO)?\.?\s+DE\s+IDENTIDADE/i.test(line));
        if (docIdentityIndex >= 0) {
            for (const line of lines.slice(docIdentityIndex, Math.min(lines.length, docIdentityIndex + 4))) {
                const identityMatch = line.match(/\b[A-Z]{1,3}[-\s]?\d[\d.]{4,}[-\w]?\b/i);
                if (identityMatch)
                    return identityMatch[0].replace(/\s/g, '');
            }
        }
        return this.extractDocumentNumber(lines, text);
    }
    extractNameByExactLabel(lines) {
        const nameLabel = /(?:^|\b)(?:\d+[A-Z]?\s*)?(?:NOME\s*\/\s*NAME|NOME\s+E\s+SOBRENOME|NOME\s+CIVIL|NOME\s+COMPLETO|NAME|NOME(?!\s+E\s+SOBRENOME))\s*[:\-]?\s*(.+)$/i;
        const isolatedNameLabel = /^\s*(?:\d+[A-Z]?\s*)?(?:NOME\s*\/\s*NAME|NOME\s+E\s+SOBRENOME|NOME\s+CIVIL|NOME\s+COMPLETO|NOME|NAME)\s*$/i;
        const stopLabels = /(CPF|REGISTRO|DATA|NASCIMENTO|NACIONALIDADE|NATURALIDADE|FILIA[CÇ][AÃ]O|DOC\.?|VALIDADE|EXPEDI[CÇ][AÃ]O|ASSINATURA|CARTEIRA|REP[ÚU]BLICA)/i;
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const sameLine = line.match(nameLabel);
            const sameLineName = this.normalizeName(sameLine?.[1]);
            if (sameLineName)
                return sameLineName;
            if (!isolatedNameLabel.test(line))
                continue;
            for (let nextIndex = index + 1; nextIndex < Math.min(lines.length, index + 4); nextIndex++) {
                if (stopLabels.test(lines[nextIndex]))
                    break;
                const nextLineName = this.normalizeName(lines[nextIndex]);
                if (nextLineName)
                    return nextLineName;
            }
        }
        return null;
    }
    extractCnhName(lines) {
        const nameLabelIndex = lines.findIndex((line) => /\bNOME\s+E\s+SOBRENOME\b/i.test(line));
        if (nameLabelIndex < 0)
            return null;
        const stopLabels = /(CPF|DATA|NASCIMENTO|VALIDADE|DOC\.?|IDENTIDADE|REGISTRO|FILIA[CÇ][AÃ]O|NACIONALIDADE|CAT\.?\s*HAB|ACC|LOCAL|EMISS[ÃA]O)/i;
        for (let nextIndex = nameLabelIndex + 1; nextIndex < Math.min(lines.length, nameLabelIndex + 6); nextIndex++) {
            if (stopLabels.test(lines[nextIndex]))
                break;
            const nextLineName = this.normalizeName(lines[nextIndex]);
            if (nextLineName)
                return nextLineName;
        }
        return null;
    }
    isCnhDocument(text, documentKind) {
        if (documentKind !== 'identity_document')
            return null;
        return /HABILITA[CÇ][AÃ]O|DRIVER\s*LICENSE|PERMISO\s+DE\s+CONDUCCI[ÓO]N|CARTEIRA\s+NACIONAL/i.test(text);
    }
    resolveDocumentType(_text, documentKind) {
        if (documentKind !== 'identity_document')
            return null;
        return 'RG';
    }
    extractName(lines) {
        const name = this.extractNameByExactLabel(lines);
        if (name)
            return name;
        const ignored = /(ATUALIZADO|VERIFIQUE|AUTENTICIDADE|QR\s*CODE|APP\s*VIO|REP[ÚU]BLICA|CARTEIRA|IDENTIDADE|HABILITA[CÇ][AÃ]O|CPF|REGISTRO|NASCIMENTO|VALIDADE|FILIA[CÇ][AÃ]O)/i;
        return lines.map((line) => this.normalizeName(line)).find((line) => line && !ignored.test(line)) || null;
    }
    extractNationality(lines) {
        const labeled = this.extractByLineLabel(lines, [/\bNACIONALIDADE\b/i]);
        const normalized = this.normalizeName(labeled);
        if (normalized)
            return normalized;
        const nationalityIndex = lines.findIndex((line) => /\bNACIONALIDADE\b/i.test(line));
        if (nationalityIndex < 0)
            return null;
        for (const line of lines.slice(nationalityIndex + 1, nationalityIndex + 4)) {
            const nationality = this.normalizeName(line);
            if (nationality)
                return nationality;
        }
        return null;
    }
    extractAddress(lines, text) {
        const zipMatch = text.match(/\b\d{5}-?\d{3}\b/);
        const zipCode = zipMatch ? this.onlyDigits(zipMatch[0]) : null;
        const address = this.extractByLineLabel(lines, [
            /\b(?:ENDERE[CÇ]O|LOGRADOURO|RUA|AVENIDA|AV\.?)\b/i,
        ]);
        const district = this.extractByLineLabel(lines, [/\b(?:BAIRRO)\b/i]);
        const cityState = this.extractByLineLabel(lines, [/\b(?:CIDADE|MUNIC[IÍ]PIO)\b/i]);
        const stateMatch = text.match(/\b(?:UF|ESTADO)\s*:?\s*([A-Z]{2})\b/i);
        return {
            zipCode,
            address: address ? this.cleanValue(address) : null,
            district: district ? this.cleanValue(district) : null,
            city: cityState ? this.cleanValue(cityState).replace(/\s*[-/]\s*[A-Z]{2}$/i, '') : null,
            state: stateMatch ? stateMatch[1].toUpperCase() : null,
        };
    }
    resolveTarget(description) {
        const key = String(description || '').toLowerCase();
        if (key.includes('groom'))
            return 'groom';
        if (key.includes('bride'))
            return 'bride';
        if (key.includes('witness1'))
            return 'witness1';
        if (key.includes('witness2'))
            return 'witness2';
        return null;
    }
    resolveDocumentKind(description) {
        const key = String(description || '').toLowerCase();
        if (key.includes('proofresidence'))
            return 'proof_residence';
        if (key.includes('birthcertificate'))
            return 'birth_certificate';
        if (key.includes('marriagecertificate'))
            return 'marriage_certificate';
        if (key.includes('document'))
            return 'identity_document';
        return 'unknown';
    }
    extractCertificateImageData(text, description) {
        const normalizedText = this.normalizeText(text);
        const lines = this.getLines(normalizedText);
        const documentKind = this.resolveDocumentKind(description);
        const targetPerson = this.resolveTarget(description);
        const { father, mother } = this.extractParents(lines);
        const address = this.extractAddress(lines, normalizedText);
        const isCnh = this.isCnhDocument(normalizedText, documentKind);
        const documentType = this.resolveDocumentType(normalizedText, documentKind);
        return {
            targetPerson,
            documentKind,
            person: {
                cpf: this.extractCpf(normalizedText),
                name: isCnh ? this.extractCnhName(lines) || this.extractName(lines) : this.extractName(lines),
                dateBirth: this.extractDateBirth(lines, normalizedText),
                gender: this.extractGender(lines),
                nationality: this.extractNationality(lines),
                father,
                mother,
                documentType,
                documentNumber: isCnh
                    ? this.extractCnhDocumentNumber(lines, normalizedText)
                    : this.extractDocumentNumber(lines, normalizedText),
                ...address,
            },
        };
    }
    async index({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const marriedCertificateId = Number(params.marriedCertificateId);
        if (!Number.isFinite(marriedCertificateId)) {
            return response.badRequest({ error: 'marriedCertificateId inválido' });
        }
        const images = await ImageCertificate_1.default.query()
            .where('companies_id', authenticate.companies_id)
            .andWhere('book_id', 2)
            .andWhere('married_certificate_id', marriedCertificateId)
            .orderBy('seq', 'asc');
        return response.ok({
            data: images.map((image) => ({
                id: image.id,
                seq: image.seq,
                ext: image.ext,
                fileName: image.fileName,
                file_name: image.fileName,
                description: image.description,
                path: image.path,
                indexText: image.indexText,
                index_text: image.indexText,
                extractedData: image.extractedData,
                extracted_data: image.extractedData,
                ready: image.ready,
                marriedCertificateId: image.marriedCertificateId,
                createdAt: image.createdAt,
            })),
        });
    }
    async show({ auth, params, response }) {
        const authenticate = await auth.use('api').authenticate();
        const id = Number(params.id);
        if (!Number.isFinite(id)) {
            return response.badRequest({ error: 'id inválido' });
        }
        const image = await ImageCertificate_1.default.query()
            .where('id', id)
            .andWhere('companies_id', authenticate.companies_id)
            .first();
        if (!image || !image.fileName) {
            return response.notFound({ error: 'Anexo não encontrado' });
        }
        const company = await Company_1.default.findOrFail(authenticate.companies_id);
        const folderName = image.path || `${company.foldername}.CERTIFICATES`;
        const parentFolder = await (0, googledrive_1.sendSearchFile)(folderName, company.cloud);
        if (!parentFolder.length) {
            return response.notFound({ error: 'Pasta dos anexos não encontrada no Google Drive' });
        }
        const driveFile = await (0, googledrive_1.sendSearchFile)(image.fileName, company.cloud, parentFolder[0].id);
        if (!driveFile.length) {
            return response.notFound({ error: 'Arquivo não encontrado no Google Drive' });
        }
        const extension = path_1.default.extname(image.fileName);
        const fileDownload = await (0, googledrive_1.sendDownloadFile)(driveFile[0].id, extension, company.cloud);
        return response.ok({
            fileDownload: fileDownload.dataURI,
            fileName: image.fileName,
            extension,
            size: fileDownload.size,
            description: image.description,
            seq: image.seq,
            indexText: image.indexText,
            index_text: image.indexText,
            extractedData: image.extractedData,
            extracted_data: image.extractedData,
        });
    }
    async visionOcr(ctx) {
        const { auth, params, response } = ctx;
        const authenticate = await auth.use('api').authenticate();
        const id = Number(params.id);
        if (!Number.isFinite(id)) {
            return response.badRequest({ error: 'id inválido' });
        }
        const image = await ImageCertificate_1.default.query()
            .where('id', id)
            .andWhere('companies_id', authenticate.companies_id)
            .first();
        if (!image || !image.fileName) {
            return response.notFound({ error: 'Anexo não encontrado' });
        }
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff', '.webp', '.pdf'];
        const extension = path_1.default.extname(image.fileName).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            return response.badRequest({
                error: 'Extensão não suportada no OCR síncrono',
            });
        }
        const company = await Company_1.default.findOrFail(authenticate.companies_id);
        const folderName = image.path || `${company.foldername}.CERTIFICATES`;
        const parentFolder = await (0, googledrive_1.sendSearchFile)(folderName, company.cloud);
        if (!parentFolder.length) {
            return response.notFound({ error: 'Pasta dos anexos não encontrada no Google Drive' });
        }
        const driveFile = await (0, googledrive_1.sendSearchFile)(image.fileName, company.cloud, parentFolder[0].id);
        if (!driveFile.length) {
            return response.notFound({ error: 'Arquivo não encontrado no Google Drive' });
        }
        const imageBuffer = await (0, googledrive_1.sendDownloadFileBuffer)(driveFile[0].id, company.cloud);
        const indexText = await (0, googleVision_1.extractTextFromFileBuffer)(imageBuffer, image.fileName);
        if (extension === '.pdf' && !String(indexText || '').trim()) {
            return response.badRequest({
                error: 'PDF sem texto pesquisável disponível para extração',
            });
        }
        const extractedData = this.extractCertificateImageData(indexText, image.description);
        image.indexText = indexText;
        image.extractedData = extractedData;
        image.ready = true;
        await image.save();
        await AuditLogger_1.default.record(ctx, {
            companiesId: authenticate.companies_id,
            userId: authenticate.id,
            action: 'imagecertificate_extract_text_manual',
            entityTable: 'image_certificates',
            entityId: image.id,
            resourceKey: `image_certificates:${image.id}:${image.fileName}`,
            entityKey: {
                id: image.id,
                married_certificate_id: image.marriedCertificateId,
                file_name: image.fileName,
            },
            description: `Usuário ${authenticate.name || authenticate.username} extraiu texto do anexo ${image.fileName}`,
            metadata: {
                file_name: image.fileName,
                text_length: indexText?.length || 0,
                target_person: extractedData.targetPerson,
                document_kind: extractedData.documentKind,
                ready: true,
            },
        });
        return response.ok({
            id: image.id,
            fileName: image.fileName,
            indexText,
            index_text: indexText,
            extractedData,
            extracted_data: extractedData,
            ready: image.ready,
        });
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        try {
            const companiesId = authenticate.companies_id;
            if (!companiesId) {
                return response.badRequest({ error: 'companyId inválido nos parâmetros da rota' });
            }
            const marriedCertificateIdInput = request.input('marriedCertificateId');
            const marriedCertificateId = marriedCertificateIdInput
                ? Number(marriedCertificateIdInput)
                : null;
            const file = request.file('file', {
                size: '15mb',
                extnames: ['jpg', 'png', 'jpeg', 'pdf', 'JPG', 'PNG', 'JPEG', 'PDF'],
            });
            if (!file) {
                return response.badRequest({ error: 'Arquivo inválido ou não enviado' });
            }
            const result = await (0, uploadImages_1.uploadImage)({
                companiesId,
                marriedCertificateId,
                file,
                description: request.input('description'),
            });
            if (!result) {
                return response.badRequest({ error: 'Arquivo inválido ou não enviado' });
            }
            return response.ok({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error(error);
            if (error instanceof BadRequestException_1.default) {
                throw error;
            }
            return response.internalServerError({
                error: 'Erro ao fazer upload da imagem',
                details: error.message,
            });
        }
    }
}
exports.default = ImageCertificatesController;
//# sourceMappingURL=ImageCertificatesController.js.map