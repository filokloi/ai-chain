document.addEventListener('DOMContentLoaded', () => {
    // --- KONFIGURACIJA ---
    const GITHUB_WHITELIST_URL = 'https://raw.githubusercontent.com/filokloi/ai-chain-config/refs/heads/main/priority_models.json';

    // --- LOKALIZACIJA (i18n) ---
    const translations = {
        en: { 
            appTitle: "AI Chain", currentModelLabel: "Current:", fallbackModelLabel: "Fallback:", modelSelectionTitle: "Select a Model", messagePlaceholder: "Enter a message...", settingsTitle: "API Key Settings", settingsMotivation: "Connect your free API keys to unlock the full potential of AI Chain. Your keys are stored securely in your browser and never leave your device.", openrouterDescription: `"Universal Key" - Access to dozens of AI models (recommended).`, groqDescription: `"Sports Car" - Access to the fastest models for instant answers.`, googleDescription: `"Reliable Helper" - Direct access to Google's Gemini models.`, economy: "Economy", balanced: "Balanced", power: "Max. Power", saveButton: "Save & Start", notConfigured: "Not Configured", notAvailable: "None", aiThinking: "AI is thinking...", noModelsAvailable: "No AI models available.", limitReachedSwitching: (model) => `Limit reached. Switching to: **${model}**`, welcomeMessage: "Welcome! Start the conversation...", forceSwitchLabel: "Test Next Model", welcomeSlogan: "One chat, all free AI models, uninterrupted.", startChat: "Start Chatting", topModelsTitle: "Today's Top Models", allModelsFailed: "All models failed. Check API keys.", uploadImageTitle: "Upload Image", uploadDocTitle: "Upload Document (.txt)", historyTitle: "History", newChatLabel: "New Chat", newChatTitle: "Start a new conversation", searchHistoryPlaceholder: "Search...", clearHistoryLabel: "Clear History", invalidApiKeyError: (provider) => `Authentication failed for ${provider}. Please check your API key.`, today: "Today", yesterday: "Yesterday", last7Days: "Previous 7 Days", older: "Older", confirmClearHistory: "Delete all chat history? This cannot be undone.", confirmDeleteChat: "Delete this chat? This cannot be undone.", 
            essentialKeys: "Essential", 
            powerUserKeys: "Premium Power Access", 
            howToTitle: (provider) => `How to get a ${provider} key?`, helpPlaceholder: "Your AI assistant will prepare a visual guide (GIF) for this process soon. For now, please visit the provider's website to generate a new key and set spending limits to $0.", pinChat: "Pin", renameChat: "Rename", deleteChat: "Delete",
            openaiDescription: `"Industry Leader" - Access to GPT-4o, GPT-4 Turbo, etc.`,
            anthropicDescription: `"The Challenger" - Access to the Claude 3.5 Sonnet family.`,
            cohereDescription: `"The Enterprise Choice" - Access to Command R+ models.`,
            mistralDescription: `"The European Powerhouse" - Access to Mistral Large.`,
            alibabaDescription: `"The Tech Giant" - Access to Qwen models.`,
            zhipuDescription: `"The Competitor" - Access to GLM-4 models.`,
            moonshotDescription: `"The Context King" - Access to Kimi models.`
        },
        sr: { 
            appTitle: "AI Chain", currentModelLabel: "Trenutni:", fallbackModelLabel: "Rezerva:", modelSelectionTitle: "Odaberi Model", messagePlaceholder: "Unesite poruku...", settingsTitle: "Podešavanja API Ključeva", settingsMotivation: "Povežite vaše besplatne API ključeve da otključate pun potencijal AI Chain-a. Ključevi se čuvaju bezbedno u vašem browseru i nikada ne napuštaju vaš uređaj.", openrouterDescription: `"Univerzalni Ključ" - Pristup desetinama AI modela (preporučeno).`, groqDescription: `"Sportski Auto" - Pristup najbržim modelima za instant odgovore.`, googleDescription: `"Pouzdan Pomoćnik" - Direktan pristup Google Gemini modelima.`, economy: "Štednja", balanced: "Balans", power: "Maks. Snaga", saveButton: "Sačuvaj i Počni", notConfigured: "Nije Konfigurisan", notAvailable: "Nema", aiThinking: "AI razmišlja...", noModelsAvailable: "Nema dostupnih modela.", limitReachedSwitching: (model) => `Limit dostignut. Prebacujem na: **${model}**`, welcomeMessage: "Dobrodošli! Započnite konverzaciju...", forceSwitchLabel: "Testiraj Sledeći Model", welcomeSlogan: "Jedan čet, svi besplatni AI modeli.", startChat: "Započni Razgovor", topModelsTitle: "Današnji Top Modeli", allModelsFailed: "Svi modeli su otkazali. Proverite ključeve.", uploadImageTitle: "Otpremi Sliku", uploadDocTitle: "Otpremi Dokument (.txt)", historyTitle: "Istorija", newChatLabel: "Novi Razgovor", newChatTitle: "Započni novi razgovor", searchHistoryPlaceholder: "Pretraži...", clearHistoryLabel: "Obriši Istoriju", invalidApiKeyError: (provider) => `Autentifikacija za ${provider} nije uspela. Proverite ključ.`, today: "Danas", yesterday: "Juče", last7Days: "Prethodnih 7 dana", older: "Starije", confirmClearHistory: "Obrisati kompletnu istoriju? Ova akcija je nepovratna.", confirmDeleteChat: "Obrisati ovaj razgovor? Akcija je nepovratna.", 
            essentialKeys: "Esencijalni", 
            powerUserKeys: "Premium Power Pristup", 
            howToTitle: (provider) => `Kako doći do ${provider} ključa?`, helpPlaceholder: "Vaš AI asistent će uskoro pripremiti vizuelni vodič (GIF) za ovaj proces. Za sada, posetite sajt provajdera da generišete novi ključ i postavite limite potrošnje na $0.", pinChat: "Zakači", renameChat: "Preimenuj", deleteChat: "Obriši",
            openaiDescription: `"Industrijski Lider" - Pristup GPT-4o, GPT-4 Turbo, itd.`,
            anthropicDescription: `"Izazivač" - Pristup Claude 3.5 Sonnet familiji.`,
            cohereDescription: `"Poslovni Izbor" - Pristup Command R+ modelima.`,
            mistralDescription: `"Evropska Sila" - Pristup Mistral Large modelu.`,
            alibabaDescription: `"Tehnološki Gigant" - Pristup Qwen modelima.`,
            zhipuDescription: `"Konkurent" - Pristup GLM-4 modelima.`,
            moonshotDescription: `"Kralj Konteksta" - Pristup Kimi modelima.`
        },
    };

    // --- ELEMENTI ---
    const getEl = (id) => document.getElementById(id);
    const appContainer = getEl('app-container');
    const historyButton = getEl('history-button');
    const newChatButton = getEl('new-chat-button');
    const historyList = getEl('history-list');
    const historySearchInput = getEl('history-search-input');
    const clearHistoryButton = getEl('clear-history-button');
    const logoButton = getEl('logo-button');
    const settingsButton = getEl('settings-button');
    const settingsPage = getEl('settings-page');
    const closeSettingsButton = getEl('close-settings-button');
    const saveSettingsButton = getEl('save-settings-button');
    const langButton = getEl('lang-button');
    const langMenu = getEl('lang-menu');
    const forceSwitchButton = getEl('force-switch-button');
    const welcomeOverlay = getEl('welcome-overlay');
    const startChatButton = getEl('start-chat-button');
    const modelRankingList = getEl('model-ranking-list');
    const uploadButton = getEl('upload-button');
    const uploadOptions = getEl('upload-options');
    const uploadImageButton = getEl('upload-image-button');
    const uploadDocButton = getEl('upload-doc-button');
    const imageInputHidden = getEl('image-input-hidden');
    const docInputHidden = getEl('doc-input-hidden');
    const filePreviewContainer = getEl('file-preview-container');
    const intelligenceSlider = getEl('intelligence-slider');
    const messageForm = getEl('message-form');
    const messageInput = getEl('message-input');
    const messagesSection = getEl('messages-section');
    const currentModelNameEl = getEl('current-model-name');
    const fallbackModelsListEl = getEl('fallback-models-list');
    const modelSelectorButton = getEl('model-selector-button');
    const helpModal = getEl('help-modal');
    const closeHelpModalButton = getEl('close-help-modal-button');
    const helpModalTitle = getEl('help-modal-title');
    const helpModalBody = getEl('help-modal-body');
    const historyItemMenu = getEl('history-item-menu');
    const pinChatBtn = getEl('pin-chat-btn');
    const renameChatBtn = getEl('rename-chat-btn');
    const deleteChatBtn = getEl('delete-chat-btn');
    const modelSelectionModal = getEl('model-selection-modal');
    const modelSelectionList = getEl('model-selection-list');
    const closeModelSelectionButton = getEl('close-model-selection-button');

    // Inputi za API ključeve
    const openRouterKeyInput = getEl('openrouter-key-input');
    const groqKeyInput = getEl('groq-key-input');
    const googleKeyInput = getEl('google-key-input');
    const openaiKeyInput = getEl('openai-key-input');
    const anthropicKeyInput = getEl('anthropic-key-input');
    const cohereKeyInput = getEl('cohere-key-input');
    const mistralKeyInput = getEl('mistral-key-input');
    const alibabaKeyInput = getEl('alibaba-key-input');
    const zhipuKeyInput = getEl('zhipu-key-input');
    const moonshotKeyInput = getEl('moonshot-key-input');
    
    // --- STANJE Aplikacije ---
    let apiKeys = {};
    let currentModelStrategy = [];
    let currentModelIndex = 0;
    let isAIThinking = false;
    let attachedFile = null;
    let dynamicStrategies = {};
    let freemiumWhitelist = [];
    let currentLang = 'en';
    let allChats = [];
    let currentChatId = null;
    let conversationHistory = [];
    let activeContextMenuChatId = null;

    // --- FUNKCIJE ---
    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;
        const trans = translations[lang] || translations.en;

        document.querySelectorAll('[data-i18n-key], [data-i18n-placeholder-key], [data-i18n-title-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            const placeholderKey = el.dataset.i18nPlaceholderKey;
            const titleKey = el.dataset.i18nTitleKey;
            
            const targetKey = key || placeholderKey || titleKey;
            const translationSet = { ...translations.en, ...trans };
            if (!targetKey || !translationSet[targetKey]) return;

            const translation = typeof translationSet[targetKey] === 'function' ? translationSet[targetKey]('') : translationSet[targetKey];

            if (placeholderKey) el.placeholder = translation;
            else if (titleKey) el.title = translation;
            else {
                const icon = el.querySelector('i');
                const textSpan = el.querySelector('span');
                if (icon && textSpan) {
                     textSpan.textContent = ` ${translation}`;
                } else if (icon) {
                    el.innerHTML = `${icon.outerHTML} <span>${translation}</span>`;
                }
                 else {
                    el.textContent = translation;
                }
            }
        });
        
        const langLink = langMenu.querySelector(`a[data-lang="${lang}"]`);
        if (langLink) langButton.innerHTML = langLink.innerHTML;
        updateModelStatus();
        renderHistorySidebar(historySearchInput.value);
    }

    async function fetchWhitelist() {
        try {
            const response = await fetch(GITHUB_WHITELIST_URL, { cache: "no-store" });
            if (!response.ok) throw new Error('Network response was not ok for whitelist');
            const data = await response.json();
            return data.freemiumWhitelist || [];
        } catch (error) {
            console.error("Could not fetch freemium whitelist from GitHub.", error);
            return [];
        }
    }

    async function fetchAndBuildStrategies(whitelist) {
        freemiumWhitelist = whitelist;
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models');
            if (!response.ok) throw new Error('Failed to fetch model rankings');
            const { data } = await response.json();
            const allModels = data;

            const topModels = allModels.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, 15);
            modelRankingList.innerHTML = [...topModels, ...topModels].map(model => `<li><strong>${model.id.split('/')[0]}</strong> / ${model.id.split('/')[1]}</li>`).join('');

            const alwaysFreeModels = allModels.filter(m => (m.pricing.prompt === "0.000000" && m.pricing.completion === "0.000000") || m.id.endsWith(':free')).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
            const validWhitelist = freemiumWhitelist.map(id => allModels.find(m => m.id === id)).filter(Boolean);
            
            dynamicStrategies.power = [...new Set([...validWhitelist, ...alwaysFreeModels])];
            const groqModels = alwaysFreeModels.filter(m => m.id.includes('groq'));
            const otherFreeModels = alwaysFreeModels.filter(m => !m.id.includes('groq'));
            dynamicStrategies.balanced = [...new Set([...groqModels, ...validWhitelist, ...otherFreeModels])];
            dynamicStrategies.economy = [...alwaysFreeModels];
        } catch (error) {
            console.error("Could not build dynamic strategies.", error);
            dynamicStrategies = {};
        }
    }

    function handleModelSwitch(force = false) {
        if (currentModelStrategy.length > currentModelIndex + 1) {
            currentModelIndex++;
            updateModelStatus();
            if(!force) displayMessage(translations[currentLang].limitReachedSwitching(currentModelStrategy[currentModelIndex].id), "ai-system");
            return true;
        }
        if(!force) displayMessage(translations[currentLang].allModelsFailed, "ai-system");
        return false;
    }

    function updateModelStrategy() {
        const sliderValue = parseInt(intelligenceSlider.value, 10);
        let strategyKey = sliderValue <= 33 ? 'economy' : (sliderValue >= 67 ? 'power' : 'balanced');
        
        currentModelStrategy = (dynamicStrategies[strategyKey] || []).filter(modelInfo => {
            let provider = 'openrouter';
            if (modelInfo.id.includes('groq')) provider = 'groq';
            else if (modelInfo.id.startsWith('google/')) provider = 'google';
            return apiKeys[provider] && apiKeys[provider] !== '';
        });
        currentModelIndex = 0;
        updateModelStatus();
    }
    
    function updateModelStatus() {
        const trans = { ...translations.en, ...translations[currentLang] };
        if (currentModelStrategy.length > 0 && currentModelIndex < currentModelStrategy.length) {
            const current = currentModelStrategy[currentModelIndex];
            currentModelNameEl.textContent = `${current.id}`;
            
            const fallbacks = currentModelStrategy.slice(currentModelIndex + 1, currentModelIndex + 3);
            if (fallbacks.length > 0) {
                fallbackModelsListEl.textContent = fallbacks.map(m => m.id.split('/')[1]).join(', ');
            } else {
                fallbackModelsListEl.textContent = trans.notAvailable;
            }

            const isMultimodal = current.architecture?.modality === 'multimodal' || current.id.includes('vision') || current.id.includes('claude-3');
            uploadImageButton.disabled = !isMultimodal;
            uploadDocButton.disabled = false;
        } else {
            currentModelNameEl.textContent = trans.notConfigured;
            fallbackModelsListEl.textContent = trans.notAvailable;
            uploadImageButton.disabled = true;
            uploadDocButton.disabled = true;
        }
    }
    
    function displayMessage(text, sender, fileInfo = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        if (sender === 'user' && fileInfo) {
            const fileSize = (fileInfo.size / 1024).toFixed(1) + ' KB';
            messageDiv.innerHTML += `<div class="message-attachment"><i class="fa-solid fa-file-lines"></i> <span>${fileInfo.name} (${fileSize})</span></div>`;
        }
        if (text) {
            const textNode = document.createElement('div');
            if (sender === 'ai' || sender === 'ai-system') {
                textNode.innerHTML = marked.parse(text, { breaks: true });
            } else {
                const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                textNode.innerHTML = escapedText.replace(/\n/g, '<br>');
            }
            messageDiv.appendChild(textNode);
        }
        messagesSection.appendChild(messageDiv);
        messagesSection.scrollTop = messagesSection.scrollHeight;
    }

    function displayTypingIndicator() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-typing-message';
        messageDiv.innerHTML = `<div class="thinking-spinner"></div>`;
        messagesSection.appendChild(messageDiv);
        messagesSection.scrollTop = messagesSection.scrollHeight;
        return messageDiv;
    }
    
    function loadSettings() {
        apiKeys = JSON.parse(localStorage.getItem('apiKeys')) || {};
        openRouterKeyInput.value = apiKeys.openrouter || '';
        groqKeyInput.value = apiKeys.groq || '';
        googleKeyInput.value = apiKeys.google || '';
        openaiKeyInput.value = apiKeys.openai || '';
        anthropicKeyInput.value = apiKeys.anthropic || '';
        cohereKeyInput.value = apiKeys.cohere || '';
        mistralKeyInput.value = apiKeys.mistral || '';
        alibabaKeyInput.value = apiKeys.alibaba || '';
        zhipuKeyInput.value = apiKeys.zhipu || '';
        moonshotKeyInput.value = apiKeys.moonshot || '';
        
        intelligenceSlider.value = localStorage.getItem('intelligenceSlider') || '100';
    }
    
    function saveSettings() {
        apiKeys.openrouter = openRouterKeyInput.value.trim();
        apiKeys.groq = groqKeyInput.value.trim();
        apiKeys.google = googleKeyInput.value.trim();
        apiKeys.openai = openaiKeyInput.value.trim();
        apiKeys.anthropic = anthropicKeyInput.value.trim();
        apiKeys.cohere = cohereKeyInput.value.trim();
        apiKeys.mistral = mistralKeyInput.value.trim();
        apiKeys.alibaba = alibabaKeyInput.value.trim();
        apiKeys.zhipu = zhipuKeyInput.value.trim();
        apiKeys.moonshot = moonshotKeyInput.value.trim();

        localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
        localStorage.setItem('intelligenceSlider', intelligenceSlider.value);
        updateModelStrategy();
        settingsPage.classList.add('hidden');

        if (allChats.length === 0) {
            startNewChat();
        } else if (conversationHistory.length === 0) {
             messagesSection.innerHTML = '';
             displayMessage(translations[currentLang].welcomeMessage, 'ai-system');
        }

        if (currentModelStrategy.length === 0) {
            displayMessage(translations[currentLang].noModelsAvailable, "ai-system");
        }
    }

    function showFilePreview(file) {
        filePreviewContainer.innerHTML = '';
        const previewDiv = document.createElement('div');
        previewDiv.className = 'file-preview';
        if (file.type.startsWith('image/')) {
            previewDiv.innerHTML = `<img src="${file.data}" alt="preview">`;
        } else {
            previewDiv.innerHTML = `<i class="fa-solid fa-file-lines file-icon"></i>`;
        }
        previewDiv.innerHTML += `<span>${file.name}</span><button>&times;</button>`;
        previewDiv.querySelector('button').onclick = () => {
            attachedFile = null;
            filePreviewContainer.innerHTML = '';
        };
        filePreviewContainer.appendChild(previewDiv);
    }

    function handleFileSelect(event, fileType) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        if (fileType === 'doc') {
            if (file.type !== 'text/plain') return alert('Only .txt files are supported for now.');
            reader.onload = (e) => {
                attachedFile = { name: file.name, type: 'doc', content: e.target.result, size: file.size };
                showFilePreview({ name: file.name, type: 'doc' });
            };
            reader.readAsText(file);
        } else {
            reader.onload = (e) => {
                attachedFile = { name: file.name, type: 'image', data: e.target.result, size: file.size };
                showFilePreview(attachedFile);
            };
            reader.readAsDataURL(file);
        }
        event.target.value = null;
    }

    async function getAiResponse(userMessage) {
        if (currentModelStrategy.length === 0) {
            displayMessage(translations[currentLang].noModelsAvailable, "ai-system");
            return;
        }
        isAIThinking = true;
        const typingIndicator = displayTypingIndicator();
        
        let contentForApi = [];
        if (attachedFile?.type === 'image') contentForApi.push({ type: 'image_url', image_url: { url: attachedFile.data } });
        
        let finalUserMessage = userMessage;
        if (attachedFile?.type === 'doc') {
            finalUserMessage = `Based on the document:\n---\n${attachedFile.content}\n---\n\nMy question: ${userMessage}`;
        }
        if(finalUserMessage) contentForApi.push({ type: 'text', text: finalUserMessage });

        const historyEntry = { role: 'user', content: (contentForApi.length === 1 && contentForApi[0].type === 'text') ? finalUserMessage : contentForApi, fileInfo: attachedFile };
        const currentChat = allChats.find(c => c.id === currentChatId);
        currentChat.messages.push(historyEntry);

        const startingModelIndex = currentModelIndex;
        let success = false;
        while (!success) {
            const currentAttempt = currentModelStrategy[currentModelIndex];
            if (!currentAttempt) { displayMessage(translations[currentLang].allModelsFailed, 'ai-system'); break; }
            
            const model = currentAttempt.id;
            let provider = 'openrouter';
            if (model.includes('groq')) provider = 'groq';
            else if (model.startsWith('google/')) provider = 'google';
            const apiKey = apiKeys[provider];

            try {
                const endpoint = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
                const headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
                const body = { model: model, messages: currentChat.messages.map(({role, content}) => ({role, content})) };
                
                const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
                if (!response.ok) {
                    if(response.status === 401) throw new Error(`Status 401: Invalid API Key for ${provider}.`);
                    const errorData = await response.json();
                    throw new Error(`Status ${response.status}: ${errorData.error?.message || JSON.stringify(errorData)}`);
                }
                const data = await response.json();
                const aiMessage = data.choices?.[0]?.message?.content || "No response.";
                currentChat.messages.push({ role: 'assistant', content: aiMessage });
                displayMessage(aiMessage, 'ai');
                success = true;
            } catch (error) {
                console.error(`Error with ${model}:`, error);
                if (error.message.includes('Status 401')){
                    displayMessage(translations[currentLang].invalidApiKeyError(provider), 'ai-system');
                    break;
                } else if (!handleModelSwitch() || currentModelIndex === startingModelIndex) {
                    break; 
                }
            }
        }
        typingIndicator?.remove();
        isAIThinking = false;
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const userMessage = messageInput.value.trim();
        if ((!userMessage && !attachedFile) || isAIThinking) return;
        
        const currentChat = allChats.find(c => c.id === currentChatId);
        if (currentChat) {
             if (currentChat.messages.length === 0) {
                messagesSection.innerHTML = '';
                let title = (attachedFile ? `[${attachedFile.name}] ` : '') + userMessage;
                currentChat.title = title.substring(0, 35) + (title.length > 35 ? '...' : '');
            }
            currentChat.lastUpdated = Date.now();
        }
        
        displayMessage(userMessage, 'user', attachedFile);
        messageInput.value = '';
        messageInput.style.height = '24px';
        
        await getAiResponse(userMessage);
        
        saveAllChats();
        renderHistorySidebar();
    }
    
    function renderHistorySidebar(filter = '') {
        historyList.innerHTML = '';
        const trans = { ...translations.en, ...translations[currentLang] };
        const filteredChats = allChats
            .filter(chat => chat.title.toLowerCase().includes(filter.toLowerCase()));

        if (filteredChats.length === 0 && filter) {
            historyList.innerHTML = `<li class="no-results">No matches found.</li>`; return;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today); last7Days.setDate(last7Days.getDate() - 7);

        let groups = { today: [], yesterday: [], last7Days: [], older: [] };
        filteredChats.forEach(chat => {
            const chatDate = new Date(chat.lastUpdated);
            if (chatDate >= today) groups.today.push(chat);
            else if (chatDate >= yesterday) groups.yesterday.push(chat);
            else if (chatDate >= last7Days) groups.last7Days.push(chat);
            else groups.older.push(chat);
        });

        const sortChats = (chats) => {
            return chats.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || b.lastUpdated - a.lastUpdated);
        };

        const renderGroup = (titleKey, chats) => {
            if (chats.length === 0) return;
            historyList.innerHTML += `<h3>${trans[titleKey]}</h3>`;
            sortChats(chats).forEach(chat => {
                const li = document.createElement('li');
                li.dataset.chatId = chat.id;
                if (chat.id === currentChatId) li.classList.add('active');
                if (chat.isPinned) li.classList.add('pinned');
                
                li.innerHTML = `
                    <span class="chat-title">${chat.title}</span>
                    <button class="history-item-menu-button" title="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                `;
                historyList.appendChild(li);
            });
        };

        renderGroup('today', groups.today);
        renderGroup('yesterday', groups.yesterday);
        renderGroup('last7Days', groups.last7Days);
        renderGroup('older', groups.older);
    }

    function loadChat(chatId) {
        const chat = allChats.find(c => c.id === chatId);
        if (!chat) return;
        currentChatId = chatId;
        conversationHistory = chat.messages;
        messagesSection.innerHTML = '';
        if(conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                const content = typeof msg.content === 'string' ? msg.content : msg.content.find(c => c.type === 'text')?.text || '';
                displayMessage(content, msg.role, msg.fileInfo);
            });
        } else {
             displayMessage(translations[currentLang].welcomeMessage, 'ai-system');
        }
        updateModelStatus();
        renderHistorySidebar();
        appContainer.classList.remove('sidebar-open');
    }

    function startNewChat() {
        const newChat = { id: Date.now(), title: translations[currentLang]?.newChatLabel || "New Chat", lastUpdated: Date.now(), messages: [], isPinned: false };
        allChats.unshift(newChat);
        currentChatId = newChat.id;
        conversationHistory = newChat.messages;
        messagesSection.innerHTML = '';
        displayMessage(translations[currentLang].welcomeMessage, 'ai-system');
        saveAllChats();
        renderHistorySidebar();
        appContainer.classList.remove('sidebar-open');
        updateModelStatus();
    }

    function saveAllChats() {
        localStorage.setItem('ai-chain-all-chats', JSON.stringify(allChats));
    }

    function openModelSelectionModal() {
        if (currentModelStrategy.length === 0) return;
        modelSelectionList.innerHTML = '';

        currentModelStrategy.forEach((model, index) => {
            const modelOption = document.createElement('div');
            modelOption.className = 'model-option';
            modelOption.textContent = model.id;
            modelOption.dataset.index = index;
            if (index === currentModelIndex) {
                modelOption.classList.add('active');
            }
            modelSelectionList.appendChild(modelOption);
        });
        modelSelectionModal.classList.remove('hidden');
    }

    async function initializeApp() {
        const savedChats = localStorage.getItem('ai-chain-all-chats');
        
        loadSettings();
        
        const preferredLang = localStorage.getItem('preferredLanguage') || 'en';
        setLanguage(preferredLang);

        if (savedChats && JSON.parse(savedChats).length > 0) {
            allChats = JSON.parse(savedChats);
            const lastChat = allChats.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
            loadChat(lastChat.id);
        }
        
        if (!localStorage.getItem('hasOnboarded')) {
            welcomeOverlay.classList.add('visible');
        } else if (!savedChats || JSON.parse(savedChats).length === 0) {
            startNewChat();
        }
        
        const whitelist = await fetchWhitelist();
        await fetchAndBuildStrategies(whitelist);
        updateModelStrategy(); 
        renderHistorySidebar();
    }
    
    initializeApp();
    
    // --- EVENT LISTENERS ---
    
    intelligenceSlider.addEventListener('change', updateModelStrategy);
    messageForm.addEventListener('submit', handleFormSubmit);
    
    settingsButton.addEventListener('click', () => {
        appContainer.classList.remove('sidebar-open');
        settingsPage.classList.remove('hidden');
    });
    closeSettingsButton.addEventListener('click', () => settingsPage.classList.add('hidden'));
    saveSettingsButton.addEventListener('click', saveSettings);
    
    startChatButton.addEventListener('click', () => {
        welcomeOverlay.classList.remove('visible');
        localStorage.setItem('hasOnboarded', 'true');
        const anyKeyEntered = Object.values(apiKeys).some(key => key && key.trim() !== '');
        if (!anyKeyEntered) {
            settingsPage.classList.remove('hidden');
        } else if (allChats.length === 0) {
            startNewChat();
        }
    });

    logoButton.addEventListener('click', () => welcomeOverlay.classList.add('visible'));

    historyButton.addEventListener('click', () => appContainer.classList.toggle('sidebar-open'));
    
    newChatButton.addEventListener('click', startNewChat);

    historyList.addEventListener('click', (e) => {
        const menuButton = e.target.closest('.history-item-menu-button');
        if (menuButton) {
            e.stopPropagation();
            const li = menuButton.closest('li');
            activeContextMenuChatId = parseInt(li.dataset.chatId, 10);
            const rect = menuButton.getBoundingClientRect();
            historyItemMenu.style.top = `${rect.bottom}px`;
            historyItemMenu.style.left = `${rect.left - historyItemMenu.offsetWidth + rect.width}px`;
            historyItemMenu.classList.remove('hidden');
            return;
        }

        const targetLi = e.target.closest('li[data-chat-id]');
        if (targetLi) {
            const chatId = parseInt(targetLi.dataset.chatId, 10);
            if(chatId !== currentChatId) loadChat(chatId);
        }
    });

    historySearchInput.addEventListener('input', () => renderHistorySidebar(historySearchInput.value));
    
    clearHistoryButton.addEventListener('click', () => {
        const trans = { ...translations.en, ...translations[currentLang] };
        if (confirm(trans.confirmClearHistory)) {
            allChats = [];
            localStorage.removeItem('ai-chain-all-chats');
            startNewChat();
        }
    });
    
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = `${Math.min(messageInput.scrollHeight, 120)}px`;
    });

    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', (e) => {
            const input = e.currentTarget.closest('.password-input-wrapper').querySelector('input');
            const icon = e.currentTarget.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    document.querySelectorAll('.help-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const provider = e.currentTarget.dataset.provider;
            const trans = { ...translations.en, ...translations[currentLang] };
            helpModalTitle.textContent = trans.howToTitle(provider);
            helpModalBody.textContent = trans.helpPlaceholder;
            helpModal.classList.remove('hidden');
        });
    });
    
    closeHelpModalButton.addEventListener('click', () => helpModal.classList.add('hidden'));

    modelSelectorButton.addEventListener('click', openModelSelectionModal);
    closeModelSelectionButton.addEventListener('click', () => modelSelectionModal.classList.add('hidden'));
    
    modelSelectionList.addEventListener('click', (e) => {
        const modelOption = e.target.closest('.model-option');
        if (modelOption) {
            const newIndex = parseInt(modelOption.dataset.index, 10);
            currentModelIndex = newIndex;
            updateModelStatus();
            modelSelectionModal.classList.add('hidden');
        }
    });

    langButton.addEventListener('click', (e) => { e.stopPropagation(); langMenu.classList.toggle('hidden'); });
    document.addEventListener('click', (e) => {
        if (!langButton.contains(e.target) && !langMenu.contains(e.target)) langMenu.classList.add('hidden');
        if (!uploadButton.contains(e.target) && !uploadOptions.contains(e.target)) uploadOptions.classList.add('hidden');
        if (!e.target.closest('#history-item-menu')) {
            historyItemMenu.classList.add('hidden');
        }
        if (!e.target.closest('.modal-content') && !e.target.closest('#model-selector-button')) {
            modelSelectionModal.classList.add('hidden');
        }
    });

    langMenu.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.closest('a[data-lang]');
        if (target) {
            setLanguage(target.dataset.lang);
            langMenu.classList.add('hidden');
        }
    });
    
    forceSwitchButton.addEventListener('click', () => {
        if (!isAIThinking && currentModelStrategy.length > 1) handleModelSwitch(true);
    });
    
    uploadButton.addEventListener('click', (e) => { e.stopPropagation(); uploadOptions.classList.toggle('hidden'); });
    uploadImageButton.addEventListener('click', () => imageInputHidden.click());
    uploadDocButton.addEventListener('click', () => docInputHidden.click());
    imageInputHidden.addEventListener('change', (e) => handleFileSelect(e, 'image'));
    docInputHidden.addEventListener('change', (e) => handleFileSelect(e, 'doc'));

    pinChatBtn.addEventListener('click', () => {
        const chat = allChats.find(c => c.id === activeContextMenuChatId);
        if (chat) {
            chat.isPinned = !chat.isPinned;
            saveAllChats();
            renderHistorySidebar();
        }
        historyItemMenu.classList.add('hidden');
    });
    
    renameChatBtn.addEventListener('click', () => {
        const chat = allChats.find(c => c.id === activeContextMenuChatId);
        if (chat) {
            const trans = { ...translations.en, ...translations[currentLang] };
            const newTitle = prompt(trans.renameChat, chat.title);
            if (newTitle && newTitle.trim() !== '') {
                chat.title = newTitle.trim();
                saveAllChats();
                renderHistorySidebar();
            }
        }
        historyItemMenu.classList.add('hidden');
    });

    deleteChatBtn.addEventListener('click', () => {
        const trans = { ...translations.en, ...translations[currentLang] };
        if (confirm(trans.confirmDeleteChat)) {
            allChats = allChats.filter(c => c.id !== activeContextMenuChatId);
            saveAllChats();
            
            if (currentChatId === activeContextMenuChatId) {
                startNewChat();
            } else {
                renderHistorySidebar();
            }
        }
        historyItemMenu.classList.add('hidden');
    });
});