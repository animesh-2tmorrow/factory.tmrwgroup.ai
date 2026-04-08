export interface ChatHistoryItem {
    role: "USER" | "ASSISTANT";
    content: string;
}
export interface ChatTurnInput {
    message: string;
    history: ChatHistoryItem[];
    instructions?: string;
}
export interface ChatTurnUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
}
export interface ChatTurnResult {
    answer: string;
    model: string;
    usage: ChatTurnUsage;
    toolCalls: Array<{
        name: string;
        input: unknown;
        result: unknown;
    }>;
}
export declare function runChatTurn(input: ChatTurnInput): Promise<ChatTurnResult>;
