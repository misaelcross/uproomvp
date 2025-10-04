import { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
declare class WebSocketManager {
    private io;
    private connectedUsers;
    private userSockets;
    initialize(fastify: FastifyInstance): void;
    private broadcastUserStatus;
    notifyNewConversation(conversationId: string, participantIds: string[], companyId: string): void;
    notifyNewMessage(message: any, conversationId: string): void;
    getIO(): SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | null;
}
export declare const wsManager: WebSocketManager;
export {};
//# sourceMappingURL=websocket.d.ts.map