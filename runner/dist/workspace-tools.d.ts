export declare const WORKSPACE_TOOL_SPECS: ({
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: {
                type: string;
                properties: {
                    command: {
                        type: string;
                        description: string;
                    };
                    working_dir: {
                        type: string;
                        description: string;
                    };
                    path?: undefined;
                    content?: undefined;
                    url?: undefined;
                    headers?: undefined;
                    query?: undefined;
                    num_results?: undefined;
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
} | {
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: {
                type: string;
                properties: {
                    path: {
                        type: string;
                        description: string;
                    };
                    command?: undefined;
                    working_dir?: undefined;
                    content?: undefined;
                    url?: undefined;
                    headers?: undefined;
                    query?: undefined;
                    num_results?: undefined;
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
} | {
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: {
                type: string;
                properties: {
                    path: {
                        type: string;
                        description: string;
                    };
                    content: {
                        type: string;
                        description: string;
                    };
                    command?: undefined;
                    working_dir?: undefined;
                    url?: undefined;
                    headers?: undefined;
                    query?: undefined;
                    num_results?: undefined;
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
} | {
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: {
                type: string;
                properties: {
                    path: {
                        type: string;
                        description: string;
                    };
                    command?: undefined;
                    working_dir?: undefined;
                    content?: undefined;
                    url?: undefined;
                    headers?: undefined;
                    query?: undefined;
                    num_results?: undefined;
                };
                additionalProperties: boolean;
                required?: undefined;
            };
        };
    };
} | {
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: {
                type: string;
                properties: {
                    url: {
                        type: string;
                        description: string;
                    };
                    headers: {
                        type: string;
                        description: string;
                        additionalProperties: {
                            type: string;
                        };
                    };
                    command?: undefined;
                    working_dir?: undefined;
                    path?: undefined;
                    content?: undefined;
                    query?: undefined;
                    num_results?: undefined;
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
} | {
    toolSpec: {
        name: string;
        description: string;
        inputSchema: {
            json: {
                type: string;
                properties: {
                    query: {
                        type: string;
                        description: string;
                    };
                    num_results: {
                        type: string;
                        description: string;
                    };
                    command?: undefined;
                    working_dir?: undefined;
                    path?: undefined;
                    content?: undefined;
                    url?: undefined;
                    headers?: undefined;
                };
                required: string[];
                additionalProperties: boolean;
            };
        };
    };
})[];
export interface ToolResult {
    success: boolean;
    output?: unknown;
    error?: string;
}
export declare function executeShellCommand(command: string, workingDir?: string): Promise<ToolResult>;
export declare function executeReadFile(path: string): Promise<ToolResult>;
export declare function executeWriteFile(path: string, content: string): Promise<ToolResult>;
export declare function executeListDir(path?: string): Promise<ToolResult>;
export declare function executeWebFetch(url: string, headers?: Record<string, string>): Promise<ToolResult>;
export declare function executeWebSearch(query: string, numResults?: number): Promise<ToolResult>;
export declare function invokeWorkspaceTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
