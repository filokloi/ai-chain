import React from 'react';

interface WelcomeOverlayProps {
    onStart: () => void;
}

const TOP_MODELS = ["openai/gpt-4o", "anthropic/claude-3.5-sonnet", "cohere/command-r-plus", "google/gemini-1.5-pro", "mistralai/mistral-large", "meta-llama/llama-3-70b-instruct", "groq/mixtral-8x7b-32768", "openai/gpt-3.5-turbo"];

export const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onStart }) => {
    return (
        <div className="absolute inset-0 bg-[#1a1a1a]/95 z-[2000] grid grid-cols-1 md:grid-cols-5 items-center gap-8 p-4 md:p-16">
            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left col-span-3">
                <div className="flex items-center gap-4 mb-6">
                    <i className="fa-solid fa-link text-4xl text-[--primary-color]"></i>
                    <h1 className="text-5xl font-bold">AI Chain</h1>
                </div>
                <p className="text-2xl text-[--text-secondary-color] mb-8 max-w-lg">
                    One chat, all free AI models, uninterrupted.
                </p>
                <button onClick={onStart} className="bg-[--primary-color] text-white py-3 px-8 text-lg font-semibold rounded-full hover:bg-[#3a80d2] transition-colors">
                    Start Chatting
                </button>
            </div>

            <div className="p-8 bg-[--surface-color] rounded-xl h-[70vh] overflow-hidden relative col-span-2 hidden md:block">
                <h3 className="text-center text-xl font-bold mb-6 pb-4 border-b border-[--border-color]">Today's Top Models</h3>
                <div className="h-full relative overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)' }}>
                    <ul className="absolute w-full animate-scroll-up">
                        {[...TOP_MODELS, ...TOP_MODELS].map((model, index) => (
                            <li key={index} className="py-3 text-lg text-center text-[--text-secondary-color] opacity-70">
                                <strong className="text-[--text-color] font-medium">{model.split('/')[0]}</strong> / {model.split('/')[1]}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {/* FIX: Removed non-standard `jsx` prop from style tag. */}
            <style>{`
                @keyframes scroll-up {
                    0% { transform: translateY(0%); }
                    100% { transform: translateY(-50%); }
                }
                .animate-scroll-up {
                    animation: scroll-up 30s linear infinite;
                }
            `}</style>
        </div>
    );
};
