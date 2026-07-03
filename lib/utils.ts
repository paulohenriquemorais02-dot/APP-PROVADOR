/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(error: unknown, context: string): string {
    if (error instanceof Error) {
        const message = error.message;

        if (message.includes('Unsupported MIME type')) {
            return 'Formato de arquivo não suportado. Por favor, use um formato como PNG, JPEG ou WEBP.';
        }

        if (message.includes('quota')) {
            return 'A IA está temporariamente indisponível por excesso de uso. Tente novamente em alguns minutos.';
        }

        if (message.includes('chave da API Gemini') || message.includes('não está configurada')) {
            return 'A chave da API Gemini não está configurada corretamente. Verifique o arquivo .env.local.';
        }

        if (message.includes('não está disponível') || message.includes('modelo')) {
            return 'O modelo de imagem solicitado não está disponível no momento. Tente novamente mais tarde.';
        }

        if (message.includes('expirou') || message.includes('demorou demais')) {
            return 'A geração demorou demais e foi interrompida. Tente novamente.';
        }

        if (message.includes('rede') || message.includes('conexão')) {
            return 'Não foi possível conectar com a IA neste momento. Verifique sua conexão e tente novamente.';
        }

        return `${context}. ${message}`;
    }

    if (typeof error === 'string') {
        return `${context}. ${error}`;
    }

    return `${context}. Ocorreu um erro inesperado.`;
}