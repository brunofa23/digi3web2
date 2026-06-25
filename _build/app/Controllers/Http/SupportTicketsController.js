"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const luxon_1 = require("luxon");
const SupportTicket_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/SupportTicket"));
const requestTypes = ['duvida', 'erro', 'solicitacao'];
const ticketStatuses = ['aberto', 'em_atendimento', 'resolvido'];
const requestTypeLabels = {
    duvida: 'Duvida',
    erro: 'Erro',
    solicitacao: 'Solicitacao',
};
class SupportTicketsController {
    serialize(ticket, showPrivateNotes) {
        const data = ticket.serialize();
        if (!showPrivateNotes) {
            delete data.private_notes;
            delete data.privateNotes;
        }
        return data;
    }
    historyItem(userName, role, message) {
        const date = luxon_1.DateTime.now().setZone('America/Sao_Paulo').toFormat('dd/MM/yyyy HH:mm');
        return `[${date}] ${userName} (${role})\n${message.trim()}`;
    }
    appendHistory(ticket, item) {
        ticket.history = ticket.history
            ? `${ticket.history}\n\n${item}`
            : item;
    }
    markInteraction(ticket, interactionBy) {
        ticket.lastInteractionBy = interactionBy;
        ticket.lastInteractionAt = luxon_1.DateTime.now();
        ticket.pendingResponseFrom = interactionBy === 'client' ? 'support' : 'client';
    }
    async index({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const { companies_id, status, request_type, pending_response_from } = request.only([
            'companies_id',
            'status',
            'request_type',
            'pending_response_from',
        ]);
        const query = SupportTicket_1.default.query()
            .preload('company')
            .preload('user')
            .preload('assignedUser')
            .orderBy('opened_at', 'desc');
        if (authenticate.superuser) {
            if (companies_id)
                query.where('companies_id', companies_id);
        }
        else {
            query.where('companies_id', authenticate.companies_id);
        }
        if (status)
            query.where('status', status);
        if (request_type)
            query.where('request_type', request_type);
        if (pending_response_from)
            query.where('pending_response_from', pending_response_from);
        const tickets = await query;
        return response.status(200).send(tickets.map((ticket) => this.serialize(ticket, Boolean(authenticate.superuser))));
    }
    async store({ auth, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const validationSchema = Validator_1.schema.create({
            request_type: Validator_1.schema.enum(requestTypes),
            contact: Validator_1.schema.string({ trim: true }, [
                Validator_1.rules.maxLength(120),
            ]),
            description: Validator_1.schema.string({ trim: true }, [
                Validator_1.rules.maxLength(5000),
            ]),
        });
        const payload = await request.validate({ schema: validationSchema });
        const ticket = await SupportTicket_1.default.create({
            companiesId: authenticate.companies_id,
            usersId: authenticate.id,
            assignedUsersId: null,
            requestType: payload.request_type,
            contact: payload.contact,
            status: 'aberto',
            pendingResponseFrom: 'support',
            lastInteractionBy: 'client',
            lastInteractionAt: luxon_1.DateTime.now(),
            description: payload.description,
            openedAt: luxon_1.DateTime.now(),
        });
        const requestType = requestTypeLabels[payload.request_type];
        const openingMessage = [
            `Chamado aberto.`,
            `Tipo: ${requestType}`,
            `Contato: ${payload.contact}`,
            '',
            payload.description,
        ].join('\n');
        this.appendHistory(ticket, this.historyItem(authenticate.name || authenticate.username, 'Cliente', openingMessage));
        await ticket.save();
        await ticket.load('company');
        await ticket.load('user');
        await ticket.load('assignedUser');
        return response.status(201).send(this.serialize(ticket, Boolean(authenticate.superuser)));
    }
    async update({ auth, params, request, response }) {
        const authenticate = await auth.use('api').authenticate();
        const ticket = await SupportTicket_1.default.find(params.id);
        if (!ticket) {
            return response.status(404).send({ message: 'Chamado não encontrado' });
        }
        if (!authenticate.superuser && ticket.companiesId !== authenticate.companies_id) {
            return response.status(403).send({ message: 'Chamado indisponível para esta empresa' });
        }
        const validationSchema = Validator_1.schema.create({
            status: Validator_1.schema.enum.optional(ticketStatuses),
            message: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(5000),
            ]),
            private_notes: Validator_1.schema.string.optional({ trim: true }, [
                Validator_1.rules.maxLength(5000),
            ]),
        });
        const payload = await request.validate({ schema: validationSchema });
        if (!authenticate.superuser && (payload.status || payload.private_notes !== undefined)) {
            return response.status(403).send({ message: 'Apenas super usuário pode tratar o chamado' });
        }
        if (authenticate.superuser && payload.status) {
            const statusChanged = payload.status !== ticket.status;
            ticket.status = payload.status;
            ticket.resolvedAt = payload.status === 'resolvido' ? luxon_1.DateTime.now() : null;
            if (payload.status === 'resolvido') {
                ticket.pendingResponseFrom = null;
            }
            if (statusChanged) {
                this.appendHistory(ticket, this.historyItem(authenticate.name || authenticate.username, 'Atendimento', `Status alterado para ${payload.status}.`));
            }
        }
        if (payload.message) {
            if (!authenticate.superuser && ticket.status === 'resolvido') {
                ticket.status = 'aberto';
                ticket.resolvedAt = null;
            }
            this.appendHistory(ticket, this.historyItem(authenticate.name || authenticate.username, authenticate.superuser ? 'Atendimento' : 'Cliente', payload.message));
            this.markInteraction(ticket, authenticate.superuser ? 'support' : 'client');
            if (authenticate.superuser && payload.status === 'resolvido') {
                ticket.pendingResponseFrom = null;
            }
        }
        if (authenticate.superuser && payload.private_notes !== undefined) {
            ticket.privateNotes = payload.private_notes || null;
        }
        if (authenticate.superuser && !ticket.assignedUsersId) {
            ticket.assignedUsersId = authenticate.id;
        }
        await ticket.save();
        await ticket.load('company');
        await ticket.load('user');
        await ticket.load('assignedUser');
        return response.status(200).send(this.serialize(ticket, Boolean(authenticate.superuser)));
    }
}
exports.default = SupportTicketsController;
//# sourceMappingURL=SupportTicketsController.js.map