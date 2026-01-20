
import React, { useState, ChangeEvent } from 'react';
import { ApiKeys, LocalLlmConfig } from '../types';

interface SettingsPageProps {
    initialKeys: ApiKeys;
    initialLlmConfig: LocalLlmConfig;
    onClose: () => void;
    onSave: (keys: ApiKeys, llmConfig: LocalLlmConfig) => void;
}

const ApiKeyInput: React.FC<{
    id: string;
    label: string;
    link: string;
    description: string;
    placeholder: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, link, description, placeholder, value, onChange }) => {
    const [isPassword, setIsPassword] = useState(true);
    return (
        <div className="mb-6">
            <label htmlFor={id} className="block mb-2">
                <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-[--text-color] hover:text-[--primary-color] transition-colors">
                    {label} <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                </a>
            </label>
            <p className="text-sm text-[--text-secondary-color] mb-2">{description}</p>
            <div className="relative flex items-center">
                <input
                    type={isPassword ? 'password' : 'text'}
                    id={id}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className="w-full p-3 bg-[--bg-color] border border-[--border-color] text-[--text-color] rounded-md focus:outline-none focus:border-[--primary-color] pr-10"
                />
                <button
                    type="button"
                    onClick={() => setIsPassword(!isPassword)}
                    className="absolute right-2 text-[--text-secondary-color] hover:text-[--text-color]"
                >
                    <i className={`fa-solid ${isPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
            </div>
        </div>
    );
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ initialKeys, initialLlmConfig, onClose, onSave }) => {
    const [keys, setKeys] = useState<ApiKeys>(initialKeys);
    const [llmConfig, setLlmConfig] = useState<LocalLlmConfig>(initialLlmConfig);
    const [activeTab, setActiveTab] = useState<'cloud' | 'local'>('cloud');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        const provider = id.replace('-key-input', '');
        setKeys(prev => ({ ...prev, [provider]: value }));
    };

    const handleLlmConfigChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setLlmConfig(prev => ({...prev, [id]: value}));
    };

    return (
        <div className="absolute inset-0 bg-[--bg-color] z-[1000] flex justify-center items-center p-4">
            <div className="bg-[--surface-color] w-full max-w-5xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                <header className="flex justify-between items-start p-6 border-b border-[--border-color] flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold">Settings</h2>
                        <p className="text-[--text-secondary-color] mt-1">Connect your API keys or a local LLM to unlock the full potential of AI Chain.</p>
                    </div>
                    <button onClick={onClose} className="text-2xl text-[--text-secondary-color] hover:text-[--text-color]">&times;</button>
                </header>

                <div className="p-6 border-b border-[--border-color]">
                    <div className="flex space-x-4">
                        <button onClick={() => setActiveTab('cloud')} className={`px-4 py-2 rounded-md font-semibold ${activeTab === 'cloud' ? 'bg-[--primary-color] text-white' : 'bg-transparent text-[--text-secondary-color] hover:bg-white/10'}`}>Cloud Keys</button>
                        <button onClick={() => setActiveTab('local')} className={`px-4 py-2 rounded-md font-semibold ${activeTab === 'local' ? 'bg-[--primary-color] text-white' : 'bg-transparent text-[--text-secondary-color] hover:bg-white/10'}`}>Local LLM</button>
                    </div>
                </div>

                <main className="flex-grow overflow-y-auto p-6">
                    {activeTab === 'cloud' && (
                        <div className="grid md:grid-cols-2 gap-x-8">
                            <fieldset className="border border-[--border-color] rounded-lg p-6 mb-6 md:mb-0 h-min">
                                <legend className="px-2 font-semibold">Essential</legend>
                                <ApiKeyInput id="openrouter-key-input" label="OpenRouter Key" link="https://openrouter.ai/keys" description='"Universal Key" - Access dozens of models (recommended).' placeholder="sk-or-v1..." value={keys.openrouter || ''} onChange={handleChange} />
                                <ApiKeyInput id="groq-key-input" label="Groq Key" link="https://console.groq.com/keys" description='"Sports Car" - Access the fastest models for instant answers.' placeholder="gsk_..." value={keys.groq || ''} onChange={handleChange} />
                            </fieldset>
                            <fieldset className="border border-[--border-color] rounded-lg p-6">
                                <legend className="px-2 font-semibold">Premium Power Access</legend>
                                <ApiKeyInput id="google-key-input" label="Google AI Key" link="https://aistudio.google.com/app/apikey" description='"Reliable Helper" - Direct access to Google Gemini models.' placeholder="AIzaSy..." value={keys.google || ''} onChange={handleChange} />
                                <ApiKeyInput id="openai-key-input" label="OpenAI Key" link="https://platform.openai.com/api-keys" description='"Industry Leader" - Access to GPT-4o, etc.' placeholder="sk-..." value={keys.openai || ''} onChange={handleChange} />
                                <ApiKeyInput id="anthropic-key-input" label="Anthropic Key" link="https://console.anthropic.com/dashboard" description='"The Challenger" - Access Claude 3.5 Sonnet.' placeholder="sk-ant-..." value={keys.anthropic || ''} onChange={handleChange} />
                                <ApiKeyInput id="cohere-key-input" label="Cohere Key" link="https://dashboard.cohere.com/api-keys" description='"The Enterprise Choice" - Access Command R+.' placeholder="..." value={keys.cohere || ''} onChange={handleChange} />
                                <ApiKeyInput id="mistral-key-input" label="Mistral Key" link="https://console.mistral.ai/" description='"The European Powerhouse" - Access Mistral Large.' placeholder="..." value={keys.mistral || ''} onChange={handleChange} />
                                <ApiKeyInput id="xai-key-input" label="Xai Key" link="https://x.ai/" description='"The Rebel" - Access to the Grok models.' placeholder="..." value={keys.xai || ''} onChange={handleChange} />
                                <ApiKeyInput id="alibaba-key-input" label="Alibaba Cloud Key" link="https://www.alibabacloud.com/product/model-studio" description='"The Tech Giant" - Access to Qwen models.' placeholder="..." value={keys.alibaba || ''} onChange={handleChange} />
                                <ApiKeyInput id="zhipu-key-input" label="Zhipu AI Key" link="https://open.bigmodel.cn/" description='"The Competitor" - Access to GLM-4 models.' placeholder="ID.SECRET" value={keys.zhipu || ''} onChange={handleChange} />
                                <ApiKeyInput id="moonshot-key-input" label="Moonshot AI Key" link="https://platform.moonshot.ai/console/api-keys" description='"The Context King" - Access Kimi models.' placeholder="..." value={keys.moonshot || ''} onChange={handleChange} />
                            </fieldset>
                        </div>
                    )}
                    {activeTab === 'local' && (
                        <div className="max-w-lg mx-auto">
                             <fieldset className="border border-[--border-color] rounded-lg p-6">
                                <legend className="px-2 font-semibold">Local LLM Setup (OpenAI-Compatible)</legend>
                                <p className="text-sm text-[--text-secondary-color] mb-6">Connect to a local AI model server like LM Studio, Ollama (with LiteLLM), or Jan. The server must expose an OpenAI-compatible API endpoint.</p>
                                <div>
                                    <label htmlFor="serverUrl" className="block mb-2 font-semibold text-[--text-color]">Server URL</label>
                                    <input type="text" id="serverUrl" placeholder="http://localhost:1234" value={llmConfig.serverUrl || ''} onChange={handleLlmConfigChange} className="w-full p-3 bg-[--bg-color] border border-[--border-color] text-[--text-color] rounded-md focus:outline-none focus:border-[--primary-color]" />
                                    <p className="text-xs text-[--text-secondary-color] mt-1">Include the base path, e.g., `http://localhost:1234/v1`</p>
                                </div>
                                <div className="mt-6">
                                    <label htmlFor="apiKey" className="block mb-2 font-semibold text-[--text-color]">API Key (optional)</label>
                                    <input type="password" id="apiKey" placeholder="Enter key if required" value={llmConfig.apiKey || ''} onChange={handleLlmConfigChange} className="w-full p-3 bg-[--bg-color] border border-[--border-color] text-[--text-color] rounded-md focus:outline-none focus:border-[--primary-color]" />
                                </div>
                             </fieldset>
                        </div>
                    )}
                </main>

                <footer className="p-6 border-t border-[--border-color] flex justify-end flex-shrink-0">
                    <button onClick={() => onSave(keys, llmConfig)} className="bg-[--primary-color] text-white py-2 px-6 font-semibold rounded-md hover:bg-[#3a80d2] transition-colors">
                        Save & Start
                    </button>
                </footer>
            </div>
        </div>
    );
};
